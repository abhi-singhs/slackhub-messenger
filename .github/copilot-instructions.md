# Copilot Instructions for SlackHub Messenger

This document provides guidelines and best practices for contributing to the SlackHub Messenger project using GitHub Copilot.

## Project Overview

SlackHub Messenger is a modern Slack-like chat application built with:
- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS v4 with custom CSS variables
- **UI Components**: Radix UI primitives with shadcn/ui
- **Backend**: Supabase (authentication, real-time database, storage)
- **State Management**: React hooks and context
- **Rich Text**: TipTap editor
- **Build Tool**: Vite with TypeScript

## Documentation References

This project has comprehensive documentation that provides context for development:

### 📚 Core Documentation
- **[Architecture Overview](../docs/architecture/ARCHITECTURE.md)** - System design with Mermaid diagrams
- **[Database Schema](../docs/architecture/DATABASE_SCHEMA.md)** - Complete database structure
- **[Project Structure](../docs/architecture/PROJECT_STRUCTURE.md)** - Code organization patterns

### 🛠️ Development Resources  
- **[Development Guide](../docs/development/DEVELOPMENT.md)** - Complete development workflow
- **[API Documentation](../docs/development/API.md)** - Hooks, components, and utilities reference
- **[Component Library](../docs/development/COMPONENTS.md)** - UI component specifications
- **[Contributing Guidelines](../docs/development/CONTRIBUTING.md)** - Contribution workflow

### 🚀 Setup & Operations
- **[Setup Guide](../docs/setup/SUPABASE_SETUP.md)** - Environment configuration
- **[Deployment Notes](../docs/deployment/DEPLOYMENT_NOTES.md)** - Production deployment

### 📋 Reference Materials
- **[Troubleshooting Guide](../docs/reference/TROUBLESHOOTING.md)** - Common issues and solutions
- **[FAQ](../docs/reference/FAQ.md)** - Frequently asked questions
- **[Migration Guide](../docs/reference/MIGRATION.md)** - Version migration assistance

When generating code suggestions, reference these documents for:
- Architecture patterns and design decisions
- Component structure and naming conventions
- API usage patterns and best practices
- Database schema and relationships
- Security and performance considerations

## Code Style & Conventions

### TypeScript Guidelines
- Use strict TypeScript configuration with `strictNullChecks: true`
- Define interfaces in `src/types/index.ts` for shared types
- Use proper type annotations for function parameters and return values
- Prefer `interface` over `type` for object definitions
- Use proper generics for reusable components and hooks

### React Best Practices
- Use functional components with hooks
- Implement proper error boundaries using `react-error-boundary`
- Use React 19 features appropriately (concurrent features, etc.)
- Follow the component composition pattern
- Use custom hooks for business logic abstraction
- make sure to update the docs files as well when making changes to the codebase.

### File Organization
```
src/
├── components/         # React components
│   ├── ui/            # shadcn/ui base components
│   └── *.tsx          # Feature-specific components
├── hooks/             # Custom React hooks
├── lib/               # Utility libraries
├── types/             # TypeScript type definitions
├── constants/         # Application constants
└── assets/           # Static assets
```

### Component Structure
- Keep components focused and single-responsibility
- Use composition over inheritance
- Props should be properly typed with TypeScript interfaces
- Use default exports for components
- Include proper JSDoc comments for complex components

**Reference**: See [Component Library Documentation](../docs/development/COMPONENTS.md) for detailed component patterns and examples.

### Naming Conventions
- **Files**: PascalCase for components (`MessageItem.tsx`), camelCase for utilities (`fileUtils.ts`)
- **Components**: PascalCase (`MessagesList`)
- **Hooks**: Start with `use` (`useSupabaseData`)
- **Constants**: UPPER_SNAKE_CASE
- **Variables/Functions**: camelCase

## Styling Guidelines

### Tailwind CSS Usage
- Use the custom CSS variables defined in the theme system
- Prefer utility classes over custom CSS when possible
- Use the custom color palette (neutral, accent, accent-secondary, fg, bg)
- Utilize the custom spacing scale and border radius variables
- Use responsive design utilities for mobile-first approach

### CSS Variables System
The project uses a comprehensive CSS variables system:
```css
/* Colors */
--color-neutral-1 through --color-neutral-12
--color-accent-1 through --color-accent-12
--color-fg, --color-fg-secondary
--color-bg, --color-bg-inset, --color-bg-overlay

/* Spacing */
--size-px, --size-0 through --size-96

/* Border Radius */
--radius-sm through --radius-2xl, --radius-full
```

### Theme Support
- Support both light and dark modes using the `darkMode: ["class"]` configuration
- Use semantic color tokens rather than hardcoded colors
- Test components in both themes

## Supabase Integration

### Database Operations
- Use the custom hooks (`useSupabaseData`, `useSupabaseSettings`, etc.) for data operations
- Implement proper error handling for database operations
- Use TypeScript types that match the database schema
- Follow real-time subscription patterns for live updates

**Reference**: See [Database Schema Documentation](../docs/architecture/DATABASE_SCHEMA.md) for table structures and [API Documentation](../docs/development/API.md) for hook usage patterns.

### Authentication
- Use the `useAuth` hook for authentication state
- Implement proper loading and error states
- Handle authentication redirects appropriately
- Secure routes that require authentication

### File Handling
- Use Supabase Storage for file uploads
- Implement proper file validation and size limits
- Handle different file types (images, documents, audio, video)
- Provide proper loading states for file operations

## State Management

### Local State
- Use `useState` for component-level state
- Use `useReducer` for complex state logic
- Keep state as close to where it's used as possible

### Global State
- Use React Context for truly global state
- Create custom hooks to encapsulate context logic
- Avoid prop drilling by using context appropriately

### Data Fetching
- Use custom hooks for data fetching operations
- Implement proper loading, error, and success states
- Handle optimistic updates where appropriate
- Cache data appropriately to avoid unnecessary requests

## Performance Guidelines

### React Performance
- Use `React.memo` for expensive components
- Implement proper dependency arrays in hooks
- Avoid inline object/array creation in render
- Use proper key props for list items

### Bundle Optimization
- Use dynamic imports for code splitting
- Keep bundle size reasonable
- Utilize Vite's optimization features

## Accessibility

### ARIA Guidelines
- Use proper ARIA attributes for complex UI components
- Ensure keyboard navigation works properly
- Provide proper focus management
- Use semantic HTML elements when possible

### Radix UI Components
- Leverage Radix UI's built-in accessibility features
- Don't override accessibility attributes without good reason
- Test with screen readers when possible

## Testing Considerations

### Component Testing
- Write tests for complex business logic
- Test user interactions and edge cases
- Mock external dependencies appropriately
- Use proper test utilities for React components

### Type Safety
- Ensure TypeScript compilation passes without errors
- Use proper type guards for runtime type checking
- Handle null/undefined cases explicitly

## Security Best Practices

### Input Validation
- Validate all user inputs on both client and server
- Sanitize content before rendering
- Use proper XSS prevention techniques
- Implement rate limiting where appropriate

**Reference**: See [Security Guidelines](../docs/security/SECURITY.md) for comprehensive security practices and threat mitigation strategies.

### Data Handling
- Don't expose sensitive data in client-side code
- Use proper authentication checks
- Implement proper authorization for data access
- Handle errors without exposing sensitive information

## Real-time Features

### WebSocket Handling
- Use Supabase real-time subscriptions appropriately
- Handle connection states properly
- Implement proper cleanup for subscriptions
- Handle reconnection scenarios

### Optimistic Updates
- Implement optimistic updates for better UX
- Handle rollback scenarios for failed operations
- Provide proper feedback for user actions

## Feature-Specific Guidelines

### Messaging
- Handle message threading properly
- Implement proper emoji reactions
- Support file attachments with proper validation
- Handle message editing and deletion

### Calling Features
- Implement proper WebRTC handling
- Handle call states appropriately
- Provide proper UI feedback for call operations
- Handle call recording features

### Search Functionality
- Implement efficient search algorithms
- Provide proper search result highlighting
- Handle search history appropriately

## Development Workflow

### Git Workflow
- Use meaningful commit messages
- Keep commits focused and atomic
- Use proper branch naming conventions
- Write descriptive pull request descriptions

**Reference**: See [Contributing Guidelines](../docs/development/CONTRIBUTING.md) for detailed workflow and collaboration practices.

### Code Review
- Review for both functionality and code quality
- Check TypeScript types and error handling
- Verify accessibility requirements
- Test on different screen sizes

### Documentation
- Update documentation for new features
- Include proper JSDoc comments for complex functions
- Keep README and setup instructions current

## Common Patterns

### Error Handling
```typescript
try {
  const result = await supabaseOperation();
  // Handle success
} catch (error) {
  console.error('Operation failed:', error);
  // Handle error appropriately
}
```

### Custom Hooks Pattern
```typescript
export function useCustomHook() {
  const [state, setState] = useState<Type>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Implementation
  
  return { state, loading, error };
}
```

### Component Props Pattern
```typescript
interface ComponentProps {
  required: string;
  optional?: number;
  children?: React.ReactNode;
}

export function Component({ required, optional = 0, children }: ComponentProps) {
  // Implementation
}
```

## Troubleshooting

### Common Issues
- Ensure environment variables are properly configured
- Check Supabase connection and permissions
- Verify TypeScript configuration matches project requirements
- Test real-time features with proper WebSocket handling

**Reference**: See [Troubleshooting Guide](../docs/reference/TROUBLESHOOTING.md) for comprehensive problem-solving strategies and [Setup Guide](../docs/setup/SUPABASE_SETUP.md) for configuration help.

### Debug Strategies
- Use React Developer Tools for component debugging
- Use browser network tab for API debugging
- Check Supabase logs for backend issues
- Use TypeScript compiler for type checking
- Use Playwright MCP for confirming UI behavior and testing

---

Remember: Write code that is readable, maintainable, and follows the established patterns in the codebase. When in doubt, refer to existing implementations in the project for guidance.

## Additional Resources

For comprehensive information about the project:

- **[Documentation Hub](../docs/README.md)** - Complete documentation index
- **[Architecture Diagrams](../docs/architecture/ARCHITECTURE.md)** - Visual system design
- **[API Reference](../docs/development/API.md)** - Complete API documentation
- **[Setup Instructions](../docs/setup/SUPABASE_SETUP.md)** - Step-by-step setup guide
- **[Deployment Guide](../docs/deployment/DEPLOYMENT_NOTES.md)** - Production deployment
- **[Security Practices](../docs/security/SECURITY.md)** - Security guidelines
- **[FAQ](../docs/reference/FAQ.md)** - Frequently asked questions

These resources provide detailed context for development decisions and should be consulted when implementing new features or making architectural changes.
