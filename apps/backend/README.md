# Backend

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Database schema

Le modèle de données persistant est documenté dans [`docs/database-schema.md`](../../docs/database-schema.md). Il est implémenté via les entités TypeORM définies dans `src/database/entities`.

## Project setup

```bash
pnpm install
```

## Compile and run the project

```bash
# development
$ pnpm run start

# watch mode
$ pnpm run start:dev

# production mode
$ pnpm run start:prod
```

## Run tests

```bash
# unit tests
$ pnpm run test

# e2e tests
$ pnpm run test:e2e

# test coverage
$ pnpm run test:cov
```

## Database commands

```bash
# Seed the database with initial data
$ pnpm run seed

# Reset the database (drop all tables, recreate schema, and run seeds)
$ pnpm run db:reset
```

Note: The `db:reset` command will completely drop and recreate the database schema, then populate it with seed data. Use with caution in production environments.

## Database migrations

The backend uses TypeORM migrations to manage database schema changes. See [README-MIGRATIONS.md](./README-MIGRATIONS.md) for complete documentation.

Common commands:

```bash
# Generate a migration from entity changes
$ pnpm run migration:generate src/database/migrations/MigrationName

# Run pending migrations
$ pnpm run migration:run

# Revert the last migration
$ pnpm run migration:revert

# Show migration status
$ pnpm run migration:show
```

**Important**: In production, set `DB_SYNC=false` in your `.env` file to use migrations instead of auto-synchronization.

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
pnpm install -g @nestjs/mau
mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
