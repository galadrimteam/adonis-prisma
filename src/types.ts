import Prisma from '@prisma/client'
import {
  DefaultArgs,
  DynamicClientExtensionThis,
  DynamicQueryExtensionCbArgs,
  InternalArgs,
  ModelKey,
  RequiredKeys,
} from '@prisma/client/runtime/library'
import { PrismaConfig } from './define_config.js'

/**
 * Extended models will be inferred from the config file
 */
export interface ResolvedConfig extends PrismaConfig {}
export type ExtendedModels = keyof ResolvedConfig

/**
 * PrismaClient needs to be extended to use the correct PrismaClient
 */
export interface PrismaClient extends Prisma.PrismaClient {}

/**
 * Infer the config type
 */
export type InferConfig<Config extends Partial<PrismaConfig>> = Required<Config>

/**
 * Infer the config type
 */
export interface GenericPrismaModel<Model extends ExtendedModels> {
  findFirst: (where: {
    where: {
      OR: Record<string, string | number | BigInt>[]
    }
  }) => Promise<ModelData<Model> | null>
  findUnique: (where: {
    where: {
      [key: string]: string | number | BigInt
    }
  }) => Promise<ModelData<Model> | null>
}

export type PrimaryKey<Model extends ExtendedModels> = PrismaClient[Model] extends {
  findUnique: (arg: {
    where: infer Where
    select?: infer _Select
    omit?: infer _Omit
  }) => Promise<infer _Response>
}
  ? keyof RequiredKeys<Where>
  : never

export type ModelData<Model extends ExtendableModels> = PrismaClient[Model] extends {
  findFirstOrThrow: (...args: infer _Args) => Promise<infer T>
}
  ? T & { [key in PrimaryKey<Model>]: string }
  : never

export type VerifyCredentials<Model extends ExtendableModels> = (
  uid: string | number | BigInt,
  password: string
) => Promise<Omit<ModelData<Model>, 'password'>>

export type ExtendableModels = {
  [Model in keyof PrismaClient]: PrismaClient[Model] extends {
    findFirstOrThrow: (...args: infer _Args) => Promise<infer T>
  }
    ? 'password' extends keyof T
      ? Model
      : never
    : never
}[keyof PrismaClient]

export type ExtendedPrismaClient = DynamicClientExtensionThis<
  Prisma.Prisma.TypeMap<
    InternalArgs & {
      result: {}
      model: {
        [Model in keyof ResolvedConfig]: {
          verifyCredentials: () => VerifyCredentials<Model>
        }
      }
      query: {
        [Model in keyof ResolvedConfig]: {
          [Operation in ExtendedOperation]: PrismaExtension<Model, Operation>
        }
      }
      client: {}
    },
    Prisma.Prisma.PrismaClientOptions
  >,
  Prisma.Prisma.TypeMapCb,
  {
    result: {}
    model: {
      [Model in keyof ResolvedConfig]: {
        verifyCredentials: () => VerifyCredentials<Model>
      }
    }
    query: {
      [Model in keyof ResolvedConfig]: {
        [Operation in ExtendedOperation]: PrismaExtension<Model, Operation>
      }
    }
    client: {}
  },
  Prisma.Prisma.PrismaClientOptions
>

export type HashConfig = { default: string }

type TypeMap = Prisma.Prisma.TypeMap<InternalArgs & DefaultArgs, Prisma.Prisma.PrismaClientOptions>

type PrismaOperationResult<
  Model extends ExtendedModels,
  Operation extends ExtendedOperation,
> = TypeMap['model'][ModelKey<TypeMap, Model>]['operations'][Operation]['result']

type ExtendedOperation = 'create' | 'update'

type PrismaExtension<Model extends ExtendedModels, Operation extends ExtendedOperation> = (
  args: DynamicQueryExtensionCbArgs<TypeMap, 'model', ModelKey<TypeMap, Model>, Operation>
) => Promise<PrismaOperationResult<Model, Operation>>

export type ModelExtensions = {
  [Model in keyof ResolvedConfig]: {
    verifyCredentials: VerifyCredentials<Model>
  }
}
export type QueryExtensions = {
  [Model in ExtendedModels]: {
    create: PrismaExtension<Model, 'create'>
    update: PrismaExtension<Model, 'update'>
  }
}

export type PrismaSeederConstructorContract = {
  developmentOnly: boolean
  new (): {
    run(): Promise<void>
  }
}

export type PrismaSeederFile<T> = {
  absPath: string
  name: string
  getSource: () => T | Promise<T>
}
export type PrismaSeederStatus = {
  status: 'pending' | 'completed' | 'failed' | 'ignored'
  error?: any
  file: PrismaSeederFile<unknown>
}
