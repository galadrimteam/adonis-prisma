import type { Hash } from '@adonisjs/core/hash'
import { SessionPrismaUserProvider } from './session_guard/user_provider.js'
import { ExtendedModels, ModelData, ExtendableModels } from './types.js'

export type PrismaConfig = {
  [Model in ExtendableModels[][number]]: ModelConfig<Model>
}

export interface ModelConfig<Model extends ExtendableModels> {
  hash: () => Hash
  uids: (keyof ModelData<Model>)[]
  passwordColumnName: keyof ModelData<Model>
}

export function defineConfig<Config extends Partial<PrismaConfig>>(config: Config) {
  return config
}

export function sessionUserProvider<T extends ExtendedModels>(model: T) {
  return new SessionPrismaUserProvider(model)
}

export function sessionWithTokensUserProvider<T extends ExtendedModels>(model: T) {
  return new SessionPrismaUserProvider(model)
}
