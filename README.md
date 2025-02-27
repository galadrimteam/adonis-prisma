# Adonis JS Prisma Adapter

This is an AdonisJS provider for Prisma ORM.

## Getting Started

### Installation

```sh
node ace add @galadrim/adonis-prisma
```

This command will scaffold the config files, providers and create a prisma folder with `prisma.schema` file.

### Post Installation

After installation, you should run the proper commands to migrate your schema and/or generate the Prisma Client :

```sh
  npx prisma generate
```

## Usage

You have two options to use the Prisma Client.

- By destructuring `HttpContext`object :

```javascript
//route.ts

router
  .get('/', async function ({ prisma }: HttpContext) {
    ...
    const posts = await prisma.post.findMany())
    ...
  })
```

- By importing prisma from `@galadrim/adonis-prisma/services` :

```javascript
import prisma from '@galadrim/adonis-prisma/services'
```

### Authentication

First, you should configure the `prisma` service inside `config/prisma.ts` file.

```javascript
export const prismaConfig = defineConfig({
  user: {
    hash: () => hash.use(),
    passwordColumnName: 'password',
    uids: ['email', 'id'],
  },
})
```

The `user` key is the model name you want to use for authentication. Then you can configure it the same way you would with the withAuthFinder mixin from `@adonisjs/lucid`.

- hash: The hash function to use for hashing the password.
- passwordColumnName: The name of the column to store the password.
- uids: The list of columns to use for authentication.

Then,you should install the `@adonisjs/auth` and configure it with `Session` as Auth Guard.
Then, you should replace the `provider` key in the `config/auth.ts` file with this:

```javascript
//config/auth.ts
  import { sessionUserProvider } from '@galadrim/adonis-prisma'
  import { configProvider } from '@adonisjs/core'
  ... other imports

  ...
       user: sessionGuard({
          provider: sessionUserProvider('user'),
          useRememberMeTokens: false,
        }),
```

After that, you can use the provided methods to facilitate the authentication flow. Like, the `@adonisjs/lucid`, there is two methods for authentication

- To verify user credentials, you can use this method : ` const user = await prisma.user.verifyCredentials('email', 'password')`

- The password is automatically hashed via the `@adonisjs/hash` package when creating or updating an user, based on the default hasher configured inside the `config/hash.ts`.

**_NB_**: For now the package doesn't support the `refreshToken` method. I'm working on it.

### Database Seeding

You can define seeders for your DB with the following command :

```sh
node ace make:seeder <name_of_the_seeder>
```

It will create a seeder file inside the `prisma/seeders` directory.

Then, to seed the database you should run :
`node ace prisma:seed` command.
**_NB_**: This command runs all the seeders files inside `prisma/seeders` directory.

## Before leaving...

Credit to [ArthurFranckPat](https://github.com/ArthurFranckPat/adonis-prisma), I used a lot of his work as a base for this package, mainly for the seeder (and this doc)
