import { SessionPrismaUserProvider } from './session_user_provider.js'
import { ExtendedModels, ModelData, ExtendableModels } from './types.js'

export type PrismaConfig = {
  [Model in ExtendableModels[][number]]: ModelConfig<Model>
}

export interface ModelConfig<Model extends ExtendableModels> {
  uniqueIds: (keyof ModelData<Model>)[]
  sanitizePassword?: boolean
}

export function defineConfig<Config extends Partial<PrismaConfig>>(config: Config) {
  return config
}

export function sessionUserProvider<T extends ExtendedModels>(model: T) {
  return new SessionPrismaUserProvider(model)
}
