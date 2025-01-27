import { isScriptFile, fsReadAll, slash } from '@poppinss/utils'
import { extname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { ModelConfig } from './define_config.js'
import { ExtendedModels, PrismaSeederFile, ResolvedConfig } from './types.js'

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
