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

import ConfigureCommand from '@adonisjs/core/commands/configure'
import string from '@poppinss/utils/string'
import { DIALECTS, presetPrisma } from './src/presets_prisma.js'

export async function configure(_command: ConfigureCommand) {
  let dialect: string | undefined = _command.parsedFlags.db
  let shouldInstallPackages: boolean | undefined = _command.parsedFlags.install

  if (dialect === undefined) {
    dialect = await _command.prompt.choice(
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
    _command.logger.error(
      `The selected database "${dialect}" is invalid. Select one from: ${string.sentence(
        Object.keys(DIALECTS)
      )}`
    )
    _command.exitCode = 1
    return
  }

  if (shouldInstallPackages === undefined) {
    shouldInstallPackages = await _command.prompt.confirm(
      'Do you want to install additional packages required by "@galadrim/adonis-prisma"?',
      {
        name: 'shouldInstallPackages',
      }
    )
  }

  const codemods = await _command.createCodemods()

  await presetPrisma(codemods, _command.app, {
    dialect: dialect as keyof typeof DIALECTS,
    installPackages: !!shouldInstallPackages,
  })
}
