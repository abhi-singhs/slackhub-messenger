# Troubleshooting Guide

This guide helps you resolve common issues when developing or using SlackHub Messenger.

## Quick Diagnosis

Use this checklist to quickly identify the type of issue:

- [ ] **Environment**: Are environment variables set correctly?
- [ ] **Dependencies**: Are all npm packages installed?
- [ ] **Database**: Is Supabase configured and accessible?
- [ ] **Authentication**: Are auth providers configured?
- [ ] **Network**: Are there network connectivity issues?
- [ ] **Browser**: Are there browser-specific issues?

## Common Issues

### 🔧 Setup and Configuration

#### Issue: "Configuration Warning" message
**Symptoms:**
- Warning message about Supabase configuration
- Unable to authenticate or access data

**Solutions:**
1. **Check environment variables:**
   ```bash
   # Verify .env file exists and has correct values
   cat .env
   ```
   
2. **Update with actual Supabase credentials:**
   ```env
   VITE_SUPABASE_URL=https://your-actual-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-actual-anon-key
   ```

3. **Verify Supabase project status:**
   - Go to your Supabase dashboard
   - Check if project is active and healthy

**Related Docs:** [Setup Guide](../setup/SUPABASE_SETUP.md), [Environment Configuration](../deployment/ENVIRONMENT.md)

---

#### Issue: "Module not found" errors
**Symptoms:**
```
Error: Cannot resolve module '@/components/MyComponent'
Module not found: Can't resolve 'src/hooks/useMyHook'
```

**Solutions:**
1. **Check import paths:**
   ```typescript
   // ✅ Correct: Use @ alias
   import { MyComponent } from '@/components/MyComponent'
   
   // ❌ Incorrect: Relative path from wrong location
   import { MyComponent } from '../../components/MyComponent'
   ```

2. **Verify file exists:**
   ```bash
   # Check if file exists at expected location
   ls src/components/MyComponent.tsx
   ```

3. **Restart development server:**
   ```bash
   npm run dev
   ```

**Related Docs:** [Development Guide](../development/DEVELOPMENT.md)

---

### 🗄️ Database Issues

#### Issue: Database connection errors
**Symptoms:**
```
Error: Failed to fetch data from Supabase
Network Error: Unable to connect to database
```

**Solutions:**
1. **Verify Supabase project status:**
   - Check Supabase dashboard for outages
   - Verify project is not paused

2. **Test connection:**
   ```typescript
   // Add to a component to test connection
   const testConnection = async () => {
     const { data, error } = await supabase.from('users').select('count').limit(1)
     console.log('Connection test:', { data, error })
   }
   ```

3. **Check network connectivity:**
   ```bash
   # Test basic connectivity
   ping your-project.supabase.co
   ```

4. **Verify API keys:**
   - Ensure anon key is correct
   - Check key permissions in Supabase dashboard

**Related Docs:** [Setup Guide](../setup/SUPABASE_SETUP.md)

---

#### Issue: Row Level Security (RLS) policy errors
**Symptoms:**
```
Error: new row violates row-level security policy
Permission denied for table: messages
```

**Solutions:**
1. **Check RLS policies:**
   - Go to Supabase dashboard > Authentication > Policies
   - Verify policies allow the operation

2. **Verify user authentication:**
   ```typescript
   // Check if user is properly authenticated
   const { data: { user } } = await supabase.auth.getUser()
   console.log('Current user:', user)
   ```

3. **Test with policy disabled temporarily:**
   ```sql
   -- TEMPORARILY disable RLS for testing (re-enable after!)
   ALTER TABLE messages DISABLE ROW LEVEL SECURITY;
   ```

**Related Docs:** [Database Schema](../architecture/DATABASE_SCHEMA.md)

---

### 🔐 Authentication Issues

#### Issue: GitHub OAuth not working
**Symptoms:**
- "OAuth error" messages
- Redirect loops
- "Invalid client" errors

**Solutions:**
1. **Verify GitHub OAuth app configuration:**
   - Authorization callback URL: `https://your-project.supabase.co/auth/v1/callback`
   - Client ID and secret are correct in Supabase

2. **Check Supabase auth settings:**
   - Go to Authentication > Providers > GitHub
   - Verify enabled and configured correctly

3. **Test redirect URL:**
   ```bash
   # Should match your Supabase project URL
   echo "https://$(grep VITE_SUPABASE_URL .env | cut -d'=' -f2)/auth/v1/callback"
   ```

**Related Docs:** [Setup Guide](../setup/SUPABASE_SETUP.md)

---

#### Issue: OAuth authentication fails (any provider)
**Symptoms:**
- "OAuth error" during redirect
- Redirect loop back to login
- "Invalid client" or "redirect_uri_mismatch"

**Solutions:**
1. Verify provider configuration in Supabase (Authentication > Providers) and that the provider is enabled
2. Ensure callback URL matches exactly: `https://<project-id>.supabase.co/auth/v1/callback`
3. For local dev, add your origin to the provider (when applicable): `http://localhost:5173`
4. Confirm `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are correct in `.env`

**Related Docs:** [Setup Guide](../setup/SUPABASE_SETUP.md)

---

### 🎨 UI and Styling Issues

#### Issue: Dark mode not working
**Symptoms:**
- Theme toggle doesn't change appearance
- CSS variables not updating
- Components stuck in light/dark mode

**Solutions:**
1. **Check theme class on document:**
   ```javascript
   // Should toggle between 'light' and 'dark'
   console.log(document.documentElement.className)
   ```

2. **Verify CSS variables:**
   ```javascript
   // Check if variables are defined
   const styles = getComputedStyle(document.documentElement)
   console.log('Background color:', styles.getPropertyValue('--color-bg'))
   ```

3. **Clear localStorage:**
   ```javascript
   // Theme preference might be corrupted
   localStorage.removeItem('theme')
   localStorage.removeItem('darkMode')
   ```

**Related Docs:** [Development Guide](../development/DEVELOPMENT.md)

---

#### Issue: Components not rendering correctly
**Symptoms:**
- Missing styles
- Layout broken
- Components overlapping

**Solutions:**
1. **Check for CSS conflicts:**
   ```typescript
   // Look for conflicting class names
   <div className="flex items-center"> {/* Remove conflicting classes */}
   ```

2. **Verify Tailwind classes:**
   ```bash
   # Ensure Tailwind is working
   npm run dev
   # Check browser dev tools for applied styles
   ```

3. **Test with minimal example:**
   ```typescript
   // Create minimal component to isolate issue
   function TestComponent() {
     return <div className="p-4 bg-red-500">Test</div>
   }
   ```

**Related Docs:** [Development Guide](../development/DEVELOPMENT.md)

---

### 📱 Real-time and Performance Issues

#### Issue: Real-time updates not working
**Symptoms:**
- Messages don't appear immediately
- User status not updating
- No live data synchronization

**Solutions:**
1. **Check WebSocket connection:**
   ```typescript
   // Monitor subscription status
   const subscription = supabase
     .channel('test')
     .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, 
       (payload) => console.log('Real-time update:', payload)
     )
     .subscribe((status) => console.log('Subscription status:', status))
   ```

2. **Verify network connectivity:**
   - Check if firewall blocks WebSocket connections
   - Test on different network

3. **Check Supabase real-time settings:**
   - Go to Database > Replication
   - Ensure tables are enabled for real-time

**Related Docs:** [Architecture](../architecture/ARCHITECTURE.md)

---

#### Issue: Application performance problems
**Symptoms:**
- Slow loading times
- High memory usage
- Laggy interactions

**Solutions:**
1. **Profile performance:**
   ```typescript
   // Add performance logging
   const start = performance.now()
   await expensiveOperation()
   console.log(`Operation took ${performance.now() - start}ms`)
   ```

2. **Check for memory leaks:**
   ```typescript
   // Ensure cleanup in useEffect
   useEffect(() => {
     const subscription = supabase.channel('test').subscribe()
     
     return () => {
       supabase.removeChannel(subscription) // Important cleanup
     }
   }, [])
   ```

3. **Optimize re-renders:**
   ```typescript
   // Use React.memo for expensive components
   const ExpensiveComponent = React.memo(({ data }) => {
     return <div>{/* Expensive rendering */}</div>
   })
   ```

**Related Docs:** [Development Guide](../development/DEVELOPMENT.md)

---

## Debugging Tools

### Browser Developer Tools

#### Console Debugging
```typescript
// Add strategic console logs
console.log('Component rendered with props:', props)
console.log('State updated:', state)
console.error('Error occurred:', error)

// Use console.table for objects
console.table(messages)
```

#### Network Tab
- Monitor API requests to Supabase
- Check request/response headers
- Verify WebSocket connections

#### Application Tab
- Check localStorage for cached data
- Verify service worker status
- Inspect cookies and sessions

### React Developer Tools

1. **Install React DevTools** browser extension
2. **Inspect component tree** and props
3. **Monitor state changes** in real-time
4. **Profile component performance**

### VS Code Debugging

#### Debug Configuration
```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug in Chrome",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:5173",
      "webRoot": "${workspaceFolder}/src"
    }
  ]
}
```

#### Breakpoint Debugging
1. Set breakpoints in VS Code
2. Start debug session
3. Step through code execution
4. Inspect variables and call stack

### Supabase Debugging

#### Dashboard Monitoring
- **Database > Logs**: Check database queries and errors
- **Authentication > Users**: Verify user accounts
- **API > API Logs**: Monitor API request patterns

#### SQL Editor Testing
```sql
-- Test queries directly in Supabase
SELECT * FROM messages 
WHERE channel_id = 'your-channel-id' 
ORDER BY created_at DESC 
LIMIT 10;

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'messages';
```

## Environment-Specific Issues

### Development Environment

#### Common Issues:
- Port already in use
- Hot reload not working
- Environment variables not loading

#### Solutions:
```bash
# Kill process on port 5173
lsof -ti:5173 | xargs kill -9

# Clear npm cache
npm cache clean --force

# Restart with fresh install
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Production Environment

#### Common Issues:
- Build failures
- Environment variables not set
- CORS errors

#### Solutions:
```bash
# Test production build locally
npm run build
npm run preview

# Check build output
ls -la dist/

# Verify environment variables in deployment platform
```

## Getting Additional Help

### Self-Help Resources

1. **Search existing issues** on GitHub
2. **Check Stack Overflow** for similar problems
3. **Review Supabase documentation**
4. **Test with minimal reproduction case**

### Community Support

1. **GitHub Discussions** for general questions
2. **GitHub Issues** for bug reports
3. **Supabase Discord** for backend issues
4. **React community forums** for React-specific problems

### Creating Bug Reports

Include the following information:

```markdown
## Bug Description
Clear description of the issue

## Steps to Reproduce
1. Step one
2. Step two
3. Step three

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Environment
- OS: [e.g., macOS 12.0]
- Browser: [e.g., Chrome 96.0]
- Node.js version: [e.g., 18.12.0]
- Package version: [e.g., 1.2.3]

## Additional Context
- Console errors
- Screenshots
- Related code snippets
```

---

**Remember**: Most issues have simple solutions. Work through this guide systematically, and don't hesitate to ask for help if you're stuck!
