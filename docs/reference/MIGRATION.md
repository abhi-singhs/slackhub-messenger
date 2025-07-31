# Migration Guide

This guide helps you migrate between different versions of SlackHub Messenger or upgrade from previous configurations.

## Migration Overview

### Supported Migration Paths

- **Local Development → Supabase**: Migrate from local storage to Supabase backend
- **Spark KV → Supabase**: Upgrade from previous KV storage implementation
- **Environment Updates**: Update configuration for new features
- **Database Schema Updates**: Apply new database changes

## Pre-Migration Checklist

Before starting any migration:

- [ ] **Backup your data** (export conversations, settings)
- [ ] **Document current configuration** (environment variables, customizations)
- [ ] **Test migration in development** before applying to production
- [ ] **Notify users** of planned maintenance (for production systems)
- [ ] **Prepare rollback plan** in case of issues

## Migration Scenarios

### 1. Local Storage to Supabase Migration

#### Overview
This migration moves from browser localStorage to Supabase backend for proper multi-device synchronization and persistence.

#### Prerequisites
- Supabase account and project
- Database schema deployed
- Environment variables configured

#### Migration Steps

1. **Backup Local Data**
   ```javascript
   // Run in browser console to export data
   const backup = {
     messages: JSON.parse(localStorage.getItem('slack-messages') || '[]'),
     channels: JSON.parse(localStorage.getItem('slack-channels') || '[]'),
     settings: JSON.parse(localStorage.getItem('user-settings') || '{}'),
     lastRead: JSON.parse(localStorage.getItem('last-read-timestamps') || '{}')
   }
   console.log('Backup data:', backup)
   // Copy this data for import
   ```

2. **Set up Supabase Project**
   ```bash
   # Follow the setup guide
   cp .env.example .env
   # Edit .env with your Supabase credentials
   ```

3. **Deploy Database Schema**
   ```sql
   -- Run supabase-schema.sql in your Supabase SQL editor
   -- This creates all necessary tables and policies
   ```

4. **Update Application Code**
   ```typescript
   // Replace localStorage hooks with Supabase hooks
   // Old:
   const { messages } = useSlackData()
   
   // New:
   const { user } = useAuth()
   const { messages } = useSupabaseData(user)
   ```

5. **Import Data (Optional)**
   ```typescript
   // Create migration script to import backed up data
   const importData = async (backupData) => {
     // Import channels
     for (const channel of backupData.channels) {
       await supabase.from('channels').insert({
         name: channel.name,
         description: channel.description,
         created_by: user.id
       })
     }
     
     // Import messages
     for (const message of backupData.messages) {
       await supabase.from('messages').insert({
         content: message.content,
         user_id: user.id,
         channel_id: message.channelId,
         created_at: new Date(message.timestamp).toISOString()
       })
     }
   }
   ```

6. **Test Migration**
   ```bash
   npm run dev
   # Verify all features work with Supabase
   ```

7. **Clean Up Local Storage**
   ```javascript
   // After confirming migration success
   localStorage.removeItem('slack-messages')
   localStorage.removeItem('slack-channels')
   localStorage.removeItem('user-settings')
   localStorage.removeItem('last-read-timestamps')
   ```

### 2. Environment Variable Updates

#### Version 1.0.0 → 1.1.0

**New Variables Added:**
```env
# New in 1.1.0
VITE_ENABLE_PUSH_NOTIFICATIONS=true
VITE_MAX_FILE_SIZE=10485760
VITE_ENABLE_MESSAGE_EDITING=true
```

**Migration Steps:**
1. Update `.env` file with new variables
2. Restart development server
3. Test new features

#### Configuration Changes
```env
# Old format (deprecated)
VITE_SUPABASE_URL=https://example.supabase.co
VITE_SUPABASE_KEY=placeholder

# New format (recommended)
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Database Schema Migrations

#### Schema Version Updates

When new features require database changes, follow these steps:

1. **Backup Current Database**
   ```sql
   -- Create backup in Supabase dashboard
   -- Go to Settings > Database > Backups
   ```

2. **Apply Migration Scripts**
   ```sql
   -- Example: Adding message editing support
   ALTER TABLE messages 
   ADD COLUMN edited BOOLEAN DEFAULT FALSE,
   ADD COLUMN edited_at TIMESTAMP WITH TIME ZONE;
   
   -- Update existing data
   UPDATE messages SET edited = FALSE WHERE edited IS NULL;
   ```

3. **Update Application Code**
   ```typescript
   // Update TypeScript interfaces
   interface Message {
     id: string
     content: string
     // ... existing fields
     edited?: boolean        // New field
     editedAt?: number      // New field
   }
   ```

4. **Test Schema Changes**
   ```typescript
   // Verify new fields work correctly
   const testEdit = async () => {
     await supabase
       .from('messages')
       .update({ 
         content: 'Updated content',
         edited: true,
         edited_at: new Date().toISOString()
       })
       .eq('id', messageId)
   }
   ```

### 4. Component API Migrations

#### Hook API Changes

**Old Hook Usage (v0.x):**
```typescript
const { 
  messages, 
  sendMessage 
} = useSlackData()
```

**New Hook Usage (v1.x):**
```typescript
const { user } = useAuth()
const { 
  messages, 
  sendMessage 
} = useSupabaseData(user)
```

#### Component Props Changes

**Old Component API:**
```typescript
<MessageItem 
  message={message}
  onReact={handleReact}
/>
```

**New Component API:**
```typescript
<MessageItem 
  message={message}
  currentUser={user}
  onReact={handleReact}
  onEdit={handleEdit}    // New prop
  onDelete={handleDelete} // New prop
/>
```

## Automated Migration Tools

### Migration Script Template

```javascript
// migration-script.js
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

async function migrate() {
  try {
    console.log('Starting migration...')
    
    // Perform migration steps
    await migrateChannels()
    await migrateMessages()
    await migrateSettings()
    
    console.log('Migration completed successfully!')
  } catch (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  }
}

async function migrateChannels() {
  // Channel migration logic
}

async function migrateMessages() {
  // Message migration logic
}

async function migrateSettings() {
  // Settings migration logic
}

migrate()
```

### Running Migration Scripts

```bash
# Make script executable
chmod +x migration-script.js

# Run migration
node migration-script.js

# Or with npm script
npm run migrate
```

## Rollback Procedures

### Database Rollback

```sql
-- Rollback to previous backup
-- Use Supabase dashboard: Database > Backups > Restore
```

### Application Rollback

```bash
# Revert to previous version
git checkout previous-version-tag

# Reinstall dependencies
npm install

# Restart application
npm run dev
```

### Environment Rollback

```bash
# Restore previous environment
cp .env.backup .env

# Restart with old configuration
npm run dev
```

## Post-Migration Tasks

### Verification Checklist

After completing migration:

- [ ] **Authentication works** correctly
- [ ] **Messages sync** across devices
- [ ] **Real-time updates** function properly
- [ ] **File uploads** work as expected
- [ ] **User settings** are preserved
- [ ] **Performance** is acceptable
- [ ] **Error handling** works correctly

### Performance Testing

```javascript
// Test real-time performance
const testRealTime = async () => {
  const start = Date.now()
  
  await sendMessage('Test message')
  
  // Measure time until message appears
  const subscription = supabase
    .channel('test')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, 
      () => {
        const latency = Date.now() - start
        console.log(`Real-time latency: ${latency}ms`)
      }
    )
    .subscribe()
}
```

### User Communication

```markdown
## Migration Complete Notice

Dear Users,

We've successfully migrated SlackHub Messenger to our new infrastructure. 

**What's New:**
- Improved performance and reliability
- Better real-time synchronization
- Enhanced security features

**What You Need to Do:**
- Clear your browser cache
- Sign in again to sync your data
- Report any issues to our support team

Thank you for your patience during this upgrade!
```

## Troubleshooting Migration Issues

### Common Problems

#### Migration Script Fails
```bash
# Check logs for specific errors
tail -f migration.log

# Verify database connection
node -e "console.log(process.env.VITE_SUPABASE_URL)"
```

#### Data Not Appearing
```sql
-- Check if data was imported
SELECT COUNT(*) FROM messages;
SELECT COUNT(*) FROM channels;

-- Verify user permissions
SELECT * FROM auth.users WHERE id = 'your-user-id';
```

#### Authentication Issues
```typescript
// Clear auth state
await supabase.auth.signOut()
localStorage.clear()

// Re-authenticate
await supabase.auth.signInWithPassword({ email, password })
```

### Getting Help

If you encounter issues during migration:

1. **Check migration logs** for specific errors
2. **Verify environment configuration**
3. **Test with minimal data set** first
4. **Contact support** with detailed error information
5. **Use rollback procedures** if necessary

## Migration Checklist Template

Use this template for your migration:

```markdown
## Migration Plan: [Source] → [Target]

### Pre-Migration
- [ ] Backup current data
- [ ] Test migration in development
- [ ] Prepare rollback plan
- [ ] Schedule maintenance window
- [ ] Notify users

### Migration Steps
- [ ] Deploy new database schema
- [ ] Update environment variables
- [ ] Run migration scripts
- [ ] Update application code
- [ ] Test functionality

### Post-Migration
- [ ] Verify data integrity
- [ ] Test all features
- [ ] Monitor performance
- [ ] Collect user feedback
- [ ] Document lessons learned

### Rollback Plan
- [ ] Database restoration procedure
- [ ] Application version rollback
- [ ] Environment restoration
- [ ] User communication plan
```

---

For specific migration assistance, see our [Troubleshooting Guide](./TROUBLESHOOTING.md) or contact support.
