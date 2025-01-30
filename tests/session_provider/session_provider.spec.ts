import { defineConfig } from '#src/define_config'
import { SessionPrismaUserProvider } from '#src/session_user_provider'
import { ApplicationService } from '@adonisjs/core/types'
import { test } from '@japa/runner'
import { createFakeAdonisApp, getHasher, initPrisma } from '../../test-helpers/index.js'

let app: ApplicationService

test.group('Session user provider | Prisma', (group) => {
  group.each.setup(async ({ context }) => {
    const hash = getHasher()
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

    await initPrisma(context.fs, adonisApp.ace.app.makePath())

    app = adonisApp.app
  })

  test('throw error when user model is not using tokens provider', async ({ assert }) => {
    const userProvider = new SessionPrismaUserProvider('user')

    const prismaClient = await app.container.make('prisma:db')
    await prismaClient.user.create({
      data: {
        id: 1,
        name: 'John Doe',
        email: 'C9Ykz@example.com',
        password: '123456',
      },
    })

    const user = await userProvider.findById(1)

    assert.deepEqual(user?.getId(), 1)

    const originalUser:
      | {
          id: number
          name: string
          email: string
          password?: string
          createdAt?: Date
        }
      | undefined = user?.getOriginal()

    delete originalUser?.password
    delete originalUser?.createdAt

    assert.deepEqual(user?.getOriginal(), {
      id: 1,
      name: 'John Doe',
      email: 'C9Ykz@example.com',
    })
  })
})
