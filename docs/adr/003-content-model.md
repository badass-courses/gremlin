# ADR-003: Content Model - ContentResource + Collections

**Status**: Accepted
**Date**: 2024-12-18
**Authors**: @joelhooks

## Context

Course platforms need a flexible content model that supports:

1. **Multiple content types** - Lessons, articles, tips, tutorials, workshops
2. **Hierarchical organization** - Modules contain lessons, courses contain modules
3. **Relationships** - Resources can reference other resources
4. **Extensibility** - New content types without schema migrations
5. **Versioning** - Track content changes over time

The legacy course-builder evolved organically, resulting in separate tables for each content type. This created:
- Schema proliferation (20+ content tables)
- Duplicated CRUD logic per type
- Difficulty adding new content types
- Inconsistent field naming across types

## Decision

Adopt a **single ContentResource table** with a flexible `fields` JSON column:

```typescript
const ContentResourceSchema = z.object({
  id: z.string().uuid(),
  type: z.string(),                    // "lesson", "article", "tip", etc.
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().nullable().optional(),

  fields: z.object({
    title: z.string().optional(),
    slug: z.string().optional(),
    description: z.string().optional(),
    body: z.string().optional(),
  }).passthrough(),                    // Allow type-specific fields

  metadata: z.record(z.string(), z.unknown()).optional(),
})
```

### Relationships via ContentResourceResource

A separate join table handles relationships between resources:

```typescript
const ContentResourceResourceSchema = z.object({
  resourceOfId: z.string().uuid(),     // Parent resource
  resourceId: z.string().uuid(),       // Child resource
  position: z.number(),                // Ordering within parent
  metadata: z.record(z.unknown()).optional(),
})
```

### Type-Specific Schemas

Each content type gets its own Zod schema that extends the base:

```typescript
const LessonSchema = ContentResourceSchema.extend({
  type: z.literal("lesson"),
  fields: z.object({
    title: z.string(),
    slug: z.string(),
    body: z.string(),
    videoUrl: z.string().url().optional(),
    duration: z.number().optional(),
  }),
})
```

## Consequences

### Benefits

- **Single table** - One CRUD implementation for all content types
- **Flexible schema** - Add fields without migrations (JSON column)
- **Type safety** - Zod schemas provide runtime validation + TypeScript types
- **Easy relationships** - Any resource can contain any other resource
- **Soft deletes** - `deletedAt` enables recovery and audit trails
- **Fractional positioning** - Reorder without updating all siblings

### Trade-offs

- **No foreign keys on fields** - JSON columns can't have DB-level constraints
- **Query complexity** - JSON queries are less efficient than column queries
- **Index limitations** - Can't index arbitrary JSON fields (use generated columns if needed)
- **Schema drift** - Must validate at application layer, not DB layer

### What This Enables

- Add new content types via code, not migrations
- Universal content browser/editor UI
- Cross-type search and filtering
- Content collections (playlists, paths, bundles)
- Import/export as JSON

## Alternatives Considered

### 1. Separate tables per content type

**Rejected because**: Schema proliferation, duplicated logic, migration burden.

### 2. EAV (Entity-Attribute-Value)

**Rejected because**: Query nightmare, no type safety, poor performance.

### 3. MongoDB/Document DB

**Rejected because**: Want to stay on relational DB for transactions and joins.

### 4. Payload CMS / Strapi

**Rejected because**: External dependency, less control, different data model.

## References

- [Sanity.io Content Lake](https://www.sanity.io/docs/content-lake) - Inspiration for flexible content model
- [Notion Data Model](https://www.notion.so/blog/data-model-behind-notion) - Block-based content
- [Fractional Indexing](https://www.figma.com/blog/realtime-editing-of-ordered-sequences/) - Position ordering
