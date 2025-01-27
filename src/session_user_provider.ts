import type { SessionGuardUser, SessionUserProviderContract } from '@adonisjs/auth/types/session'

import { symbols } from '@adonisjs/auth'
import { ExtendedModels, ModelData } from './types.js'
import app from '@adonisjs/core/services/app'

export class SessionPrismaUserProvider<Model extends ExtendedModels>
  implements SessionUserProviderContract<ModelData<Model>>
{
  declare [symbols.PROVIDER_REAL_USER]: ModelData<Model>

  constructor(protected model: Model) {}

  async createUserForGuard(user: ModelData<Model>): Promise<SessionGuardUser<ModelData<Model>>> {
    return {
      getId() {
        return user.id
      },
      getOriginal() {
        return user
      },
    }
  }

  async findById(identifier: string): Promise<null | SessionGuardUser<ModelData<Model>>> {
    const prisma = await app.container.make('prisma:db')
    const user = await prisma[this.model].findUnique({
      where: { id: identifier },
    })

    if (!user) {
      return null
    }

    return this.createUserForGuard(user as unknown as ModelData<Model>)
  }
}
