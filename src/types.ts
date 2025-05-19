import { PrismaClient as BasePrismaClient, Prisma } from '#prisma'
import {
  DefaultArgs,
  DynamicClientExtensionThis,
  DynamicQueryExtensionCbArgs,
  InternalArgs,
  ModelKey,
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
export interface PrismaClient extends BasePrismaClient {}

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

export type ModelData<Model extends ExtendableModels> = PrismaClient[Model] extends {
  findFirstOrThrow: (...args: infer _Args) => Promise<infer T>
}
  ? T
  : never

export type VerifyCredentials<Model extends ExtendableModels> = (
  uid: string | number | BigInt,
  password: string
) => Promise<ModelData<Model>>

export type ExtendableModels = {
  [Model in keyof PrismaClient]: PrismaClient[Model] extends {
    findFirstOrThrow: (...args: infer _Args) => Promise<unknown>
  }
    ? Model
    : never
}[keyof PrismaClient]

export type ExtendedPrismaClient = DynamicClientExtensionThis<
  Prisma.TypeMap<
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
    Prisma.PrismaClientOptions
  >,
  Prisma.TypeMapCb,
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
  }
>

export type HashConfig = { default: string }

type TypeMap = Prisma.TypeMap<InternalArgs & DefaultArgs, Prisma.PrismaClientOptions>

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
export abstract class PrismaSeederBase {
  static developmentOnly: boolean
  abstract run(): Promise<unknown>
}

export type Id = string | number | BigInt
