# Architectural Decisions

## Overview

This document records key architectural decisions made during the monorepo migration and ongoing development of the GlowBot platform.

## Decision Log

### ADR-001: Single API Surface (2025-09-27)

**Decision:** Implement a unified API with a single `/api/generate` endpoint that handles all content generation requests across modules.

**Context:** 
- Previously had separate API endpoints for different content types
- ScriptTok and GlowBot had independent API surfaces
- Needed consistent interface for client applications

**Solution:**
- Single POST `/api/generate` endpoint
- Module parameter determines routing: `glowbot` | `scriptok`
- Unified request/response format across all modules
- Centralized validation and error handling

**Benefits:**
- Consistent client integration
- Simplified API documentation
- Easier testing and monitoring
- Reduced maintenance overhead

**Status:** Implemented

---

### ADR-002: Single Prompt Engine (2025-09-27)

**Decision:** Consolidate all prompt generation logic into a unified prompt factory with module-based routing.

**Context:**
- GlowBot and ScriptTok had separate prompt engines
- Duplicate template logic and validation
- Difficult to share improvements across modules

**Solution:**
- Created `packages/prompt-factory` with modular architecture
- Each module (`glowbot`, `scriptok`) registers playbooks
- Shared template processing engine
- Unified validation and error handling
- Module parameter routes to appropriate templates

**Benefits:**
- Eliminates code duplication
- Consistent template processing
- Shared validation and guardrails
- Easier to add new modules
- Centralized testing

**Status:** Implemented

---

### ADR-003: Monorepo Structure (2025-09-27)

**Decision:** Organize codebase as monorepo with clear package separation and workspace management.

**Context:**
- Need to merge ScriptTok functionality into GlowBot
- Want shared packages for common functionality
- Maintain clear boundaries between concerns

**Structure:**
```
/packages/shared     - Common types, utils, constants
/packages/prompt-factory - Unified prompt generation
/packages/ui         - Shared UI components
/client/            - Frontend React application
/server/            - Backend Express server
/infra/             - Infrastructure and deployment
```

**Benefits:**
- Clear separation of concerns
- Reusable shared packages
- Easier dependency management
- Simplified CI/CD processes
- Better code organization

**Status:** In Progress

---

### ADR-004: Module-Based Navigation (2025-09-27)

**Decision:** Implement module-based navigation with dedicated routes for GlowBot and ScriptTok functionality.

**Context:**
- Users need clear way to access different feature sets
- ScriptTok has specialized workflow different from GlowBot
- Want to maintain module identity while sharing infrastructure

**Solution:**
- Added "Modules" section to sidebar navigation
- Routes: `/glowbot` and `/scriptok`
- Dedicated module pages with feature descriptions
- Module-specific placeholder pages during development

**Benefits:**
- Clear user experience
- Maintains product identities
- Easy to add new modules
- Progressive feature rollout

**Status:** Implemented

---

### ADR-005: Graceful Degradation Strategy (2025-09-27)

**Decision:** Implement graceful degradation across all AI services and external dependencies.

**Context:**
- Application should work even without API keys
- Users need feedback about missing configuration
- Development environment should not require all services

**Solution:**
- Centralized AI service client management
- Mock responses when services unavailable
- Clear error messaging for missing configuration
- Feature toggles based on available services

**Benefits:**
- Improved development experience
- Better user experience with partial functionality
- Easier testing and debugging
- More resilient application

**Status:** Previously Implemented

---

### ADR-006: Environment Configuration (2025-09-27)

**Decision:** Use centralized, typed environment configuration across all packages and applications.

**Context:**
- Multiple packages needed environment variables
- Inconsistent environment handling across modules
- Type safety for configuration values

**Solution:**
- Created `packages/shared/src/env.ts` with typed environment loader
- Single source of truth for environment variables
- Gradual migration from per-app environment loaders
- Default values for development environment

**Benefits:**
- Consistent environment handling
- Type safety for configuration
- Single place to manage environment variables
- Better development experience

**Status:** Implemented

---

## Implementation Principles

### 1. Modules via Parameters
All API endpoints use module parameters rather than separate endpoints:
- `POST /api/generate` with `module: "glowbot" | "scriptok"`
- Single codebase, multiple behaviors
- Easier to test and maintain

### 2. Shared Infrastructure
Common functionality lives in shared packages:
- Types and utilities in `packages/shared`
- UI components in `packages/ui`
- Prompt engine in `packages/prompt-factory`

### 3. Progressive Enhancement
Features can be disabled gracefully:
- Missing API keys don't break the application
- Clear messaging about unavailable features
- Development continues without external dependencies

### 4. Type Safety
Strong typing throughout:
- Zod schemas for API validation
- TypeScript interfaces for all data structures
- Shared types across packages prevent drift

### 5. Testability
Architecture supports comprehensive testing:
- Isolated packages can be tested independently
- Mocked external dependencies
- Integration tests for critical paths

---

## Future Decisions

### Pending: Database Migration Strategy
- How to handle existing GlowBot data
- Schema migrations for shared content model
- Data consistency during transition

### Pending: Authentication Integration
- Unified auth across modules
- User preferences and history
- Multi-tenant architecture considerations

### Pending: Deployment Strategy
- Docker containerization approach
- Environment-specific configurations
- CI/CD pipeline for monorepo