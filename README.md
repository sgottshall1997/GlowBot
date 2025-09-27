# GlowBot Monorepo

A comprehensive TikTok viral content generation platform with AI-powered marketing tools, featuring content creation, scheduling, analytics, and monetization capabilities.

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Environment setup:**
   ```bash
   cp .env.example .env
   # Add your API keys and configuration
   ```

3. **Run development server:**
   ```bash
   npm run dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   ```

5. **Run tests:**
   ```bash
   npm test
   ```

## Folder Structure

```
/
├── packages/                 # Shared packages
│   ├── shared/              # Shared types, utils, constants
│   ├── prompt-factory/      # Unified prompt generation engine
│   └── ui/                  # Shared UI components
├── client/                  # Frontend React application
├── server/                  # Backend Express server
├── infra/                   # Infrastructure and deployment
└── docs/                    # Documentation
```

## Modules

This monorepo contains two main content generation modules:

### GlowBot Module
- AI-powered viral content generation
- Multi-platform support (TikTok, Instagram Reels, YouTube Shorts)
- Advanced analytics and optimization
- Template library with proven viral formats

### ScriptTok Module (Coming Soon)
- Specialized script generation for short-form video content
- Platform-specific optimizations
- Trend integration and hook optimization
- Call-to-action generation

## API Contract

### Unified Generation Endpoint

**POST `/api/generate`**

Request:
```json
{
  "module": "glowbot" | "scriptok",
  "platform": "tiktok" | "shorts" | "reels" | "blog" | "youtube" | "email",
  "playbook": "string",
  "inputs": {
    "topic": "string",
    "audience": "string",
    "tone": "string"
  }
}
```

Response:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "module": "glowbot",
    "platform": "tiktok",
    "playbook": "viral-hook",
    "text": "generated content...",
    "meta": {},
    "createdAt": "2025-09-27T01:00:00Z"
  }
}
```

### Health Check
- `GET /api/health` - System health status
- `GET /api/version` - Current version info

### Content Management
- `GET /api/content` - List generated content
- `GET /api/modules` - Available modules and playbooks

## Adding New Features

### New Playbook to Prompt Factory

1. Add template to appropriate module file in `packages/prompt-factory/src/modules/`
2. Update playbook list with new template
3. Add tests in `packages/prompt-factory/src/__tests__/`

### New Module

1. Create new module file in `packages/prompt-factory/src/modules/`
2. Register module in `packages/prompt-factory/src/engine.ts`
3. Add module routes in client application
4. Update sidebar navigation

## Development

- **Frontend:** React + TypeScript + Vite
- **Backend:** Express + TypeScript + Node.js
- **Database:** PostgreSQL with Drizzle ORM
- **Styling:** Tailwind CSS + shadcn/ui components
- **State:** React Query for server state management

## Environment Variables

Required for development:
```
OPENAI_API_KEY=your_openai_api_key
DATABASE_URL=postgresql://...
```

See `.env.example` for complete list.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development guidelines.

## Architecture Decisions

See [DECISIONS.md](./DECISIONS.md) for key architectural decisions and rationale.