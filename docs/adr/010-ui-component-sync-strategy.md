# ADR-010: UI Component Sync Strategy

**Status**: Proposed
**Date**: 2026-01-17
**Authors**: @vojtaholik

## Context

The @badass platform uses a monorepo with multiple apps (`wizardshit-ai`, future course sites, landing pages) that need to share UI components while maintaining the flexibility to customize per-app. We need a strategy that:

1. **Keeps template as source of truth** - `create-badass-app` template should be the canonical implementation
2. **Enables selective sync** - Apps can update individual components without forced upgrades
3. **Tracks version drift** - Visibility into which apps use which component versions
4. **Handles customization** - Apps can fork components without breaking sync
5. **Provides great DX** - Developers should use familiar tooling (shadcn CLI)
6. **Works with monorepo** - Leverages existing Turborepo + workspace structure

Current challenges:
- **No shared UI package exists** - `@badass/ui` referenced in ADR-008 but not implemented
- **Template-first requirement** - All components must originate in template, not a package
- **Multi-app maintenance** - Component fixes/improvements need to propagate to all apps
- **Customization vs consistency** - Need balance between standardization and app-specific needs

**Goal**: Create a component sync strategy that combines shadcn's excellent DX, Base UI's accessibility foundation, and custom registry for template-first architecture.

## Decision

Implement a **hybrid template-first sync strategy** using shadcn CLI + custom registry + Base UI components:

### 1. Component Architecture (Three Tiers)

```
┌─────────────────────────────────────────┐
│  Apps (wizardshit-ai, course-site, etc) │
│  └─ src/components/                     │  ← shadcn copies here
│     ├─ ui/                              │     (Base UI wrappers)
│     ├─ marketing/                       │     (template components)
│     └─ content/                         │     (ContentResource renderers)
└─────────────────────────────────────────┘
                    ↑
                    │ bunx shadcn add <component>
                    │
┌─────────────────────────────────────────┐
│  Custom Registry (packages/registry)    │
│  └─ public/default/*.json               │  ← Component metadata
│     - Versions, dependencies, files     │
│     - Generated from template           │
└─────────────────────────────────────────┘
                    ↑
                    │ reads from (CI builds registry)
                    │
┌─────────────────────────────────────────┐
│  Template (create-badass-app/templates) │  ← SOURCE OF TRUTH
│  └─ default/src/components/             │
│     ├─ ui/                              │     (shadcn-style Base UI wrappers)
│     ├─ marketing/                       │     (hero, footer, nav, etc.)
│     └─ content/                         │     (post-card, post-renderer, etc.)
└─────────────────────────────────────────┘
                    ↑
                    │ imports from
                    │
┌─────────────────────────────────────────┐
│  @badass/ui (shared package)            │  ← Primitives only
│  └─ src/primitives/                     │
│     - Headless Base UI components       │
│     - No styling, pure logic            │
└─────────────────────────────────────────┘
```

### 2. Component Classification

| Type | Location | Sync Strategy | Examples |
|------|----------|---------------|----------|
| **Universal Primitives** | `@badass/ui/primitives` | Normal package import | Headless form helpers, adapters |
| **Content Components** | `@badass/ui/content` | Normal package import | ContentResource renderers (if truly universal) |
| **UI Components** | Template → Registry → Apps | shadcn CLI copy | button, card, dialog (Base UI + Tailwind) |
| **Marketing** | Template → Registry → Apps | shadcn CLI copy | hero, footer, nav, pricing-table |
| **Content Rendering** | Template → Registry → Apps | shadcn CLI copy | post-card, post-header, collection-grid |
| **App-Specific** | `apps/*/src/components/` | Never synced | Custom features unique to one app |

### 3. File Metadata for Tracking

All template components include machine-readable comments:

```tsx
// @registry-name: post-card
// @registry-version: 1.2.0
// @registry-type: content
// @last-synced: 2026-01-15T10:30:00Z
// @dependencies: @badass/db, @base-ui-components/react
// @registry-dependencies: card, badge, button
// @customized: false
// @source: packages/create-badass-app/templates/default/src/components/content/post-card.tsx

export function PostCard({ post }: PostCardProps) {
  // Component implementation
}
```

### 4. Custom shadcn Registry

Create `packages/registry/` that serves component metadata:

```typescript
// packages/registry/src/index.ts
export const registry = {
  "button": {
    name: "button",
    type: "registry:ui",
    dependencies: ["@base-ui-components/react"],
    registryDependencies: [],
    files: [{
      path: "ui/button.tsx",
      type: "registry:ui",
      target: "components/ui/button.tsx"
    }]
  },

  "post-card": {
    name: "post-card",
    type: "registry:block",
    dependencies: ["@badass/db", "lucide-react"],
    registryDependencies: ["card", "badge", "button"],
    files: [{
      path: "content/post-card.tsx",
      type: "registry:block",
      target: "components/content/post-card.tsx"
    }]
  }
};
```

Apps configure `components.json` to point to custom registry:

```json
{
  "registry": "https://registry.badass.dev",
  "style": "default",
  "aliases": {
    "components": "@/components",
    "ui": "@/components/ui"
  }
}
```

### 5. Base UI Integration

Template components wrap Base UI with Tailwind styling (shadcn pattern):

```tsx
// templates/default/src/components/ui/button.tsx
import * as React from "react"
import { Button as BaseButton } from "@base-ui-components/react/button"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md...",
  {
    variants: {
      variant: { default: "...", destructive: "...", outline: "..." },
      size: { default: "...", sm: "...", lg: "..." },
    }
  }
)

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <BaseButton
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
```

### 6. CLI Commands

**New app creation** (copies entire template):
```bash
bunx create-badass-app my-site
# ✅ All template components copied automatically
# ✅ components.json pre-configured
```

**Selective component sync** (existing apps):
```bash
bunx shadcn add button          # Add/update single component
bunx shadcn add hero footer     # Add/update multiple components
bunx shadcn add button --overwrite  # Update with diff preview
```

**Custom sync commands** (extends create-badass-app):
```bash
bunx create-badass-app drift
# Shows which components have updates available

bunx create-badass-app sync --category marketing
# Updates all marketing components

bunx create-badass-app sync --check post-card
# Preview changes before applying

bunx create-badass-app audit button
# See which apps use which versions
```

### 7. Development Workflow

**Template-first development:**

1. Create/update component in `packages/create-badass-app/templates/default/src/components/`
2. Test in template context
3. Bump `@registry-version` comment
4. Commit and push
5. CI builds registry JSON from template
6. Apps selectively pull updates via shadcn CLI

**Component lifecycle:**

```
New Component Flow:
1. Create in template → Test thoroughly
2. Deploy to registry via CI
3. Apps add via: bunx shadcn add <component>

Update Component Flow:
1. Update in template → Bump version
2. Deploy to registry via CI
3. Apps check drift: bunx create-badass-app drift
4. Apps update: bunx shadcn add <component> --overwrite

Extract to Package Flow (rare):
1. Component becomes truly universal → Extract to @badass/ui
2. Update template to import from @badass/ui
3. Apps update template component (now imports package)
```

### 8. Registry Hosting

**Option A: Static JSON** (simplest, deploy to Cloudflare Pages):
```
packages/registry/public/
├── index.json              # Component list
└── default/
    ├── button.json
    ├── post-card.json
    └── hero.json
```

**Option B: Dynamic API** (more flexible, Next.js API routes):
```typescript
// Reads directly from template, generates JSON on-the-fly
export async function GET(req: Request) {
  const component = getComponentFromURL(req.url);
  const templatePath = `templates/default/src/components/${component.path}`;
  const content = await Bun.file(templatePath).text();

  return Response.json({
    ...component,
    files: [{ ...component.files[0], content: base64(content) }]
  });
}
```

## Consequences

### Positive

- ✅ **Template as source of truth** - All components originate in template, ensuring consistency
- ✅ **Selective sync** - Apps update components individually, no forced upgrades
- ✅ **Familiar DX** - Developers use standard `bunx shadcn add` commands
- ✅ **Version tracking** - Metadata comments track what's installed and when
- ✅ **Drift detection** - CLI shows which apps are out of sync
- ✅ **Customization friendly** - Apps can mark components as customized to prevent overwrites
- ✅ **Base UI foundation** - Accessible, headless primitives with Tailwind styling
- ✅ **Dependency chain awareness** - Registry tracks which components depend on others
- ✅ **Breaking change safety** - Apps opt-in to updates, see diffs before applying
- ✅ **Cross-app visibility** - Audit command shows which apps use which versions
- ✅ **Standard tooling** - Leverages shadcn ecosystem (VS Code extension, documentation)
- ✅ **Monorepo-native** - Works within existing Turborepo workspace structure

### Negative

- ⚠️ **Registry maintenance** - Need to build and deploy registry on template changes
- ⚠️ **Dual hosting** - Components live in template AND registry (mitigated: CI auto-generates)
- ⚠️ **Manual sync required** - Apps don't auto-update (this is also a feature)
- ⚠️ **Metadata comment discipline** - Developers must maintain `@registry-*` comments
- ⚠️ **CLI complexity** - Custom commands extend shadcn CLI, adds learning curve
- ⚠️ **No automatic migrations** - Breaking changes require manual intervention per app
- ⚠️ **Registry infrastructure** - Need to host registry.badass.dev (Cloudflare Pages mitigates cost)

### Neutral

- ℹ️ **File-based, not npm** - Components are copied files, not imported packages
- ℹ️ **Base UI commitment** - Locked into Base UI for primitives (good accessibility foundation)
- ℹ️ **shadcn patterns** - Follows shadcn conventions (cn utility, cva variants, etc.)
- ℹ️ **Template-registry coupling** - Registry must stay in sync with template (CI enforces)

## Alternatives Considered

### Alternative 1: Full Shared Package (`@badass/ui` as npm package)

Import all components from `@badass/ui` package like normal dependencies:

```tsx
import { Button, Card } from "@badass/ui"
```

**Why rejected**:
- ❌ Apps can't customize without ejecting entirely
- ❌ Forces all apps to update simultaneously on breaking changes
- ❌ Doesn't match "template as source of truth" requirement
- ❌ Kills app autonomy (defeats purpose of multiple independent apps)
- ❌ No selective sync - all or nothing upgrades

### Alternative 2: Git Submodules

Put components in separate repo, include as submodule:

```bash
git submodule add git@github.com:badass/ui-components.git packages/ui
```

**Why rejected**:
- ❌ Submodule hell (complex update workflow)
- ❌ Merge conflicts on component updates
- ❌ No version tracking per component
- ❌ Doesn't integrate with shadcn tooling
- ❌ Poor DX for developers

### Alternative 3: Copy-Paste with No Sync

Manually copy components between apps as needed, no sync mechanism:

**Why rejected**:
- ❌ No version tracking
- ❌ Bug fixes don't propagate
- ❌ Can't detect drift
- ❌ No cross-app visibility
- ❌ Maintenance nightmare at scale

### Alternative 4: Turborepo Code Generation

Use Turborepo's code generation to scaffold components:

```bash
turbo gen component button
```

**Why rejected**:
- ⚠️ No update mechanism (only generates once)
- ⚠️ Doesn't leverage shadcn ecosystem
- ⚠️ Would need to rebuild shadcn-equivalent tooling
- ✅ Could complement custom registry for new components

### Alternative 5: Payload CMS / Builder.io

Use a visual builder or headless CMS for component management:

**Why rejected**:
- ❌ External dependency and lock-in
- ❌ Doesn't fit code-first workflow
- ❌ Over-engineered for the use case
- ❌ Requires non-technical users (not our scenario)

## References

- [ADR-008: App Template](./008-app-template.md) - CLI scaffolding and template structure
- [ADR-005: Monorepo Structure](./005-monorepo-structure.md) - Turborepo workspace organization
- [ADR-003: Content Model](./003-content-model.md) - ContentResource pattern for content rendering components
- [shadcn/ui Registry](https://ui.shadcn.com/docs/cli) - Registry format and CLI patterns
- [Base UI Components](https://base-ui.com/) - Accessible headless primitives
- [shadcn Custom Registry Guide](https://ui.shadcn.com/docs/registry) - How to build custom registries
- [Turborepo Code Generation](https://turbo.build/repo/docs/guides/tools/code-generation) - Alternative approach considered
