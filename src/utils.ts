import { fsReadAll, isScriptFile, slash } from '@poppinss/utils'
import { Prisma } from '@prisma/client'
import { extname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { ModelConfig } from './define_config.js'
import { ExtendedModels, PrimaryKey, PrismaSeederFile, ResolvedConfig } from './types.js'

export function getArrayOfKeys<T extends Record<string, unknown>>(obj: T): (keyof T)[] {
  return Object.keys(obj) as (keyof T)[]
}

export function getModelConfig<Model extends ExtendedModels>(
  model: Model,
  prismaConfig: ResolvedConfig
): ModelConfig<Model> {
  return prismaConfig[model] as ModelConfig<Model>
}

export async function sourceFiles(
  fromLocation: URL,
  directory: string,
  naturalSort: boolean
): Promise<{ directory: string; files: PrismaSeederFile<unknown>[] }> {
  const absDirectoryPath = fileURLToPath(new URL(directory, fromLocation))
  let files = await fsReadAll(absDirectoryPath, {
    filter: isScriptFile,
    ignoreMissingRoot: true,
  })

  /**
   * Sort files
   */
  if (naturalSort) {
    files = files.sort((a: string, b: string) =>
      a!.localeCompare(b!, undefined, { numeric: true, sensitivity: 'base' })
    )
  } else {
    files = files.sort()
  }

  return {
    directory,
    files: files.map((file: string) => {
      const name = file.replace(RegExp(`${extname(file)}$`), '')

      return {
        /**
         * Absolute path to the file. Needed to ready the schema source
         */
        absPath: join(absDirectoryPath, file),

        /**
         * Normalizing name to always have unix slashes.
         */
        name: slash(name),

        /**
         * Import schema file
         */
        async getSource() {
          const exports = await import(pathToFileURL(this.absPath).href)
          if (!exports.default) {
            throw new Error(`Missing default export from "${this.name}" schema file`)
          }

          return exports.default
        },
      }
    }),
  }
}

export function getModelPrimaryKey<Model extends ExtendedModels>(modelName: Model) {
  const model = Prisma.dmmf.datamodel.models.find(
    (m) => m.name.toLowerCase() === modelName.toLowerCase()
  )

  if (!model) {
    throw new Error(`Model ${modelName} not found`)
  }

  const primaryKey = model.fields.find((f) => f.isId)

  if (!primaryKey) {
    throw new Error(`Primary key not found for model ${modelName}`)
  }

  return primaryKey.name as PrimaryKey<typeof modelName>
}

export function getFieldsWithType<Model extends ExtendedModels>(
  model: Model,
  prismaConfig: ResolvedConfig,
  value: unknown
) {
  const extendedFields = getModelConfig(model, prismaConfig).uids
  const type = typeof value

  const fields = Prisma.dmmf.datamodel.models.find(
    (m) => m.name.toLowerCase() === model.toLowerCase()
  )?.fields

  if (!fields) {
    throw new Error(`Model ${model} not found`)
  }

  return extendedFields.filter(
    (f) => prismaToNodeTypes[fields.find((field) => field.name === f)?.type ?? ''] === type
  )
}

const prismaToNodeTypes: Record<string, string> = {
  BigInt: 'bigint',
  Boolean: 'boolean',
  Bytes: 'Buffer | Uint8Array',
  DateTime: 'Date',
  Decimal: 'string', //* Prisma retourne un string
  Float: 'number',
  Int: 'number',
  JSON: 'any',
  String: 'string',
}
