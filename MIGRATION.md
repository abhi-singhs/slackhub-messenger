# Migration Guide: From Spark KV to Supabase

This guide helps you migrate your Slack Clone from using Spark's authentication and KV storage to Supabase for production-ready authentication and data persistence.

## What Changed

### Authentication
- **Before**: Used `spark.user()` for GitHub-based authentication
- **After**: Uses Supabase Auth with email/password and OAuth support

### Data Storage
- **Before**: Used `useKV` hook for local key-value storage
- **After**: Uses PostgreSQL database with real-time subscriptions

### User Management
- **Before**: Basic user info from GitHub
- **After**: Full user profiles with status, settings, and preferences

## Migration Steps

### 1. Set Up Supabase Project

1. Create account at [supabase.com](https://supabase.com)
2. Create new project
3. Note your project URL and anon key

### 2. Create Database Schema

Run the SQL from `supabase-schema.sql` in your Supabase SQL Editor:

```sql
-- This creates all necessary tables with proper relationships
-- See supabase-schema.sql for complete schema
```

### 3. Configure Environment Variables

Create `.env` file:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Update Your Application

The code has been updated to use new hooks:

- `useAuth()` - Replaces `spark.user()`
- `useSupabaseData()` - Replaces `useSlackData()` with KV
- `useSupabaseSettings()` - Replaces `useSettings()` with KV
- `useSupabaseUserStatus()` - Replaces `useUserStatus()` with KV
- `useSupabaseCalls()` - Replaces `useCalls()` with KV

### 5. Test Authentication

1. Start your application
2. You'll see a new login screen
3. Test both email/password and GitHub OAuth
4. Verify user profiles are created automatically

## Key Benefits of Migration

### Scalability
- **PostgreSQL**: Handles millions of messages efficiently
- **Real-time subscriptions**: Instant updates across all users
- **Proper indexing**: Fast search and queries

### Security
- **Row Level Security**: Users only see their allowed data
- **JWT tokens**: Secure authentication
- **OAuth providers**: Multiple login options

### Features
- **User profiles**: Full user management
- **Settings persistence**: Themes and preferences saved
- **Message history**: Complete conversation history
- **File storage**: Support for attachments (with Supabase Storage)

### Production Ready
- **Backup & Recovery**: Automatic database backups
- **Monitoring**: Built-in performance monitoring
- **Scaling**: Automatic scaling as your app grows

## Data Structure Comparison

### Messages
**Before (KV):**
```typescript
const [messages, setMessages] = useKV<Message[]>('slack-messages', [])
```

**After (Supabase):**
```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY,
  content TEXT NOT NULL,
  user_id UUID REFERENCES users(id),
  channel_id UUID REFERENCES channels(id),
  thread_id UUID REFERENCES messages(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Real-time Updates
**Before:** Manual state management
**After:** Automatic via Supabase subscriptions

```typescript
// Real-time message updates
const subscription = supabase
  .channel('messages-changes')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, 
    () => fetchMessages()
  )
  .subscribe()
```

## Troubleshooting

### Common Issues

1. **Environment Variables Not Loaded**
   - Ensure `.env` file is in project root
   - Restart development server after changes

2. **Database Connection Errors**
   - Verify Supabase URL and key are correct
   - Check project is not paused in Supabase dashboard

3. **Authentication Not Working**
   - Verify OAuth providers are configured in Supabase Auth settings
   - Check redirect URLs match your domain

4. **Real-time Not Working**
   - Enable real-time in Supabase project settings
   - Check RLS policies allow reading data

### Migration Checklist

- [ ] Supabase project created
- [ ] Database schema applied
- [ ] Environment variables configured
- [ ] OAuth providers set up (if using)
- [ ] Application updated to use new hooks
- [ ] Authentication tested
- [ ] Real-time messaging tested
- [ ] User settings tested
- [ ] Call functionality tested

## Next Steps

After successful migration:

1. **Deploy to Production**: Use Vercel, Netlify, or similar
2. **Configure Custom Domain**: Set up your own domain
3. **Set up Monitoring**: Monitor performance and errors
4. **Add More Features**: Leverage Supabase's full feature set
5. **Scale Up**: Upgrade Supabase plan as needed

## Support

- **Supabase Docs**: [docs.supabase.com](https://docs.supabase.com)
- **Community**: [community.supabase.com](https://community.supabase.com)
- **GitHub Issues**: Report bugs in the project repository