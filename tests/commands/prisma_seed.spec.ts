import PrismaSeed from '#commands/prisma_seed'
import { Kernel } from '@adonisjs/core/ace'
import { AceFactory } from '@adonisjs/core/factories'
import app from '@adonisjs/core/services/app'
import { test } from '@japa/runner'
import { PrismaClient } from '@prisma/client'
import { cleanupDatabase, fakeSeederFile, initPrisma } from '../../test-helpers/index.js'

let ace: Kernel

test.group('PrismaSeed', (group) => {
  group.each.disableTimeout()
  group.each.setup(async ({ context }) => {
    await context.fs.cleanup()
    ace = await new AceFactory().make(context.fs.baseUrl, { importer: () => {} })
    ace.ui.switchMode('raw')
    await ace.app.init()
  })

  test('Check if database is seeded', async ({ assert, fs, cleanup }) => {
    const prismaClient = new PrismaClient()

    // @ts-ignore
    app.container.singleton('prisma:db', async () => {
      return prismaClient
    })

    await initPrisma(fs, ace.app.makePath())
    await fakeSeederFile(fs)
    await assert.fileExists('prisma/seeders/user_seeder.ts')
    const command = await ace.create(PrismaSeed, [])
    await command.exec()

    const prisma = await ace.app.container.make('prisma:db')
    const users = await prisma.user.findMany()

    assert.equal(ace.app.getEnvironment(), 'console')
    assert.equal(ace.app.getState(), 'initiated')
    assert.equal(users.length, 3)

    command.assertLog('green(❯) green(completed) user_seeder')

    cleanup(async () => {
      await cleanupDatabase(ace.app.makePath())
    })
  })

  test('catch and return seeder errors', async ({ fs }) => {
    await fs.create(
      'prisma/seeders/error_seeder.ts',
      `

    export default class ErrorSeeder {
      async run() {
        throw new Error('Failed')
      }
    }
    `
    )

    const command = await ace.create(PrismaSeed, [])
    await command.exec()

    command.assertLog('red(❯) red(error    ) error_seeder')
    command.assertLog('  red(Failed)')
  })
})
