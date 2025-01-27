import type { Hash } from '@adonisjs/core/hash'

import { errors } from '@adonisjs/auth'
import hash from '@adonisjs/core/services/hash'
import { Prisma, PrismaClient } from '@prisma/client'
import { ModelConfig } from './define_config.js'
import {
  ExtendedPrismaClient,
  GenericPrismaModel,
  HashConfig,
  ModelData,
  ModelExtensions,
  QueryExtensions,
  ResolvedConfig,
} from './types.js'
import { getArrayOfKeys, getModelConfig } from './utils.js'

export const withAuthFinder = (
  hashService: () => Hash,
  prismaConfig: ResolvedConfig,
  prismaClient: PrismaClient
) => {
  return Prisma.defineExtension({
    model: getArrayOfKeys(prismaConfig).reduce<ModelExtensions>(
      (acc, model) => ({
        ...acc,
        [model]: {
          async findForAuth(value): Promise<ModelData<typeof model> | null> {
            return (prismaClient[model] as unknown as GenericPrismaModel<typeof model>).findFirst({
              where: {
                OR: (prismaConfig[model] as ModelConfig<typeof model>).uniqueIds.map((uid) => ({
                  [uid]: value,
                })),
              },
            })
          },
          async verifyCredentials(uid, password) {
            const user = await this.findForAuth(uid)
            if (!user) {
              await hashService().make(password)
              throw new errors.E_INVALID_CREDENTIALS('Invalid user credentials')
            }

            const { password: userPassword, ...userWithoutPassword } = user

            if (await hashService().verify(userPassword, password)) {
              return userWithoutPassword
            }

            throw new errors.E_INVALID_CREDENTIALS('Invalid user credentials')
          },
        },
      }),
      {} as ModelExtensions
    ),
    query: getArrayOfKeys(prismaConfig).reduce<QueryExtensions>(
      (acc, model) => ({
        ...acc,
        [model]: {
          async create({ args, query }) {
            args.data = { ...args.data, password: await hashService().make(args.data.password) }
            return query(args)
          },
          async findFirst({ args, query }) {
            const result = await query(args)
            if (getModelConfig(model, prismaConfig).sanitizePassword) {
              delete result?.password
            }
            return result
          },
          async findFirstOrThrow({ args, query }) {
            const result = await query(args)
            if (getModelConfig(model, prismaConfig).sanitizePassword) {
              delete result.password
            }
            return result
          },
          async findMany({ args, query }) {
            const results = await query(args)
            results.forEach((result: Partial<ModelData<typeof model>>) => {
              if (getModelConfig(model, prismaConfig).sanitizePassword) {
                delete result.password
              }
            })
            return results
          },
          async findUnique({ args, query }) {
            const result = await query(args)
            if (getModelConfig(model, prismaConfig).sanitizePassword) {
              delete result?.password
            }
            return result
          },
          async findUniqueOrThrow({ args, query }) {
            const result = await query(args)
            if (getModelConfig(model, prismaConfig).sanitizePassword) {
              delete result.password
            }
            return result
          },
        },
      }),
      {} as QueryExtensions
    ),
  })
}

export function generatePrismaClient(
  prismaConfig: ResolvedConfig,
  hashConfig: HashConfig,
  prismaClient: PrismaClient
) {
  return prismaClient.$extends(
    withAuthFinder(() => hash.use(hashConfig.default), prismaConfig, prismaClient)
  ) as ExtendedPrismaClient
}
