# Contributing to SlackHub Messenger

Thank you for your interest in contributing to SlackHub Messenger! This document provides guidelines and information for contributors.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Process](#development-process)
- [Coding Standards](#coding-standards)
- [Submitting Changes](#submitting-changes)
- [Code Review Process](#code-review-process)
- [Community Guidelines](#community-guidelines)

## Getting Started

### Prerequisites

Before contributing, ensure you have:

- **Node.js 18+** and npm installed
- **Git** configured with your GitHub account
- **Supabase account** for testing
- Basic knowledge of **React**, **TypeScript**, and **Tailwind CSS**

### Setting Up Development Environment

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/yourusername/slackhub-messenger.git
   cd slackhub-messenger
   ```
3. **Add upstream remote**:
   ```bash
   git remote add upstream https://github.com/originalowner/slackhub-messenger.git
   ```
4. **Install dependencies**:
   ```bash
   npm install
   ```
5. **Set up environment** following the [Development Guide](./DEVELOPMENT.md)

### First Contribution

Look for issues labeled with:
- `good first issue` - Beginner-friendly tasks
- `help wanted` - Community contributions welcome
- `documentation` - Documentation improvements

## Development Process

### Branching Strategy

We use a **feature branch** workflow:

1. **Create a feature branch** from `main`:
   ```bash
   git checkout main
   git pull upstream main
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** following coding standards

3. **Commit your changes** with descriptive messages:
   ```bash
   git add .
   git commit -m "feat: add message threading support"
   ```

4. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

5. **Create a pull request** on GitHub

### Branch Naming Convention

Use descriptive branch names with prefixes:

- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `test/` - Test improvements
- `chore/` - Maintenance tasks

Examples:
- `feature/message-reactions`
- `fix/emoji-picker-positioning`
- `docs/api-documentation`

## Coding Standards

### TypeScript Guidelines

#### Type Safety
```typescript
// ✅ Good: Proper type definitions
interface MessageProps {
  id: string
  content: string
  author: User
  timestamp: number
  onReact?: (emoji: string) => void
}

// ❌ Bad: Using any
function handleMessage(data: any) {
  // ...
}

// ✅ Good: Proper typing
function handleMessage(data: Message) {
  // ...
}
```

#### Interface Definitions
```typescript
// ✅ Good: Clear, descriptive interfaces
interface CallSettings {
  audioEnabled: boolean
  videoEnabled: boolean
  recordingEnabled: boolean
}

// ❌ Bad: Unclear naming
interface Settings {
  a: boolean
  v: boolean
  r: boolean
}
```

### React Component Guidelines

#### Component Structure
```typescript
// ✅ Good: Well-structured component
interface MessageItemProps {
  message: Message
  currentUser: User
  onReact: (messageId: string, emoji: string) => void
  onReply: (messageId: string) => void
}

export function MessageItem({ 
  message, 
  currentUser, 
  onReact, 
  onReply 
}: MessageItemProps) {
  const [isHovered, setIsHovered] = useState(false)
  
  const handleReaction = useCallback((emoji: string) => {
    onReact(message.id, emoji)
  }, [message.id, onReact])
  
  return (
    <div 
      className="message-item"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Component content */}
    </div>
  )
}
```

#### Hook Usage
```typescript
// ✅ Good: Custom hook for business logic
function useMessageActions(message: Message, user: User) {
  const [isLoading, setIsLoading] = useState(false)
  
  const addReaction = useCallback(async (emoji: string) => {
    setIsLoading(true)
    try {
      await api.addReaction(message.id, emoji)
    } catch (error) {
      console.error('Failed to add reaction:', error)
    } finally {
      setIsLoading(false)
    }
  }, [message.id])
  
  return { addReaction, isLoading }
}
```

### Styling Guidelines

#### Tailwind CSS Best Practices
```typescript
// ✅ Good: Semantic class combinations
<div className="flex items-center space-x-2 p-4 bg-neutral-1 hover:bg-neutral-2 rounded-lg transition-colors">
  <Avatar className="h-8 w-8" />
  <span className="text-neutral-11 font-medium truncate">
    {username}
  </span>
</div>

// ❌ Bad: Inline styles and magic numbers
<div style={{ padding: '16px', backgroundColor: '#f5f5f5' }}>
  {/* content */}
</div>
```

#### Responsive Design
```typescript
// ✅ Good: Mobile-first responsive design
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
  {/* Responsive grid */}
</div>

// ✅ Good: Conditional rendering for mobile
const isMobile = useMediaQuery('(max-width: 768px)')

return (
  <div className="flex flex-col md:flex-row">
    {!isMobile && <Sidebar />}
    <MainContent />
  </div>
)
```

### Database Integration

#### Supabase Best Practices
```typescript
// ✅ Good: Proper error handling and types
async function fetchMessages(channelId: string): Promise<Message[]> {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        users(username, avatar_url)
      `)
      .eq('channel_id', channelId)
      .order('created_at', { ascending: true })
    
    if (error) throw error
    
    return data.map(msg => ({
      id: msg.id,
      content: msg.content,
      userId: msg.user_id,
      userName: msg.users?.username || 'Unknown',
      userAvatar: msg.users?.avatar_url || '',
      timestamp: new Date(msg.created_at).getTime(),
      channelId: msg.channel_id
    }))
  } catch (error) {
    console.error('Error fetching messages:', error)
    throw new Error('Failed to fetch messages')
  }
}

// ❌ Bad: No error handling
async function fetchMessages(channelId: string) {
  const { data } = await supabase
    .from('messages')
    .select('*')
    .eq('channel_id', channelId)
  
  return data // Could be null/undefined
}
```

## Submitting Changes

### Commit Message Format

Use **Conventional Commits** format:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

#### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

#### Examples
```
feat(messaging): add message threading support

- Add thread UI components
- Implement thread data handling
- Update database schema for thread relationships

Closes #123
```

```
fix(emoji): resolve picker positioning on mobile

The emoji picker was appearing off-screen on mobile devices.
Fixed by adjusting positioning logic and adding viewport detection.

Fixes #456
```

### Pull Request Guidelines

#### PR Title
Use the same format as commit messages:
```
feat(calls): add video call recording functionality
```

#### PR Description Template
```markdown
## Description
Brief description of changes and motivation.

## Changes Made
- List of specific changes
- Include any breaking changes
- Mention new dependencies

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed
- [ ] Cross-browser testing (if applicable)

## Screenshots (if applicable)
Include screenshots for UI changes.

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No console errors/warnings
```

#### Pre-submission Checklist
- [ ] **Code compiles** without errors or warnings
- [ ] **Tests pass** locally
- [ ] **Linting passes** (`npm run lint`)
- [ ] **Types are correct** (TypeScript compilation succeeds)
- [ ] **Documentation updated** if needed
- [ ] **Manual testing** completed

## Code Review Process

### Reviewer Guidelines

When reviewing code, check for:

1. **Functionality**: Does the code work as intended?
2. **Code Quality**: Is the code clean, readable, and maintainable?
3. **Performance**: Are there any performance implications?
4. **Security**: Are there any security concerns?
5. **Testing**: Are there adequate tests?
6. **Documentation**: Is documentation updated/adequate?

### Review Criteria

#### Approval Criteria
- ✅ Code follows project conventions
- ✅ All tests pass
- ✅ No security vulnerabilities
- ✅ Performance is acceptable
- ✅ Documentation is complete

#### Request Changes Criteria
- ❌ Code style violations
- ❌ Missing error handling
- ❌ Inadequate testing
- ❌ Security issues
- ❌ Performance problems

### Responding to Review Feedback

1. **Read feedback carefully** and ask for clarification if needed
2. **Make requested changes** in new commits
3. **Reply to comments** explaining your changes
4. **Request re-review** when ready

## Community Guidelines

### Code of Conduct

We follow a **Code of Conduct** to ensure a welcoming environment:

1. **Be respectful** and considerate
2. **Use inclusive language**
3. **Accept constructive criticism** gracefully
4. **Focus on collaboration** and learning
5. **Help others** when possible

### Communication

#### GitHub Issues
- Use clear, descriptive titles
- Provide detailed descriptions
- Include steps to reproduce (for bugs)
- Add relevant labels

#### Pull Request Discussions
- Be constructive in feedback
- Explain reasoning behind suggestions
- Ask questions if unclear
- Thank reviewers for their time

#### Getting Help

1. **Search existing issues** first
2. **Check documentation** in `/docs`
3. **Ask in discussions** for general questions
4. **Create issues** for bugs or feature requests

## Recognition

Contributors are recognized through:

- **GitHub contributors list**
- **Changelog acknowledgments**
- **Special thanks** in releases

Thank you for contributing to SlackHub Messenger! 🎉

---

For technical setup help, see the [Development Guide](./DEVELOPMENT.md).
For project architecture, see the [Architecture Documentation](../architecture/ARCHITECTURE.md).
