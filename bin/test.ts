import { assert } from '@japa/assert'
import { fileSystem } from '@japa/file-system'
import { configure, processCLIArgs, run } from '@japa/runner'
import { APP_ROOT } from '../test-helpers/index.js'

processCLIArgs(process.argv.splice(2))

configure({
  plugins: [assert(), fileSystem({ basePath: APP_ROOT })],
  suites: [
    {
      name: 'configure',
      files: ['tests/configure/**/*.spec.ts'],
    },
    {
      name: 'commands',
      files: ['tests/commands/**/*.spec.ts'],
    },
    {
      name: 'provider',
      files: ['tests/provider/**/*.spec.ts'],
    },
  ],
})

run()
