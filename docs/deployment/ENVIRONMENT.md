# Environment Configuration Guide

This document outlines all environment variables and configuration options for the SlackHub Messenger application.

## Environment Variables

### Required Variables

#### Supabase Configuration
```env
# Supabase Project Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**Description:**
- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous/public key

**How to get these values:**
1. Go to your Supabase project dashboard
2. Navigate to **Settings > API**
3. Copy the **Project URL** and **anon public** key

### Optional Variables

#### Development Configuration
```env
# Development Mode (optional)
NODE_ENV=development
VITE_DEV_MODE=true

# API Configuration (optional)
VITE_API_TIMEOUT=30000
VITE_MAX_FILE_SIZE=10485760

# Debug Configuration (optional)
VITE_DEBUG_MODE=false
VITE_LOG_LEVEL=info
```

#### Feature Flags
```env
# Feature Toggles (optional)
VITE_ENABLE_FILE_UPLOAD=true
VITE_ENABLE_EMOJI_REACTIONS=true
VITE_ENABLE_THREADS=true
VITE_ENABLE_SEARCH=true
```

## Configuration Files

### Environment Files

#### `.env` (Local Development)
```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Development Settings
NODE_ENV=development
VITE_DEV_MODE=true
```

#### `.env.example` (Template)
```env
# Supabase Configuration
VITE_SUPABASE_URL=https://example-project.supabase.co
VITE_SUPABASE_ANON_KEY=placeholder-key-replace-with-actual

# Development Settings (optional)
NODE_ENV=development
VITE_DEV_MODE=true
```

#### `.env.production` (Production)
```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-production-anon-key

# Production Settings
NODE_ENV=production
VITE_DEV_MODE=false
```

### Application Configuration

#### `vite.config.ts`
```typescript
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";
import { resolve } from 'path'

const projectRoot = process.env.PROJECT_ROOT || import.meta.dirname

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': resolve(projectRoot, 'src') }
  },
})
```

#### `tailwind.config.js`
```javascript
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    // Custom theme configuration loaded from theme.json
  },
  darkMode: ["class"],
}
```

## Configuration Validation

### Runtime Validation
The application validates configuration at startup:

```typescript
// src/lib/supabase.ts
export const isSupabaseConfigured = () => {
  return isValidConfig && 
    !supabaseUrl.includes('example-project') && 
    !supabaseAnonKey.includes('placeholder-key')
}

export const getConfigurationMessage = () => {
  if (!isValidConfig) {
    return 'Supabase environment variables are missing or invalid.'
  }
  if (!isSupabaseConfigured()) {
    return 'Supabase is using placeholder configuration.'
  }
  return 'Supabase is properly configured.'
}
```

### Error Handling
- Missing required variables show helpful error messages
- Invalid configuration provides setup guidance
- Graceful fallbacks for optional settings

## Deployment Configurations

### Vercel
Create `vercel.json`:
```json
{
  "env": {
    "VITE_SUPABASE_URL": "@supabase-url",
    "VITE_SUPABASE_ANON_KEY": "@supabase-anon-key"
  },
  "build": {
    "env": {
      "NODE_ENV": "production"
    }
  }
}
```

Set environment variables in Vercel dashboard:
1. Go to your project settings
2. Navigate to **Environment Variables**
3. Add your Supabase credentials

### Netlify
Create `netlify.toml`:
```toml
[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  NODE_ENV = "production"

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
```

Set environment variables in Netlify dashboard:
1. Go to **Site settings > Environment variables**
2. Add your configuration variables

### Docker
Create `.env.docker`:
```env
VITE_SUPABASE_URL=${SUPABASE_URL}
VITE_SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
NODE_ENV=production
```

Use in `docker-compose.yml`:
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    env_file:
      - .env.docker
    environment:
      - NODE_ENV=production
```

## Security Considerations

### Environment Variable Security

#### ✅ Safe for Client-Side (VITE_ prefix)
- `VITE_SUPABASE_URL` - Project URL (public)
- `VITE_SUPABASE_ANON_KEY` - Anonymous key (public, protected by RLS)
- `VITE_*` - Any configuration prefixed with VITE_

#### ❌ Never Expose Client-Side
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (server-only)
- Database passwords
- Private API keys
- JWT secrets

### Best Practices

1. **Use `.env` files for local development only**
2. **Never commit `.env` files to version control**
3. **Use platform-specific secret management in production**
4. **Rotate keys regularly**
5. **Validate configuration at startup**
6. **Use least-privilege access principles**

## Configuration Presets

### Development Preset
```env
VITE_SUPABASE_URL=https://dev-project.supabase.co
VITE_SUPABASE_ANON_KEY=dev-anon-key
NODE_ENV=development
VITE_DEV_MODE=true
VITE_DEBUG_MODE=true
VITE_LOG_LEVEL=debug
```

### Staging Preset
```env
VITE_SUPABASE_URL=https://staging-project.supabase.co
VITE_SUPABASE_ANON_KEY=staging-anon-key
NODE_ENV=production
VITE_DEV_MODE=false
VITE_DEBUG_MODE=false
VITE_LOG_LEVEL=info
```

### Production Preset
```env
VITE_SUPABASE_URL=https://prod-project.supabase.co
VITE_SUPABASE_ANON_KEY=prod-anon-key
NODE_ENV=production
VITE_DEV_MODE=false
VITE_DEBUG_MODE=false
VITE_LOG_LEVEL=error
```

## Troubleshooting

### Common Issues

#### "Configuration Warning" Message
- **Cause**: Missing or invalid Supabase credentials
- **Solution**: Update `.env` file with valid credentials from Supabase dashboard

#### Environment Variables Not Loading
- **Cause**: Variables not prefixed with `VITE_`
- **Solution**: Ensure client-side variables start with `VITE_`

#### Build Failures
- **Cause**: Missing required environment variables
- **Solution**: Check build logs and ensure all required variables are set

### Debug Commands

Check environment loading:
```bash
# Show all environment variables
npm run env

# Validate configuration
npm run config:check

# Show build environment
npm run build -- --debug
```

## Configuration Schema

For TypeScript type safety, define environment variables:

```typescript
// src/env.d.ts
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_DEV_MODE?: string
  readonly VITE_DEBUG_MODE?: string
  readonly VITE_LOG_LEVEL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
```

---

For more setup details, see the [Setup Guide](../setup/SUPABASE_SETUP.md).
