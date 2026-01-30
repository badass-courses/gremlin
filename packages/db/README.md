# @badass/db

Drizzle ORM adapter for ContentResource with PostgreSQL.

## Features

- **ContentResource schema** - Flexible content model with JSON fields
- **Fractional positions** - Double precision ordering for easy reordering
- **Nested resource loading** - Configurable depth for hierarchical content
- **PostgreSQL** - Using Neon serverless driver

## Installation

```bash
pnpm add @badass/db
```

## Usage

### Setup Database

```typescript
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { DrizzleContentResourceAdapter, type DatabaseSchema } from "@badass/db";

// Create database connection
const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

// Create adapter
const adapter = new DrizzleContentResourceAdapter(db);
```

### Create Content

```typescript
// Create a course
const course = await adapter.createContentResource({
  type: "course",
  createdById: "user_123",
  fields: {
    title: "TypeScript Fundamentals",
    slug: "typescript-fundamentals~cr_abc123",
    state: "published",
    description: "Learn TypeScript from scratch",
  },
});

// Create a lesson
const lesson = await adapter.createContentResource({
  type: "lesson",
  createdById: "user_123",
  fields: {
    title: "Introduction to Types",
    slug: "intro-to-types~cr_def456",
    state: "published",
  },
});

// Add lesson to course
await adapter.addResourceToResource(course.id, lesson.id, { position: 1.0 });
```

### Load Nested Resources

```typescript
// Load course with lessons (depth 1)
const courseWithLessons = await adapter.getContentResource(
  "typescript-fundamentals~cr_abc123",
  { depth: 1 },
);

// Load course with lessons and exercises (depth 2)
const deepCourse = await adapter.getContentResource(course.id, { depth: 2 });

console.log(deepCourse.resources); // Array of lessons
console.log(deepCourse.resources[0].resource.resources); // Exercises in first lesson
```

### Fractional Positions

```typescript
import { getPositionBetween } from "@badass/db/utils";

// Insert between existing items
const newPosition = getPositionBetween(1.0, 2.0); // 1.5

// Reorder a resource
await adapter.reorderResource(course.id, lesson.id, newPosition);
```

## Schema

### ContentResource

| Field       | Type         | Description                         |
| ----------- | ------------ | ----------------------------------- |
| id          | varchar(255) | Primary key                         |
| type        | varchar(255) | Resource type (lesson, course, etc) |
| createdById | varchar(255) | Creator user ID                     |
| fields      | jsonb        | Flexible JSON fields                |
| createdAt   | timestamp    | Creation timestamp                  |
| updatedAt   | timestamp    | Last update timestamp               |
| deletedAt   | timestamp    | Soft delete timestamp               |

### ContentResourceResource (Join Table)

| Field        | Type         | Description                      |
| ------------ | ------------ | -------------------------------- |
| resourceOfId | varchar(255) | Container resource ID            |
| resourceId   | varchar(255) | Contained resource ID            |
| position     | double       | Fractional position for ordering |
| metadata     | jsonb        | Relationship metadata            |
| createdAt    | timestamp    | Creation timestamp               |
| updatedAt    | timestamp    | Last update timestamp            |
| deletedAt    | timestamp    | Soft delete timestamp            |

## Slug Format

Slugs follow the pattern: `{slugified-title}~{guid}`

Example: `typescript-fundamentals~cr_abc123`

This ensures uniqueness while keeping URLs readable.

## Migrations

Generate migrations with drizzle-kit:

```bash
pnpm exec drizzle-kit generate
pnpm exec drizzle-kit migrate
```

## License

MIT
