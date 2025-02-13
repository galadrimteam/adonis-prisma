import app from '@adonisjs/core/services/app'
import { ExtendedPrismaClient } from '../src/types.js'

let prisma: ExtendedPrismaClient

await app.booted(async () => {
  prisma = await app.container.make('prisma:db')
})

export { prisma }
