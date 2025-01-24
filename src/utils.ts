import { ModelConfig } from './define_config.js'
import { ExtendedModels, ResolvedConfig } from './types.js'

export function getArrayOfKeys<T extends Record<string, unknown>>(obj: T): (keyof T)[] {
  return Object.keys(obj) as (keyof T)[]
}

export function getModelConfig<Model extends ExtendedModels>(
  model: Model,
  prismaConfig: ResolvedConfig
): ModelConfig<Model> {
  return prismaConfig[model] as ModelConfig<Model>
}
