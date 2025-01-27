import Prisma from '@prisma/client'
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
      OR: Record<string, string>[]
    }
  }) => Promise<ModelData<Model> | null>
  findUnique: (where: {
    where: {
      id: string
    }
  }) => Promise<ModelData<Model> | null>
}

export type ExtendedOperations =
  | 'create'
  | 'findFirst'
  | 'findFirstOrThrow'
  | 'findMany'
  | 'findUnique'
  | 'findUniqueOrThrow'

export type ModelData<Model extends ExtendableModels> = PrismaClient[Model] extends {
  findFirstOrThrow: (...args: infer _Args) => Promise<infer T>
}
  ? T & { id: string }
  : never

export type FindForAuth<Model extends ExtendableModels> = (
  value: string
) => Promise<ModelData<Model> | null>
export type VerifyCredentials<Model extends ExtendableModels> = (
  uid: string,
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
          findForAuth: () => FindForAuth<Model>
          verifyCredentials: () => VerifyCredentials<Model>
        }
      }
      query: {
        [Model in keyof ResolvedConfig]: {
          [Operation in ExtendedOperations]: PrismaExtension<Operation, Model>
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
        findForAuth: () => FindForAuth<Model>
        verifyCredentials: () => VerifyCredentials<Model>
      }
    }
    query: {
      [Model in keyof ResolvedConfig]: {
        [Operation in ExtendedOperations]: PrismaExtension<Operation, Model>
      }
    }
    client: {}
  },
  Prisma.Prisma.PrismaClientOptions
>

export type HashConfig = { default: string }

type TypeMap = Prisma.Prisma.TypeMap<InternalArgs & DefaultArgs, Prisma.Prisma.PrismaClientOptions>

type PrismaOperationResult<
  Operation extends ExtendedOperations,
  Model extends ExtendedModels,
> = TypeMap['model'][ModelKey<TypeMap, Model>]['operations'][Operation]['result']

type PrismaExtension<Operation extends ExtendedOperations, Model extends ExtendedModels> = (
  args: DynamicQueryExtensionCbArgs<TypeMap, 'model', ModelKey<TypeMap, Model>, Operation>
) => ResolvedConfig[Model]['sanitizePassword'] extends true
  ? Promise<
      PrismaOperationResult<Operation, Model> extends Array<infer Item>
        ? Array<Omit<Item, 'password'>>
        : Omit<PrismaOperationResult<Operation, Model>, 'password'>
    >
  : Promise<PrismaOperationResult<Operation, Model>>

export type ModelExtensions = {
  [Model in keyof ResolvedConfig]: {
    findForAuth: FindForAuth<Model>
    verifyCredentials: VerifyCredentials<Model>
  }
}
export type QueryExtensions = {
  [Model in ExtendedModels]: {
    [Operation in ExtendedOperations]: PrismaExtension<Operation, Model>
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
