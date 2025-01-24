import { SessionPrismaUserProvider } from './session_user_provider.js'
import { ExtendedModels, ModelData, UserModel } from './types.js'

export type PrismaConfig<Models extends UserModel[]> = {
  [Model in Models[number]]: ModelConfig<Model>
}

export interface ModelConfig<Model extends UserModel> {
  uniqueIds: (keyof ModelData<Model>)[]
  sanitizePassword?: boolean
}

export function defineConfig<Models extends UserModel[]>(config: PrismaConfig<Models>) {
  return config
}

export function sessionUserProvider<T extends ExtendedModels>(model: T) {
  return new SessionPrismaUserProvider(model)
}
