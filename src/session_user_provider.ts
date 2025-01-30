import type { SessionGuardUser, SessionUserProviderContract } from '@adonisjs/auth/types/session'

import { getModelPrimaryKey } from '#src/utils'
import { symbols } from '@adonisjs/auth'
import app from '@adonisjs/core/services/app'
import { ExtendedModels, GenericPrismaModel, ModelData } from './types.js'

export class SessionPrismaUserProvider<Model extends ExtendedModels>
  implements SessionUserProviderContract<ModelData<Model>>
{
  declare [symbols.PROVIDER_REAL_USER]: ModelData<Model>

  constructor(protected model: Model) {}

  async createUserForGuard(user: ModelData<Model>): Promise<SessionGuardUser<ModelData<Model>>> {
    const primaryKey = getModelPrimaryKey(this.model)
    return {
      getId() {
        return user[primaryKey]
      },
      getOriginal() {
        return user
      },
    }
  }

  async findById(
    identifier: string | number | BigInt
  ): Promise<null | SessionGuardUser<ModelData<Model>>> {
    const prisma = await app.container.make('prisma:db')

    const user = await (prisma[this.model] as GenericPrismaModel<typeof this.model>).findUnique({
      where: { [getModelPrimaryKey(this.model)]: identifier },
    })

    if (!user) {
      return null
    }

    return this.createUserForGuard(user as unknown as ModelData<Model>)
  }
}
