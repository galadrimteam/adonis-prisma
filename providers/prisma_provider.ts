import { ApplicationService } from '@adonisjs/core/types'
import { PrismaClient } from '#prisma'
import { generatePrismaClient } from '../src/mixins/prisma.js'
import { ExtendedPrismaClient, ResolvedConfig } from '../src/types.js'

declare module '@adonisjs/core/types' {
  interface ContainerBindings {
    'prisma:db': ExtendedPrismaClient
  }
}

export default class PrismaProvider {
  constructor(protected app: ApplicationService) {}

  /**
   * Register bindings to the container
   */
  register() {
    this.app.container.singleton('prisma:db', async () => {
      const config = this.app.config.get<ResolvedConfig>('prisma')
      return generatePrismaClient(config, new PrismaClient())
    })
  }

  /**
   * The container bindings have booted
   */
  async boot() {}

  /**
   * The application has been booted
   */
  async start() {}

  /**
   * The process has been started
   */
  async ready() {}

  /**
   * Preparing to shutdown the app
   */
  async shutdown() {
    const db = await this.app.container.make('prisma:db')
    await db.$disconnect()
  }
}
