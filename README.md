# SlackHub Messenger with Supabase

A modern Slack-like chat application built with React, TypeScript, and Supabase for authentication and real-time data storage.

## Features

- **Real-time messaging** with instant updates
- **Channel management** - create, edit, and delete channels
- **Message threads** for organized conversations
- **Emoji reactions** with user attribution
- **File attachments** with preview support
- **User status** management (active, away, busy)
- **Voice and video calling** with recording
- **Message search** functionality
- **Rich text formatting** with TipTap editor
- **Keyboard shortcuts** for power users
- **Dark/light themes** with multiple color schemes
- **Mobile responsive** design
- **Notification settings** with sound alerts

## Prerequisites

- Node.js 18+ and npm
- A Supabase account and project

## Setup Instructions

### 1. Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to your project's SQL Editor
3. Copy and paste the contents of `supabase-schema.sql` and run it
4. Go to Authentication > Settings and configure your auth providers:
   - For GitHub OAuth: Add your GitHub OAuth app credentials
   - For email/password: Configure email templates as needed
5. Go to Settings > API to find your project URL and anon key

### 2. Environment Configuration

1. Copy the environment template:
   ```bash
   cp .env.example .env
   ```

2. Fill in your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

### 3. Install Dependencies

```bash
npm install
```

### 4. Run the Application

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Database Schema

The application uses the following Supabase tables:

- **users** - User profiles extending Supabase auth
- **channels** - Chat channels/rooms
- **messages** - Chat messages with threading support
- **reactions** - Message reactions with emoji support
- **user_settings** - User preferences and settings
- **calls** - Voice/video call history and recordings

## Authentication

The app supports multiple authentication methods:

- **Email/Password** - Traditional signup and login
- **GitHub OAuth** - Sign in with GitHub account
- **Automatic profile creation** - User profiles are created automatically on first login

## Real-time Features

All data updates happen in real-time using Supabase's real-time subscriptions:

- New messages appear instantly
- Channel updates are synchronized
- User status changes are live
- Reactions update in real-time

## Key Components

- **AuthComponent** - Handles login/signup UI
- **useAuth** - Authentication state management
- **useSupabaseData** - Real-time data synchronization
- **useSupabaseSettings** - User preferences and theming
- **useSupabaseUserStatus** - User status management

## Migration from Spark KV

This version replaces the previous Spark authentication and KV storage with Supabase:

- **Authentication**: Now uses Supabase Auth instead of `spark.user()`
- **Data Storage**: PostgreSQL database instead of KV store
- **Real-time**: Supabase real-time instead of local state
- **User Management**: Full user profiles with status and settings

## Deployment

1. Build the project:
   ```bash
   npm run build
   ```

2. Deploy to your preferred hosting platform (Vercel, Netlify, etc.)

3. Make sure to set the environment variables in your deployment platform

## Development

- **Hot reload** - Changes reflect immediately during development
- **TypeScript** - Full type safety throughout the application
- **ESLint** - Code quality and consistency
- **Tailwind CSS** - Utility-first styling with custom theme system

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - feel free to use this code for your own projects.