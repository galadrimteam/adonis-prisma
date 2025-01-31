import type { SessionGuardUser, SessionUserProviderContract } from '@adonisjs/auth/types/session'

import { symbols } from '@adonisjs/auth'
import app from '@adonisjs/core/services/app'
import { ExtendedModels, GenericPrismaModel, ModelData } from './types.js'
import { getModelConfig, getModelPrimaryKey } from './utils.js'
import config from '@adonisjs/core/services/config'
import { PrismaConfig } from './define_config.js'

export type SessionUser<Model extends ExtendedModels> = Omit<ModelData<Model>, 'password'>

type Id = string | number | BigInt

export class SessionPrismaUserProvider<Model extends ExtendedModels>
  implements SessionUserProviderContract<SessionUser<Model>>
{
  declare [symbols.PROVIDER_REAL_USER]: SessionUser<Model>

  constructor(protected model: Model) {}

  async createUserForGuard(
    user: SessionUser<Model>
  ): Promise<SessionGuardUser<SessionUser<Model>>> {
    const primaryKey = getModelPrimaryKey(this.model)
    return {
      getId() {
        return user[primaryKey] as Id
      },
      getOriginal() {
        return user
      },
    }
  }

  async findById(identifier: Id): Promise<null | SessionGuardUser<SessionUser<Model>>> {
    const prisma = await app.container.make('prisma:db')
    const prismaConfig = getModelConfig(this.model, config.get<PrismaConfig>('prisma'))

    const user = await (prisma[this.model] as GenericPrismaModel<typeof this.model>).findUnique({
      where: { [getModelPrimaryKey(this.model)]: identifier },
    })

    if (!user) {
      return null
    }

    delete user[prismaConfig.passwordColumnName]

    return this.createUserForGuard(user as SessionUser<Model>)
  }
}
