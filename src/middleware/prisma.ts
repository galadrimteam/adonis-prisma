import type { HttpContext } from '@adonisjs/core/http'
import app from '@adonisjs/core/services/app'
import type { NextFn } from '@adonisjs/core/types/http'
import { ExtendedPrismaClient } from '../types.js'

export default class PrismaMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    ctx.prisma = await app.container.make('prisma:db')

    return next()
  }
}

declare module '@adonisjs/core/http' {
  export interface HttpContext {
    prisma: ExtendedPrismaClient
  }
}
