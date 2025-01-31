import { errors } from '@adonisjs/auth'
import { Prisma, PrismaClient } from '@prisma/client'
import {
  ExtendedPrismaClient,
  GenericPrismaModel,
  ModelExtensions,
  QueryExtensions,
  ResolvedConfig,
} from '../types.js'
import { getArrayOfKeys, getFieldsWithType } from '../utils.js'

export const withAuthFinder = (prismaConfig: ResolvedConfig, prismaClient: PrismaClient) => {
  return Prisma.defineExtension({
    model: getArrayOfKeys(prismaConfig).reduce<ModelExtensions>(
      (acc, model) => ({
        ...acc,
        [model]: {
          async verifyCredentials(uniqueId, password) {
            const user = await (
              prismaClient[model] as unknown as GenericPrismaModel<typeof model>
            ).findFirst({
              where: {
                OR: getFieldsWithType(model, prismaConfig, uniqueId).map((uid) => ({
                  [uid]: uniqueId,
                })),
              },
            })
            if (!user) {
              await prismaConfig[model].hash().make(password)
              throw new errors.E_INVALID_CREDENTIALS('Invalid user credentials')
            }

            const userPassword = user[prismaConfig[model].passwordColumnName]

            if (typeof userPassword !== 'string') {
              throw new Error('Incorrect password column type')
            }

            if (userPassword && (await prismaConfig[model].hash().verify(userPassword, password))) {
              return user
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
            args.data = {
              ...args.data,
              password: await prismaConfig[model].hash().make(args.data.password),
            }
            return query(args)
          },
          async update({ args, query }) {
            if ('password' in args.data && typeof args.data.password === 'string') {
              args.data = {
                ...args.data,
                password: await prismaConfig[model].hash().make(args.data.password),
              }
            }
            return query(args)
          },
        },
      }),
      {} as QueryExtensions
    ),
  })
}

export function generatePrismaClient(prismaConfig: ResolvedConfig, prismaClient: PrismaClient) {
  return prismaClient.$extends(withAuthFinder(prismaConfig, prismaClient)) as ExtendedPrismaClient
}
