import { Prisma } from '@prisma/client'
import {
  DefaultArgs,
  DynamicQueryExtensionCbArgs,
  InternalArgs,
  ModelKey,
} from '@prisma/client/runtime/library'
import { PrismaConfig } from './define_config.js'
import { PrismaClient as BasePrismaClient } from '@prisma/client'

/**
 * Extended models will be inferred from the config file
 */
export interface ResolvedConfig extends PrismaConfig<UserModel[]> {}

export type ExtendedModels = keyof ResolvedConfig

export type InferConfig<Config extends PrismaConfig<UserModel[]>> = Config

export interface FindByIdWhereInput {
  where: {
    id: string
  }
}

export interface FindOneWhereInput {
  where: {
    OR: Record<string, string>[]
  }
}

export interface GenericPrismaModel<Model extends ExtendedModels> {
  findFirst: (where: FindOneWhereInput) => Promise<ModelData<Model> | null>
  findUnique: (where: FindByIdWhereInput) => Promise<ModelData<Model> | null>
}

type TypeMap = Prisma.TypeMap<InternalArgs & DefaultArgs, Prisma.PrismaClientOptions>

type PrismaExtension<Operation extends ExtendedOperations, Model extends ExtendedModels> = (
  args: DynamicQueryExtensionCbArgs<TypeMap, 'model', ModelKey<TypeMap, Model>, Operation>
) => ResolvedConfig[Model]['sanitizePassword'] extends true
  ? Promise<
      PrismaOperationResult<Operation, Model> extends Array<infer Item>
        ? Array<Omit<Item, 'password'>>
        : Omit<PrismaOperationResult<Operation, Model>, 'password'>
    >
  : Promise<PrismaOperationResult<Operation, Model>>

export type PrismaExtensionArgs = {
  args: {
    data: any
  }
  query: (args: any) => any
}

type PrismaOperationResult<
  Operation extends ExtendedOperations,
  Model extends ExtendedModels,
> = TypeMap['model'][ModelKey<TypeMap, Model>]['operations'][Operation]['result']

type ExtendedOperations =
  | 'create'
  | 'findFirst'
  | 'findFirstOrThrow'
  | 'findMany'
  | 'findUnique'
  | 'findUniqueOrThrow'

export type QueryExtensions = {
  [Model in ExtendedModels]: {
    [Operation in ExtendedOperations]: PrismaExtension<Operation, Model>
  }
}

export type ModelData<Model extends UserModel> = PrismaClient[Model] extends {
  findFirstOrThrow: (...args: infer _Args) => Promise<infer T>
}
  ? 'id' extends keyof T
    ? 'password' extends keyof T
      ? T
      : never
    : never
  : never

export type ModelExtensions = {
  [Model in keyof ResolvedConfig]: {
    findForAuth: (value: string) => Promise<ModelData<Model> | null>
    verifyCredentials: (
      uid: string,
      password: string
    ) => Promise<Omit<ModelData<Model>, 'password'>>
  }
}

export interface PrismaClient extends BasePrismaClient {}

export type UserModel = {
  [Model in keyof PrismaClient]: PrismaClient[Model] extends {
    findFirstOrThrow: (...args: infer _Args) => Promise<infer T>
  }
    ? 'password' extends keyof T
      ? Model
      : never
    : never
}[keyof PrismaClient]

export type HashConfig = { default: string }
