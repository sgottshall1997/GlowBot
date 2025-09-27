# Contributing to GlowBot Monorepo

## Development Guidelines

### Branching Strategy

- `main` - Production-ready code
- `development` - Integration branch for new features
- Feature branches: `feature/description`
- Hotfix branches: `hotfix/description`

### Commit Standards

Use conventional commits:
```
type(scope): description

Types:
- feat: new feature
- fix: bug fix
- docs: documentation changes
- style: formatting, missing semicolons
- refactor: code restructuring without behavior change
- test: adding missing tests
- chore: maintain tooling, dependencies
```

Examples:
```bash
feat(prompt-factory): add viral hook templates for TikTok
fix(api): handle missing API key gracefully
docs(readme): update installation instructions
refactor(ui): extract duplicate button components
```

### Testing Requirements

1. **Unit Tests**: All business logic must have unit tests
2. **Integration Tests**: API endpoints must have integration tests
3. **E2E Tests**: Critical user flows must have end-to-end tests

Run tests before committing:
```bash
npm test
npm run test:e2e
```

### Code Quality

1. **TypeScript**: Strict mode enabled, no `any` types
2. **Linting**: ESLint + Prettier configured
3. **Coverage**: Minimum 80% test coverage for new code

Pre-commit checks:
```bash
npm run lint
npm run typecheck
npm run test
```

### Pull Request Process

1. Create feature branch from `development`
2. Implement feature with tests
3. Update documentation if needed
4. Ensure all checks pass
5. Request review from maintainers
6. Address feedback and merge

### Package Management

- Use exact versions for dependencies
- Update package-lock.json
- Document breaking changes in PR description

### Database Changes

- Use migrations for schema changes
- Never edit existing migrations
- Test migrations on sample data
- Document schema changes in PR

### Adding New Features

#### New Playbook Template

1. Add to appropriate module in `packages/prompt-factory/src/modules/`
2. Include comprehensive tests
3. Update module documentation
4. Add example usage

#### New API Endpoint

1. Implement in `server/api/`
2. Add route to `server/routes.ts`
3. Include request/response validation
4. Add comprehensive tests
5. Update API documentation

#### New UI Component

1. Add to `packages/ui/src/`
2. Follow existing patterns and naming
3. Include TypeScript props interface
4. Add Storybook stories if applicable
5. Export from package index

### Monorepo Guidelines

#### Package Dependencies

- Use workspace references for internal packages
- Keep external dependencies minimal
- Document peer dependencies clearly

#### Shared Code

- Common utilities go in `packages/shared/`
- UI components go in `packages/ui/`
- Business logic stays in feature packages

#### Build Process

- Each package must build independently
- Use TypeScript for type checking
- Optimize bundle sizes for production

### Code Style

#### TypeScript
```typescript
// Use interfaces for object shapes
interface ContentItem {
  id: string;
  text: string;
}

// Use enums for constants
enum Platform {
  TIKTOK = 'tiktok',
  REELS = 'reels'
}

// Use proper error handling
async function generateContent(): Promise<ContentItem> {
  try {
    return await api.generate();
  } catch (error) {
    throw new Error(`Generation failed: ${error.message}`);
  }
}
```

#### React Components
```tsx
// Use function components with TypeScript
interface ButtonProps {
  variant?: 'primary' | 'secondary';
  onClick: () => void;
  children: React.ReactNode;
}

export function Button({ variant = 'primary', onClick, children }: ButtonProps) {
  return (
    <button 
      className={`btn btn-${variant}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
```

### Security Guidelines

- Never commit API keys or secrets
- Use environment variables for configuration
- Validate all user inputs
- Implement proper error handling
- Follow OWASP security practices

### Performance

- Optimize bundle sizes
- Use React.memo for expensive renders
- Implement proper caching strategies
- Monitor API response times
- Use database indexes effectively

### Documentation

- Update README.md for significant changes
- Document API changes in CHANGELOG.md
- Include inline code comments for complex logic
- Maintain up-to-date JSDoc comments

### Getting Help

- Check existing issues and discussions
- Join development channel for questions
- Review existing code patterns
- Ask maintainers for architectural guidance

## Release Process

1. Update version numbers
2. Update CHANGELOG.md
3. Create release branch
4. Run full test suite
5. Deploy to staging
6. Conduct UAT testing
7. Merge to main and tag release
8. Deploy to production
9. Monitor post-deployment metrics