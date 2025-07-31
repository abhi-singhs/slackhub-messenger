# Development Guide

This guide covers everything you need to know for developing SlackHub Messenger, from initial setup to advanced development practices.

## Quick Reference

- **Coding Standards**: See our [Copilot Instructions](../../.github/copilot-instructions.md) for comprehensive coding guidelines
- **Component Patterns**: Reference [Component Library](./COMPONENTS.md) for UI component documentation
- **API Reference**: Check [API Documentation](./API.md) for hook and utility usage

## Prerequisites

- **Node.js** 18+ and npm
- **Git** for version control
- **VS Code** (recommended) with suggested extensions
- **Supabase account** for backend services

## Development Setup

### 1. Clone and Install

```bash
# Clone the repository
git clone https://github.com/yourusername/slackhub-messenger.git
cd slackhub-messenger

# Install dependencies
npm install
```

### 2. Environment Configuration

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your Supabase credentials
# See setup guide for getting Supabase credentials
```

### 3. Database Setup

Follow the [Supabase Setup Guide](../setup/SUPABASE_SETUP.md) to:
1. Create a Supabase project
2. Run the database schema
3. Configure authentication

### 4. Start Development Server

```bash
# Start the development server
npm run dev

# Application will be available at http://localhost:5173
```

## Development Workflow

### Project Structure

```
src/
├── components/          # React components
│   ├── ui/             # Reusable UI components (shadcn/ui)
│   └── *.tsx           # Feature-specific components
├── hooks/              # Custom React hooks
├── lib/                # Utility libraries and configurations
├── types/              # TypeScript type definitions
├── constants/          # Application constants
└── assets/            # Static assets
```

### Component Development

#### Creating New Components

1. **Create the component file:**
```typescript
// src/components/MyComponent.tsx
import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface MyComponentProps {
  title: string
  onAction?: () => void
}

export function MyComponent({ title, onAction }: MyComponentProps) {
  const [isLoading, setIsLoading] = useState(false)

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold">{title}</h2>
      <Button onClick={onAction} disabled={isLoading}>
        Action
      </Button>
    </div>
  )
}
```

2. **Export from index (if needed):**
```typescript
// src/components/index.ts
export { MyComponent } from './MyComponent'
```

3. **Use in other components:**
```typescript
import { MyComponent } from '@/components/MyComponent'

function App() {
  return <MyComponent title="Hello" onAction={() => console.log('clicked')} />
}
```

#### Component Guidelines

- **Use TypeScript interfaces** for all props
- **Follow naming conventions**: PascalCase for components
- **Use custom hooks** for business logic
- **Keep components focused** on UI rendering
- **Include proper JSDoc** comments for complex components

For detailed component development patterns, see our [Copilot Instructions](../../.github/copilot-instructions.md#component-structure) and [Component Library Documentation](./COMPONENTS.md).

### Hook Development

#### Creating Custom Hooks

```typescript
// src/hooks/useMyFeature.ts
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { MyData } from '@/types'

export function useMyFeature() {
  const [data, setData] = useState<MyData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('my_table')
        .select('*')
      
      if (error) throw error
      setData(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, error, refetch: fetchData }
}
```

#### Hook Guidelines

- **Start with `use`** prefix
- **Return an object** with named properties
- **Handle loading states** properly
- **Include error handling**
- **Use useCallback** for expensive operations
- **Clean up subscriptions** in useEffect

### State Management

#### Local State
Use `useState` for component-specific state:

```typescript
function MyComponent() {
  const [isOpen, setIsOpen] = useState(false)
  const [formData, setFormData] = useState({ name: '', email: '' })
  
  return (
    // Component JSX
  )
}
```

#### Global State
Use custom hooks with Context for shared state:

```typescript
// src/hooks/useAuth.ts - Already implemented
const { user, loading, signIn, signOut } = useAuth()

// src/hooks/useSupabaseData.ts - Already implemented
const { messages, channels, sendMessage } = useSupabaseData(user)
```

### Styling Guidelines

#### Tailwind CSS Usage

```typescript
// Use utility classes
<div className="flex items-center space-x-2 p-4 bg-neutral-1 rounded-lg">
  <Avatar className="h-8 w-8" />
  <span className="text-neutral-11 font-medium">Username</span>
</div>

// Use custom CSS variables
<div className="bg-[var(--color-bg)] text-[var(--color-fg)]">
  Content
</div>

// Responsive design
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Responsive grid */}
</div>
```

#### Theme Integration

```typescript
// Use theme-aware colors
<Button className="bg-accent-9 hover:bg-accent-10 text-accent-contrast">
  Themed Button
</Button>

// Dark mode support is automatic through CSS variables
```

### Database Integration

#### Using Supabase

```typescript
// Query data
const { data, error } = await supabase
  .from('messages')
  .select(`
    *,
    users(username, avatar_url)
  `)
  .eq('channel_id', channelId)
  .order('created_at', { ascending: true })

// Insert data
const { data, error } = await supabase
  .from('messages')
  .insert({
    content: 'Hello world',
    user_id: user.id,
    channel_id: channelId
  })

// Real-time subscriptions
useEffect(() => {
  const subscription = supabase
    .channel('messages')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'messages' },
      (payload) => {
        // Handle real-time updates
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(subscription)
  }
}, [])
```

#### Error Handling

```typescript
// Always handle errors
try {
  const { data, error } = await supabaseOperation()
  if (error) throw error
  // Handle success
} catch (error) {
  console.error('Operation failed:', error)
  // Show user-friendly error message
}
```

## Testing

### Component Testing

```typescript
// src/components/__tests__/MyComponent.test.tsx
import { render, screen } from '@testing-library/react'
import { MyComponent } from '../MyComponent'

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent title="Test" />)
    expect(screen.getByText('Test')).toBeInTheDocument()
  })
})
```

### Hook Testing

```typescript
// src/hooks/__tests__/useMyFeature.test.ts
import { renderHook } from '@testing-library/react'
import { useMyFeature } from '../useMyFeature'

describe('useMyFeature', () => {
  it('fetches data correctly', async () => {
    const { result } = renderHook(() => useMyFeature())
    expect(result.current.loading).toBe(true)
    // Add more assertions
  })
})
```

## Code Quality

### ESLint Configuration

The project uses ESLint for code quality:

```bash
# Run linting
npm run lint

# Fix auto-fixable issues
npm run lint -- --fix
```

### TypeScript

```bash
# Type checking
npx tsc --noEmit

# Type checking in watch mode
npx tsc --noEmit --watch
```

### Code Formatting

VS Code should auto-format on save. Configure your editor:

```json
// .vscode/settings.json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "typescript.preferences.importModuleSpecifier": "relative"
}
```

## Performance Optimization

### React Performance

```typescript
// Use React.memo for expensive components
const ExpensiveComponent = React.memo(({ data }) => {
  return <div>{/* Expensive rendering */}</div>
})

// Use useCallback for event handlers
const handleClick = useCallback(() => {
  // Handle click
}, [dependency])

// Use useMemo for expensive calculations
const expensiveValue = useMemo(() => {
  return expensiveCalculation(data)
}, [data])
```

### Bundle Optimization

```typescript
// Dynamic imports for code splitting
const LazyComponent = lazy(() => import('./LazyComponent'))

// Use Suspense for loading states
<Suspense fallback={<Loading />}>
  <LazyComponent />
</Suspense>
```

## Debugging

### Development Tools

1. **React Developer Tools** - Browser extension for React debugging
2. **Supabase Dashboard** - Monitor database and auth
3. **Browser DevTools** - Network, console, performance
4. **VS Code Debugger** - Set breakpoints in code

### Common Debugging Patterns

```typescript
// Add debug logging
useEffect(() => {
  console.log('Component mounted with props:', props)
  return () => console.log('Component unmounting')
}, [])

// Debug state changes
useEffect(() => {
  console.log('State changed:', state)
}, [state])

// Debug API calls
const fetchData = async () => {
  console.log('Fetching data...')
  try {
    const result = await api.getData()
    console.log('Data received:', result)
    return result
  } catch (error) {
    console.error('API error:', error)
    throw error
  }
}
```

## Contributing Guidelines

### Commit Messages

Use conventional commit format:

```
feat: add message threading support
fix: resolve emoji picker positioning issue
docs: update API documentation
style: improve button component styling
refactor: simplify user status logic
test: add tests for message components
```

### Pull Request Process

1. **Create feature branch** from `main`
2. **Make your changes** following coding standards
3. **Add tests** for new functionality
4. **Update documentation** if needed
5. **Submit pull request** with clear description

### Code Review Checklist

- [ ] Code follows project conventions
- [ ] Tests are included and passing
- [ ] TypeScript types are properly defined
- [ ] Error handling is implemented
- [ ] Documentation is updated
- [ ] Performance considerations addressed

## Advanced Topics

### Custom Hooks Patterns

```typescript
// Data fetching hook with caching
export function useApiData<T>(key: string, fetcher: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    const cached = sessionStorage.getItem(key)
    if (cached) {
      setData(JSON.parse(cached))
      setLoading(false)
      return
    }
    
    fetcher().then(result => {
      setData(result)
      sessionStorage.setItem(key, JSON.stringify(result))
      setLoading(false)
    })
  }, [key])
  
  return { data, loading }
}
```

### Context Providers

```typescript
// Feature-specific context
const MyFeatureContext = createContext<MyFeatureContextType | null>(null)

export function MyFeatureProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(initialState)
  
  const value = useMemo(() => ({
    state,
    actions: {
      updateState: setState
    }
  }), [state])
  
  return (
    <MyFeatureContext.Provider value={value}>
      {children}
    </MyFeatureContext.Provider>
  )
}

export function useMyFeature() {
  const context = useContext(MyFeatureContext)
  if (!context) {
    throw new Error('useMyFeature must be used within MyFeatureProvider')
  }
  return context
}
```

## Troubleshooting

### Common Issues

#### "Module not found" errors
- Check import paths use `@/` alias
- Ensure file extensions are correct
- Verify file exists at expected location

#### Supabase connection issues
- Verify environment variables are set
- Check Supabase project status
- Validate API keys and URLs

#### Type errors
- Update TypeScript definitions
- Check interface compatibility
- Use proper type assertions

### Getting Help

1. **Check existing documentation** in `/docs`
2. **Search GitHub issues** for similar problems
3. **Check Supabase documentation** for backend issues
4. **Ask team members** for guidance

---

Happy coding! 🚀
