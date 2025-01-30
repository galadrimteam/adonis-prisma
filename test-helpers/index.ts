import { IgnitorFactory } from '@adonisjs/core/factories'
import { Hash } from '@adonisjs/core/hash'
import { Scrypt } from '@adonisjs/core/hash/drivers/scrypt'
import { AppEnvironments } from '@adonisjs/core/types/app'
import { FileSystem } from '@japa/file-system'
import { execa } from 'execa'
import { fileURLToPath } from 'node:url'

export const APP_ROOT = new URL('./tmp/', import.meta.url)
export const SQLITE_BASE_PATH = fileURLToPath(APP_ROOT)

export async function initPrisma(fs: FileSystem, cwd: string) {
  await fs.create('tmp/dev.db', '')
  await fs.create(
    'prisma/schema.prisma',
    `
  datasource db {
    provider = "sqlite"
    url      = "file:${SQLITE_BASE_PATH}/tmp/dev.db"
  }
  generator client {
    provider        = "prisma-client-js"
    previewFeatures = ["driverAdapters"]
}

  model User {
    id        Int      @id @default(autoincrement())
    createdAt DateTime @default(now())
    email     String   @unique
    password  String
    name      String
  }
  `
  )
  await execa({ cwd })`npx prisma db push`
}

export async function fakeSeederFile(fs: FileSystem) {
  await fs.create(
    'prisma/seeders/user_seeder.ts',
    `
  import app from '@adonisjs/core/services/app'
  const prisma = await app.container.make('prisma:db')

  
  export default class UserSeeder {
    async run() {
      
      await prisma.user.createMany({
        data: [
          {
            name: 'John Doe',
            email: 'C9Ykz@example.com',
            password: '123456',
          },
          {
            name: 'Jane Doe',
            email: 'C10Ykz@example.com',
            password: '123456',
          },
          {
            name: 'Jack Doe',
            email: 'C11Ykz@example.com',
            password: '123456',
          },
        ]
      })
    }
  }
  `
  )
}

export async function cleanupDatabase(cwd: string) {
  await execa({ cwd })`npx prisma migrate reset --skip-generate --force`
}

export async function createFakeAdonisApp(args: {} = {}, env: AppEnvironments = 'web') {
  const ignitor = new IgnitorFactory()
    .merge(args)
    .withCoreProviders()
    .withCoreConfig()
    .create(APP_ROOT, {
      importer: (filePath) => {
        if (filePath.startsWith('./') || filePath.startsWith('../')) {
          return import(new URL(filePath, APP_ROOT).href)
        }

        return import(filePath)
      },
    })
  const app = ignitor.createApp(env)
  await app.init()
  await app.boot()

  const ace = await app.container.make('ace')
  ace.ui.switchMode('normal')

  return { app, ace }
}

export function getHasher() {
  return new Hash(new Scrypt({}))
}
