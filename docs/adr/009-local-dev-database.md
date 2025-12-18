# ADR-009: Local Dev Database

**Status**: Accepted
**Date**: 2024-12-18
**Authors**: @joelhooks

## Context

Development requires a local database before deploying to PlanetScale (MySQL-compatible serverless database). Developers need:

1. **Fast local iteration** - run migrations, test queries, seed data without network latency
2. **PlanetScale compatibility** - local environment should match production database dialect
3. **Easy onboarding** - new developers should start coding in minutes, not hours
4. **Drizzle integration** - local database must work with Drizzle ORM and Drizzle Kit migrations
5. **Seed data** - realistic fixtures for testing auth flows, content models, etc.

The traditional approach (manually install MySQL, configure users, create databases) is error-prone and time-consuming. Mismatched MySQL versions between developers cause subtle bugs. Forgotten configuration steps lead to "works on my machine" issues.

We're establishing this for a greenfield monorepo where developers shouldn't need to know MySQL administration to start coding.

## Decision

Use **Docker Compose with MySQL 8.0** for local development database:

### Container Setup

```yaml
# docker-compose.yml (app root)
version: '3.8'
services:
  db:
    image: mysql:8.0
    cap_add:
      - SYS_NICE  # Suppress MySQL capability warnings
    restart: always
    environment:
      - MYSQL_DATABASE=wizardshit_dev
      - MYSQL_ALLOW_EMPTY_PASSWORD=yes  # Local dev only, no password
    ports:
      - '3309:3306'  # Avoid conflict with local MySQL on 3306
    volumes:
      - db:/var/lib/mysql                   # Persist data across restarts
      - ./seed_data:/docker-entrypoint-initdb.d  # Auto-run seed SQL on first start
volumes:
  db:
    driver: local
```

### Script Interface (package.json)

```json
{
  "scripts": {
    "db:up": "docker compose up -d db && bun run db:wait",
    "db:down": "docker compose down",
    "db:reset": "docker compose down -v && bun run db:up && bun run db:migrate && bun run db:seed",
    "db:wait": "bun run ./scripts/wait-for-db.ts",
    "db:migrate": "drizzle-kit push",
    "db:generate": "drizzle-kit generate",
    "db:seed": "bun run ./scripts/seed.ts",
    "db:studio": "drizzle-kit studio"
  }
}
```

### Drizzle Kit Configuration

```typescript
// drizzle.config.ts
import { env } from './src/env';
import { type Config } from 'drizzle-kit';

export default {
  schema: ['./src/db/schema.ts'],
  dialect: 'mysql',
  dbCredentials: {
    url: env.DATABASE_URL, // mysql://root@localhost:3309/wizardshit_dev
  },
  out: './src/db/migrations',
} satisfies Config;
```

### Seed Data Strategy

**Hybrid approach**: SQL files for initial schema bootstrap + TypeScript factories for test data.

1. **Initial seed SQL** (`seed_data/001-init.sql`): Auto-runs on first container start
   - Creates tables if Drizzle migrations haven't run yet
   - Idempotent (safe to re-run)
   - Fast (MySQL-native)

2. **TypeScript seed script** (`scripts/seed.ts`): Runs via `bun run db:seed`
   - Uses Drizzle ORM for type-safe data insertion
   - Factories for generating realistic users, content, etc.
   - Resetable (truncate + re-seed for clean slate)

```typescript
// scripts/seed.ts example
import { db } from '../src/db';
import { users, content } from '../src/db/schema';

export async function seed() {
  // Truncate tables
  await db.delete(users);
  await db.delete(content);
  
  // Insert seed data
  await db.insert(users).values([
    { id: 'user_1', email: 'joel@badass.dev', name: 'Joel Hooks' },
    // ...
  ]);
  
  await db.insert(content).values([
    { id: 'content_1', title: 'First Post', authorId: 'user_1' },
    // ...
  ]);
}

seed().then(() => console.log('✅ Seed complete'));
```

### Database Choice: MySQL 8.0

**Why MySQL over Postgres?**

- **PlanetScale compatibility**: PlanetScale is MySQL-compatible (uses Vitess under the hood)
- **Deployment path**: Local MySQL → PlanetScale has zero dialect changes
- **Drizzle support**: First-class MySQL support in Drizzle ORM
- **course-builder precedent**: Legacy apps use MySQL 8.0 successfully

### Container Orchestration: Docker Compose

**Why Docker Compose over standalone container?**

- **Declarative config**: `docker-compose.yml` is version-controlled, self-documenting
- **Future extensibility**: Easy to add Redis, MinIO, or other services later
- **Standard tooling**: Most developers already have Docker Compose installed
- **Simpler commands**: `docker compose up` vs. long `docker run` with 10+ flags

## Consequences

### Positive

- **Zero MySQL knowledge required**: Developers run `bun db:up` and get a working database
- **Version consistency**: Everyone uses MySQL 8.0 (same as PlanetScale compatibility target)
- **Fast iteration**: Local database, no network latency, instant feedback
- **Persistent data**: Database survives restarts (use `db:reset` for clean slate)
- **PlanetScale parity**: Same MySQL dialect, queries work identically in production
- **Drizzle Kit integration**: `drizzle-kit push` for migrations, `drizzle-kit studio` for GUI
- **Seed data automation**: New developers get realistic data without manual setup
- **Docker-only dependency**: No need to install MySQL globally, configure users, etc.

### Negative

- **Docker dependency**: Requires Docker Desktop (or Colima on macOS), adds ~500MB disk space
- **Port conflict risk**: If developer has MySQL on 3306, container uses 3309 (requires .env update)
- **Container overhead**: ~100-200MB RAM for MySQL container (negligible on modern machines)
- **No PlanetScale features**: Local MySQL lacks PlanetScale's branching, online schema changes (acceptable for dev)
- **Seed data maintenance**: TypeScript seed scripts need updates as schema evolves

### Neutral

- **Volume persistence**: Data persists across `docker compose down`, use `docker compose down -v` to wipe
- **M1/M2 compatibility**: MySQL 8.0 image has ARM64 support (no Rosetta needed)
- **Alternative drivers**: Can swap `mysql2` for `@planetscale/database` driver locally (not required)

## Alternatives Considered

### Alternative 1: Local MySQL Installation

**Description**: Developers manually install MySQL via Homebrew (macOS) or apt (Linux).

```bash
brew install mysql@8.0
mysql -u root -e "CREATE DATABASE wizardshit_dev;"
```

**Why rejected**:

- **Version fragmentation**: Developers end up with MySQL 5.7, 8.0, 8.1, etc. (subtle incompatibilities)
- **Configuration drift**: Different `my.cnf` settings, character sets, time zones
- **Onboarding friction**: "I can't connect to MySQL" support tickets
- **M1/M2 issues**: Homebrew MySQL on Apple Silicon has historically had bugs
- **Cleanup burden**: MySQL remains installed globally, clutters system

### Alternative 2: PostgreSQL (for future Supabase option)

**Description**: Use Postgres locally, plan for potential Supabase migration.

```yaml
services:
  db:
    image: postgres:16
    environment:
      POSTGRES_DB: wizardshit_dev
```

**Why rejected**:

- **PlanetScale mismatch**: PlanetScale is MySQL-only, can't deploy Postgres there
- **Dialect differences**: MySQL and Postgres have incompatible SQL (JSON functions, AUTO_INCREMENT vs. SERIAL, etc.)
- **Migration cost**: Switching from Postgres to MySQL later requires schema rewrites
- **Drizzle dialect lock-in**: `dialect: 'postgres'` vs. `dialect: 'mysql'` in drizzle.config.ts
- **No clear Supabase requirement**: PlanetScale is the chosen production database (per backlog context)

**Note**: If Supabase becomes a requirement, create ADR-XXX to document the Postgres migration.

### Alternative 3: SQLite for Local, MySQL in Production

**Description**: Use SQLite locally (zero config), deploy to MySQL (PlanetScale) in production.

```typescript
// Local
import { drizzle } from 'drizzle-orm/better-sqlite3';

// Production
import { drizzle } from 'drizzle-orm/planetscale-serverless';
```

**Why rejected**:

- **Dialect mismatch**: SQLite has different behavior for AUTOINCREMENT, date handling, foreign keys (off by default), JSON functions
- **"Works on my machine" risk**: Queries succeed locally with SQLite, fail in production with MySQL
- **Migration testing**: Can't test Drizzle migrations locally (SQLite schema != MySQL schema)
- **False confidence**: Tests pass locally but break in staging/production due to dialect differences
- **Drizzle Kit complications**: Need separate `drizzle.config.ts` for local vs. production

### Alternative 4: PlanetScale Branch for Development

**Description**: Each developer gets a PlanetScale branch database for local dev.

```bash
pscale branch create wizardshit joel-dev
pscale connect wizardshit joel-dev --port 3309
```

**Why rejected**:

- **Network latency**: Every query goes to PlanetScale (50-200ms vs. <1ms local)
- **Cost**: Free tier limited to 1 production + 1 development branch, doesn't scale to team
- **Internet dependency**: Can't code offline (flights, coffee shops, etc.)
- **Slower iteration**: Schema changes require PlanetScale deploy requests, not instant Drizzle push
- **Branch management overhead**: Developers must create/delete branches, avoid branch exhaustion

### Alternative 5: Shared Development Database

**Description**: Team shares a single remote MySQL database (e.g., on DigitalOcean, Railway).

**Why rejected**:

- **Conflicts**: Developers overwrite each other's seed data, break tests mid-run
- **No schema experimentation**: Can't test breaking migrations without affecting team
- **Slow feedback**: Network latency on every query
- **Security risk**: Shared credentials, no isolation
- **Single point of failure**: If database goes down, entire team blocked

## References

- [Docker Compose MySQL Official Image](https://hub.docker.com/_/mysql)
- [Drizzle Kit Push Command](https://orm.drizzle.team/kit-docs/commands#push)
- [PlanetScale MySQL Compatibility](https://planetscale.com/docs/concepts/what-is-planetscale#mysql-compatibility)
- [course-builder Docker Compose Reference](../legacy/course-builder/apps/course-builder-web/docker-compose.yml)
- [course-builder Drizzle Config Reference](../legacy/course-builder/apps/course-builder-web/drizzle.config.ts)
- Semantic Memory: Drizzle + PGLite feasibility analysis (ID: e77b7ee9-ceea-4f0f-8314-30e64330d6c3)
