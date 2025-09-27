# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added - Monorepo Migration (2025-09-27)

#### Packages Structure
- **NEW**: Created `packages/shared` with common types, utilities, and environment configuration
- **NEW**: Created `packages/prompt-factory` with unified prompt generation engine
- **NEW**: Created `packages/ui` with shared UI components (Button, Card, utilities)
- **NEW**: Added typed environment loader with graceful fallbacks

#### API Changes
- **NEW**: Unified API endpoint `POST /api/generate` supporting both GlowBot and ScriptTok modules
- **NEW**: Health check endpoint `GET /api/health` with system status
- **NEW**: Version endpoint `GET /api/version` 
- **NEW**: Modules endpoint `GET /api/modules` listing available playbooks
- **NEW**: Content management endpoint `GET /api/content` with module filtering

#### Frontend Changes  
- **NEW**: Module-based navigation with dedicated GlowBot and ScriptTok sections
- **NEW**: Module placeholder pages with feature descriptions and coming soon states
- **NEW**: Routes for `/glowbot` and `/scriptok` module access

#### Prompt Engine
- **NEW**: Unified prompt factory with module routing (`glowbot`, `scriptok`)
- **NEW**: GlowBot playbooks: viral-hook, content-script, trend-adaptation
- **NEW**: ScriptTok playbooks: tiktok-script, shorts-script, reels-script
- **NEW**: Template variable processing with `{{variable}}` syntax
- **NEW**: Platform validation and error handling

#### Content Management
- **NEW**: In-memory content repository with JSON persistence
- **NEW**: ContentItem model with module tracking
- **NEW**: Client SDK for API interactions

#### Documentation
- **NEW**: Comprehensive README.md with quick start and API documentation
- **NEW**: CONTRIBUTING.md with development guidelines and coding standards
- **NEW**: DECISIONS.md documenting architectural decisions and rationale
- **NEW**: Root .env.example with all required environment variables

### Changed - Migration Updates

#### File Structure
- **MOVED**: Shared functionality extracted to packages
- **UPDATED**: Import paths updated for shared packages
- **ADDED**: Module navigation to sidebar

#### Configuration
- **ADDED**: Workspace support preparation (pending package.json restrictions)
- **UPDATED**: TypeScript configurations for packages
- **ADDED**: Path aliases for shared packages

### Technical Debt
- **PENDING**: Package.json workspace conversion (requires manual configuration)
- **PENDING**: Server startup fix (vite config import resolution)
- **PENDING**: LSP diagnostic resolution for import paths
- **PENDING**: Dependency installation for shared packages

### Migration Status

#### ✅ Completed (13/54 tasks)
- [x] Create folder structure (`/packages`, `/infra`)
- [x] Create shared package with types, utils, env loader
- [x] Create prompt factory with unified engine
- [x] Create UI package with Button and Card components  
- [x] Add unified API endpoints
- [x] Add module navigation to sidebar
- [x] Create module placeholder pages
- [x] Add module routes to application
- [x] Create comprehensive documentation (README, CONTRIBUTING, DECISIONS)
- [x] Add ScriptTok module templates to prompt factory
- [x] Implement content repository with persistence
- [x] Create client SDK for API interactions
- [x] Add environment configuration

#### ⏳ In Progress (1/54 tasks)
- [ ] Application startup fix (configuration dependencies)

#### 📋 Remaining (40/54 tasks)
- [ ] Workspace configuration (package.json protection limitations)
- [ ] Extract duplicate helpers to shared package
- [ ] Root tsconfig with path aliases  
- [ ] Replace app-local UI with shared components
- [ ] Comprehensive testing setup
- [ ] Build system optimization
- [ ] Dead code removal and consolidation

### Known Issues
- Application startup fails due to vite config import path resolution
- LSP diagnostics showing import errors for shared packages
- Package.json modifications restricted (workspace setup pending)

### Breaking Changes
- None (additive changes only)

### Dependencies
- Added uuid for ID generation
- Added zod for schema validation  
- Prepared workspace structure for package management

---

## Historical Changes

Previous changes were tracked in individual commit messages. This changelog begins with the monorepo migration effort.