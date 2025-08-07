# Supabase Setup Guide

This Slack Clone application uses Supabase for authentication and data storage. Follow these steps to set up your Supabase project:

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create an account
2. Click "New Project" 
3. Fill in your project details:
   - Name: `slack-clone` (or any name you prefer)
   - Database Password: Choose a strong password
   - Region: Select the region closest to your users

## 2. Get Your Project Credentials

1. After your project is created, go to **Settings > API**
2. Copy your **Project URL** (it looks like `https://your-project-id.supabase.co`)
3. Copy your **anon/public key** (starts with `eyJ...`)

## 3. Update Environment Variables

1. Copy the `.env.example` file to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Update the `.env` file with your actual Supabase credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

## 4. Set Up Database Schema

Run the SQL schema in your Supabase project:

1. Go to **SQL Editor** in your Supabase dashboard
2. Copy the contents of `supabase-schema.sql` file 
3. Paste it into the SQL editor and run it

This will create all necessary tables:
- `users` - User profiles
- `channels` - Chat channels
- `messages` - Chat messages  
- `reactions` - Message reactions
- `user_settings` - User preferences and settings
- `calls` - Voice/video call history

## 5. Configure Authentication

1. Go to **Authentication > Settings** in your Supabase dashboard
2. Configure your preferred authentication methods:
   - **Email/Password**: Already enabled by default
   - **GitHub OAuth**: Add your GitHub OAuth app credentials
   - **Google OAuth**: Add your Google OAuth app credentials
   - **Anonymous Sign-ins**: Enable if you want guest access

### GitHub OAuth Setup (Optional)

1. Create a GitHub OAuth App at [github.com/settings/developers](https://github.com/settings/developers)
2. Set Authorization callback URL to: `https://your-project-id.supabase.co/auth/v1/callback`
3. Copy Client ID and Client Secret to Supabase **Authentication > Providers > GitHub**

### Google OAuth Setup (Optional)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API (now called Google Identity API)
4. Go to **Credentials** and create OAuth 2.0 Client IDs
5. Set the authorized redirect URI to: `https://your-project-id.supabase.co/auth/v1/callback`
6. Copy Client ID and Client Secret to Supabase **Authentication > Providers > Google**

## 6. Set Up Row Level Security (RLS)

The schema includes RLS policies, but you may want to review and customize them:

1. Go to **Authentication > Policies** in your Supabase dashboard
2. Review the automatically created policies
3. Adjust permissions as needed for your use case

## 7. Test Your Setup

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Try creating an account or signing in
3. Create a channel and send messages
4. Verify data appears in your Supabase dashboard under **Table Editor**

## Troubleshooting

- **"Configuration Warning"**: Make sure your `.env` file has valid Supabase credentials
- **Authentication not working**: Check that your Supabase URL and anon key are correct
- **Database errors**: Verify the schema was applied correctly
- **GitHub OAuth issues**: Check callback URL and credentials in both GitHub and Supabase
- **Google OAuth issues**: Check callback URL and credentials in both Google Cloud Console and Supabase

## Security Notes

- Never commit your `.env` file to version control
- The anon key is safe to use in client-side code
- RLS policies protect your data even with the anon key
- Use your service role key only in server-side code (not included in this client-only app)