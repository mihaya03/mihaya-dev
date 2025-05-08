# CLAUDE.md

This file provIDes guIDance to Claude Code (claude.ai/code) when working with code in this リポジトリ.

## Development Commands

### Root Commands
- `npm run dev` - Start development servers for all workspaces
- `npm run build` - Build all packages and workers
- `npm run lint` - Run linting across all workspaces  
- `npm run check-types` - Type check all TypeScript code
- `npm run format` - Format code with Prettier
- `npm run lint:text` - Lint markdown files with textlint
- `npm run lint:text:fix` - Auto-fix markdown files with textlint

### Database Package (packages/DB)
- `npm run test` - Run Vitest tests
- `npm run test:watch` - Run tests in watch mode
- `npm run build` - Compile TypeScript to dist/
- `npm run dev` - Watch mode TypeScript compilation

### Frontend Worker (workers/frontend)
- `npm run dev` - Start Next.js development server with Turbopack
- `npm run build` - Build for production
- `npm run deploy` - Deploy to Cloudflare using OpenNext
- `npm run preview` - Preview deployment locally
- `npm run cf-typegen` - Generate Cloudflare environment types

### Contents Manager Worker (workers/contents-manager)
- `npm run dev` - Start Wrangler dev server
- `npm run deploy` - Deploy to Cloudflare Workers
- `npm run cf-typegen` - Generate Cloudflare types

## Architecture

### Monorepo Structure
- **Turborepo** for build orchestration with npm workspaces
- **packages/**: Shared libraries and database layer
- **workers/**: Cloudflare Workers applications

### Database Layer (packages/DB)
- **Prisma** O/Rマッパ with MySQL and Tiデータベース Cloud adapter
- **Functional programming** approach with curried functions and Result types
- **Railway Oriented Programming** using `neverthrow` for error handling
- **ULID** for unique IDentifiers with collision retry logic

Key patterns:
```typescript
// Curried functions for dependency injection
export const findPostById = (prisma: ReturnType<typeof createPrisma>) =>
  async (id: string): Promise<Result<Post | null, DatabaseConnectionError>>

// Result type for error handling
return ok(post) // Success case
return err(new DatabaseConnectionError(e)) // Error case
```

### Frontend (workers/frontend)
- **Next.js 15** with App Router and React 19
- **TailwindCSS** for styling with custom configuration
- **OpenNext** for Cloudflare Workers deployment
- **Shared markdown package** for content rendering
- Layout structure: Header → Main → Footer grID

### Content Management
- **Cloudflare Workers** for content processing
- **Queue-based** message processing architecture
- **Wrangler** for deployment and local development

### Data Models
- **Post-Tag relationship**: Many-to-many with junction table
- **ULID-based IDs**: String IDentifiers for all entities
- **Immutable data patterns**: Following functional programming principles

## Key Technical Decisions

1. **Functional Programming**: Heavy use of curried functions, Result types, and immutable data patterns
2. **Error Handling**: Explicit error types (DatabaseConnectionError, PostCreationError) with neverthrow
3. **Deployment**: Cloudflare Workers ecosystem with OpenNext for Next.js
4. **Database**: Tiデータベース Cloud with Prisma for serverless MySQL compatibility
5. **Monorepo**: Turborepo for coordinated builds and shared dependencies

## Testing
- **Vitest** for unit testing (packages/DB)
- Test files located in `test/` directories
- Run tests with `npm run test` in respective packages