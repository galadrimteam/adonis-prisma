import MakeSeeder from '#commands/make_seeder'
import { AceFactory } from '@adonisjs/core/factories'
import { test } from '@japa/runner'

test.group('MakeSeeder', (group) => {
  group.each.teardown(async () => {
    delete process.env.ADONIS_ACE_CWD
  })
  test('make a seeder', async ({ fs, assert }) => {
    const ace = await new AceFactory().make(fs.baseUrl, { importer: () => {} })
    await ace.app.init()

    const command = await ace.create(MakeSeeder, ['user'])
    await command.exec()

    command.assertSucceeded()

    await assert.fileExists('prisma/seeders/user_seeder.ts')
    await assert.fileContains('prisma/seeders/user_seeder.ts', `export default class UserSeeder`)
  })
})
