import type { AccessTokensUserProviderContract } from '@adonisjs/auth/types/access_tokens'
import type { Secret } from '@adonisjs/core/helpers'
import type { AccessToken as DbAccessToken } from '#prisma'

import { AccessToken } from '@adonisjs/auth/access_tokens'
import { prisma } from '@galadrim/adonis-prisma/services'
import { SessionPrismaUserProvider } from '../session_guard/user_provider.js'
import { ExtendedModels, Id, ModelData } from '../types.js'
import { getModelPrimaryKey } from '../utils.js'

const ACCESS_TOKEN_PREFIX = 'oat_'

const dbRowAccessTokenAttributes = (dbToken: DbAccessToken) => {
  return {
    name: '',
    tokenableId: dbToken.userId,
    abilities: ['*'],
    expiresAt: dbToken.expiresAt,
    hash: dbToken.hash,
    identifier: dbToken.id,
    lastUsedAt: dbToken.lastUsedAt,
    prefix: ACCESS_TOKEN_PREFIX,
    type: 'access_token',
    updatedAt: dbToken.updatedAt,
    createdAt: dbToken.createdAt,
  }
}

export class AccessTokensPrismaUserProvider<Model extends ExtendedModels>
  extends SessionPrismaUserProvider<Model>
  implements AccessTokensUserProviderContract<ModelData<Model>>
{
  async createToken(
    user: ModelData<Model>,
    _abilities?: string[],
    options?: { expiresIn?: number | string; name?: string }
  ): Promise<AccessToken> {
    const primaryKey = getModelPrimaryKey(this.model)
    const transientToken = AccessToken.createTransientToken(
      user[primaryKey] as Id,
      64,
      options?.expiresIn
    )

    const dbToken = await prisma.accessToken.create({
      data: {
        userId: user[primaryKey] as string,
        expiresAt: transientToken.expiresAt,
        hash: transientToken.hash,
        lastUsedAt: null,
      },
    })

    return new AccessToken({
      ...dbRowAccessTokenAttributes(dbToken),
      secret: transientToken.secret,
    })
  }

  async invalidateToken(tokenValue: Secret<string>): Promise<boolean> {
    const decodedToken = AccessToken.decode(ACCESS_TOKEN_PREFIX, tokenValue.release())
    if (!decodedToken) return false

    await prisma.accessToken.delete({ where: { id: decodedToken.identifier } })

    return true
  }

  async verifyToken(tokenValue: Secret<string>): Promise<AccessToken | null> {
    const decodedToken = AccessToken.decode(ACCESS_TOKEN_PREFIX, tokenValue.release())
    if (!decodedToken) return null

    const dbToken = await prisma.accessToken.findUnique({ where: { id: decodedToken.identifier } })
    if (!dbToken) return null

    // Update DB
    await prisma.accessToken.update({
      data: {
        lastUsedAt: dbToken.updatedAt,
      },
      where: { id: dbToken.id },
    })

    // Create access token instance
    const accessToken = new AccessToken(dbRowAccessTokenAttributes(dbToken))

    // Ensure the token secret matches the token hash
    if (!accessToken.verify(decodedToken.secret) || accessToken.isExpired()) {
      return null
    }

    return accessToken
  }
}
