import type { SessionGuardUser, SessionUserProviderContract } from '@adonisjs/auth/types/session'

import { symbols } from '@adonisjs/auth'
import app from '@adonisjs/core/services/app'
import { PrismaConfig } from '../define_config.js'
import { ExtendedModels, GenericPrismaModel, Id, ModelData } from '../types.js'
import { getModelConfig, getModelPrimaryKey } from '../utils.js'

export class SessionPrismaUserProvider<Model extends ExtendedModels>
  implements SessionUserProviderContract<ModelData<Model>>
{
  declare [symbols.PROVIDER_REAL_USER]: ModelData<Model>

  constructor(protected model: Model) {}

  async createUserForGuard(user: ModelData<Model>): Promise<SessionGuardUser<ModelData<Model>>> {
    const primaryKey = getModelPrimaryKey(this.model)
    return {
      getId() {
        return user[primaryKey] as Id
      },
      getOriginal() {
        return user
      },
    }
  }

  async findById(identifier: Id): Promise<null | SessionGuardUser<ModelData<Model>>> {
    const prisma = await app.container.make('prisma:db')
    const prismaConfig = getModelConfig(this.model, app.config.get<PrismaConfig>('prisma'))

    const user = await (prisma[this.model] as GenericPrismaModel<typeof this.model>).findUnique({
      where: { [getModelPrimaryKey(this.model)]: identifier },
    })

    if (!user) {
      return null
    }

    delete user[prismaConfig.passwordColumnName]

    return this.createUserForGuard(user as ModelData<Model>)
  }
}
