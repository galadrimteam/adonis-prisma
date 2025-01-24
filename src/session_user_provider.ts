import type { SessionGuardUser, SessionUserProviderContract } from '@adonisjs/auth/types/session'

import { extendedPrisma } from './prisma_service.js'
import { ExtendedModels, GenericPrismaModel, ModelData } from './types.js'
import { symbols } from '@adonisjs/auth'

export type Session<Model extends ExtendedModels> = Omit<ModelData<Model>, 'password'>

export class SessionPrismaUserProvider<Model extends ExtendedModels>
  implements SessionUserProviderContract<Session<Model>>
{
  declare [symbols.PROVIDER_REAL_USER]: Session<Model>

  constructor(protected model: Model) {}

  async createUserForGuard(user: Session<Model>): Promise<SessionGuardUser<Session<Model>>> {
    return {
      getId() {
        return user.id
      },
      getOriginal() {
        return user
      },
    }
  }

  async findById(identifier: string): Promise<null | SessionGuardUser<Session<Model>>> {
    const user = await (
      extendedPrisma[this.model] as unknown as GenericPrismaModel<Model>
    ).findUnique({
      where: { id: identifier },
    })

    if (!user) {
      return null
    }

    return this.createUserForGuard(user)
  }
}
