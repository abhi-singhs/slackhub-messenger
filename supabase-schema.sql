-- Supabase Database Schema for Slack Clone
-- Run this SQL in your Supabase SQL Editor to set up the database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE user_status AS ENUM ('active', 'away', 'busy');
CREATE TYPE call_type AS ENUM ('voice', 'video');
CREATE TYPE call_status AS ENUM ('idle', 'calling', 'ringing', 'connected', 'ended', 'declined', 'missed');

-- Users table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL,
    username TEXT NOT NULL UNIQUE,
    avatar_url TEXT,
    status user_status DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Channels table
CREATE TABLE IF NOT EXISTS public.channels (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_by UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages table
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    content TEXT NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    channel_id UUID REFERENCES public.channels(id) ON DELETE CASCADE NOT NULL,
    thread_id UUID REFERENCES public.messages(id) ON DELETE CASCADE,
    attachments JSONB,
    edited BOOLEAN DEFAULT FALSE,
    edited_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reactions table
CREATE TABLE IF NOT EXISTS public.reactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    emoji TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique reactions per user per message per emoji
    UNIQUE(message_id, user_id, emoji)
);

-- User settings table
CREATE TABLE IF NOT EXISTS public.user_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    theme TEXT DEFAULT 'blue',
    dark_mode BOOLEAN DEFAULT FALSE,
    notification_settings JSONB DEFAULT '{}',
    last_read_timestamps JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Calls table
CREATE TABLE IF NOT EXISTS public.calls (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    type call_type NOT NULL,
    initiator_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    participants TEXT[] NOT NULL,
    status call_status DEFAULT 'idle',
    channel_id UUID REFERENCES public.channels(id) ON DELETE SET NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    recording_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_messages_channel_id ON public.messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON public.messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_thread_id ON public.messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);
CREATE INDEX IF NOT EXISTS idx_reactions_message_id ON public.reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_reactions_user_id ON public.reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_calls_participants ON public.calls USING GIN(participants);
CREATE INDEX IF NOT EXISTS idx_calls_status ON public.calls(status);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calls ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies

-- Users policies
CREATE POLICY "Users can view all users" ON public.users
    FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Channels policies
CREATE POLICY "Everyone can view channels" ON public.channels
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create channels" ON public.channels
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Channel creators can update their channels" ON public.channels
    FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Channel creators can delete their channels" ON public.channels
    FOR DELETE USING (auth.uid() = created_by);

-- Messages policies
CREATE POLICY "Everyone can view messages" ON public.messages
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create messages" ON public.messages
    FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);

CREATE POLICY "Users can update their own messages" ON public.messages
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own messages" ON public.messages
    FOR DELETE USING (auth.uid() = user_id);

-- Reactions policies
CREATE POLICY "Everyone can view reactions" ON public.reactions
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create reactions" ON public.reactions
    FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);

CREATE POLICY "Users can delete their own reactions" ON public.reactions
    FOR DELETE USING (auth.uid() = user_id);

-- User settings policies
CREATE POLICY "Users can view their own settings" ON public.user_settings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings" ON public.user_settings
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings" ON public.user_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Calls policies
CREATE POLICY "Users can view calls they participate in" ON public.calls
    FOR SELECT USING (
        auth.uid()::text = ANY(participants) OR 
        auth.uid() = initiator_id
    );

CREATE POLICY "Authenticated users can create calls" ON public.calls
    FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = initiator_id);

CREATE POLICY "Call initiators can update their calls" ON public.calls
    FOR UPDATE USING (auth.uid() = initiator_id);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_channels_updated_at BEFORE UPDATE ON public.channels
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON public.messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON public.user_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_calls_updated_at BEFORE UPDATE ON public.calls
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Default channels will be created when the first user registers

-- Create a function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, username, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
    );
    
    INSERT INTO public.user_settings (user_id)
    VALUES (NEW.id);
    
    -- Create default channels if this is the first user
    IF NOT EXISTS (SELECT 1 FROM public.channels LIMIT 1) THEN
        INSERT INTO public.channels (name, description, created_by) VALUES
            ('general', 'General discussion', NEW.id),
            ('random', 'Random chatter', NEW.id),
            ('dev', 'Development talk', NEW.id);
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create a function to get message reactions grouped
CREATE OR REPLACE FUNCTION get_message_reactions(message_id UUID)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT COALESCE(
        jsonb_agg(
            jsonb_build_object(
                'emoji', emoji,
                'count', user_count,
                'users', user_ids
            )
        ), '[]'::jsonb
    ) INTO result
    FROM (
        SELECT 
            emoji,
            COUNT(*) as user_count,
            array_agg(user_id::text) as user_ids
        FROM public.reactions 
        WHERE reactions.message_id = get_message_reactions.message_id
        GROUP BY emoji
    ) grouped_reactions;
    
    RETURN result;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Enable realtime for all tables to support live updates
-- This allows the frontend to subscribe to real-time changes

-- Enable realtime for users table (for status updates, profile changes)
ALTER PUBLICATION supabase_realtime ADD TABLE public.users;

-- Enable realtime for channels table (for new channels, updates)
ALTER PUBLICATION supabase_realtime ADD TABLE public.channels;

-- Enable realtime for messages table (for new messages, edits, deletions)
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Enable realtime for reactions table (for emoji reactions)
ALTER PUBLICATION supabase_realtime ADD TABLE public.reactions;

-- Enable realtime for user_settings table (for theme changes, settings updates)
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_settings;

-- Enable realtime for calls table (for call status updates, new calls)
ALTER PUBLICATION supabase_realtime ADD TABLE public.calls;