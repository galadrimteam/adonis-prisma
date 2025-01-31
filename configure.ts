/*
|--------------------------------------------------------------------------
| Configure hook
|--------------------------------------------------------------------------
|
| The configure hook is called when someone runs "node ace configure <package>"
| command. You are free to perform any operations inside this function to
| configure the package.
|
| To make things easier, you have access to the underlying "ConfigureCommand"
| instance and you can use codemods to modify the source files.
|
*/

import string from '@poppinss/utils/string'
import { DIALECTS, presetPrisma } from './src/presets_prisma.js'
import Configure from '@adonisjs/core/commands/configure'

export async function configure(command: Configure) {
  let dialect: string | undefined = command.parsedFlags.db
  let shouldInstallPackages: boolean | undefined = command.parsedFlags.install

  if (dialect === undefined) {
    dialect = await command.prompt.choice(
      'Select the database you want to use',
      Object.keys(DIALECTS),
      {
        name: 'dialect',
        validate(value) {
          return !!value
        },
      }
    )
  }
  if (dialect! in DIALECTS === false) {
    command.logger.error(
      `The selected database "${dialect}" is invalid. Select one from: ${string.sentence(
        Object.keys(DIALECTS)
      )}`
    )
    command.exitCode = 1
    return
  }

  if (shouldInstallPackages === undefined) {
    shouldInstallPackages = await command.prompt.confirm(
      'Do you want to install additional packages required by "@galadrim/adonis-prisma"?',
      {
        name: 'shouldInstallPackages',
      }
    )
  }

  const codemods = await command.createCodemods()

  await presetPrisma(codemods, command.app, {
    dialect: dialect as keyof typeof DIALECTS,
    installPackages: !!shouldInstallPackages,
  })
}
