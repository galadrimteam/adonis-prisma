import { ApplicationService } from '@adonisjs/core/types'
import { test } from '@japa/runner'
import { defineConfig } from '../../src/define_config.js'
import {
  cleanupDatabase,
  createFakeAdonisApp,
  initPrisma,
  getHasher,
} from '../../test-helpers/index.js'

let app: ApplicationService

const hash = getHasher()

test.group('Prisma Provider', (group) => {
  group.each.setup(async ({ context }) => {
    const adonisApp = await createFakeAdonisApp({
      rcFileContents: {
        providers: [() => import('../../providers/prisma_provider.js')],
      },
      config: {
        prisma: defineConfig({
          user: {
            uids: ['id', 'email'],
            hash: () => hash,
            passwordColumnName: 'password',
          },
        }),
      },
    })

    app = adonisApp.app

    await initPrisma(context.fs, adonisApp.ace.app.makePath())
  })
  test('register prisma provider', async ({ assert }) => {
    const prismaClient = await app.container.make('prisma:db')

    assert.exists(prismaClient.user.verifyCredentials)
  })

  test('hash password on user create', async ({ assert, cleanup }) => {
    const prismaClient = await app.container.make('prisma:db')

    await prismaClient.user.create({
      data: {
        name: 'John Doe',
        email: 'C9Ykz@example.com',
        password: '123456',
      },
    })

    const user = await prismaClient.user.findFirstOrThrow({
      where: {
        email: 'C9Ykz@example.com',
      },
    })

    assert.isTrue(user.password.startsWith('$scrypt$'))
    assert.isTrue(await hash.verify(user.password, '123456'))

    cleanup(async () => {
      await cleanupDatabase(app.makePath())
    })
  })

  test('hash password on user update', async ({ assert, cleanup }) => {
    const prismaClient = await app.container.make('prisma:db')

    await prismaClient.user.create({
      data: {
        name: 'John Doe',
        email: 'test@example.com',
        password: '123456',
      },
    })

    await prismaClient.user.update({
      data: {
        password: '456789',
      },
      where: {
        email: 'test@example.com',
      },
    })

    const user = await prismaClient.user.findFirstOrThrow({
      where: {
        email: 'test@example.com',
      },
    })

    assert.isTrue(user.password.startsWith('$scrypt$'))
    assert.isTrue(await hash.verify(user.password, '456789'))

    cleanup(async () => {
      await cleanupDatabase(app.makePath())
    })
  })

  test('verify credentials', async ({ assert, cleanup }) => {
    const prismaClient = await app.container.make('prisma:db')

    await prismaClient.user.create({
      data: {
        name: 'John Doe',
        email: 'test@example.com',
        password: '123456',
      },
    })

    assert.isNotNull(await prismaClient.user.verifyCredentials('test@example.com', '123456'))
    assert.isNotNull(await prismaClient.user.verifyCredentials(1, '123456'))

    assert.rejects(
      async () => await prismaClient.user.verifyCredentials(1, '1234567'),
      'Invalid user credentials'
    )

    cleanup(async () => {
      await cleanupDatabase(app.makePath())
    })
  })
})
