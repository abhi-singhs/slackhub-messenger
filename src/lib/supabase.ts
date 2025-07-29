import { createClient } from '@supabase/supabase-js'

// Supabase configuration - using fallback values that won't cause deployment errors
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://example-project.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4YW1wbGUtcHJvamVjdCIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjQ1MTkyMDAwLCJleHAiOjE5NjA3NjgwMDB9.placeholder-key-replace-with-actual'

// Validate environment variables
const isValidConfig = supabaseUrl.includes('supabase.co') && supabaseAnonKey.length > 50

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: isValidConfig,
    persistSession: isValidConfig,
    detectSessionInUrl: isValidConfig
  }
})

// Helper function to check if Supabase is properly configured
export const isSupabaseConfigured = () => {
  return isValidConfig && 
    !supabaseUrl.includes('example-project') && 
    !supabaseAnonKey.includes('placeholder-key')
}

// Helper function to get configuration status message
export const getConfigurationMessage = () => {
  if (!isValidConfig) {
    return 'Supabase environment variables are missing or invalid. Please check your .env file.'
  }
  if (!isSupabaseConfigured()) {
    return 'Supabase is using placeholder configuration. Please update your .env file with actual Supabase credentials.'
  }
  return 'Supabase is properly configured.'
}

// Database types based on our application schema
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          username: string
          avatar_url: string | null
          status: 'active' | 'away' | 'busy'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          username: string
          avatar_url?: string | null
          status?: 'active' | 'away' | 'busy'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          username?: string
          avatar_url?: string | null
          status?: 'active' | 'away' | 'busy'
          created_at?: string
          updated_at?: string
        }
      }
      channels: {
        Row: {
          id: string
          name: string
          description: string | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          content: string
          user_id: string
          channel_id: string
          thread_id: string | null
          attachments: any[] | null
          edited: boolean
          edited_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          content: string
          user_id: string
          channel_id: string
          thread_id?: string | null
          attachments?: any[] | null
          edited?: boolean
          edited_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          content?: string
          user_id?: string
          channel_id?: string
          thread_id?: string | null
          attachments?: any[] | null
          edited?: boolean
          edited_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      reactions: {
        Row: {
          id: string
          message_id: string
          user_id: string
          emoji: string
          created_at: string
        }
        Insert: {
          id?: string
          message_id: string
          user_id: string
          emoji: string
          created_at?: string
        }
        Update: {
          id?: string
          message_id?: string
          user_id?: string
          emoji?: string
          created_at?: string
        }
      }
      user_settings: {
        Row: {
          id: string
          user_id: string
          theme: string
          dark_mode: boolean
          notification_settings: any
          last_read_timestamps: any
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          theme?: string
          dark_mode?: boolean
          notification_settings?: any
          last_read_timestamps?: any
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          theme?: string
          dark_mode?: boolean
          notification_settings?: any
          last_read_timestamps?: any
          created_at?: string
          updated_at?: string
        }
      }
      calls: {
        Row: {
          id: string
          type: 'voice' | 'video'
          initiator_id: string
          participants: string[]
          status: 'idle' | 'calling' | 'ringing' | 'connected' | 'ended' | 'declined' | 'missed'
          channel_id: string | null
          start_time: string
          end_time: string | null
          recording_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          type: 'voice' | 'video'
          initiator_id: string
          participants: string[]
          status?: 'idle' | 'calling' | 'ringing' | 'connected' | 'ended' | 'declined' | 'missed'
          channel_id?: string | null
          start_time: string
          end_time?: string | null
          recording_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          type?: 'voice' | 'video'
          initiator_id?: string
          participants?: string[]
          status?: 'idle' | 'calling' | 'ringing' | 'connected' | 'ended' | 'declined' | 'missed'
          channel_id?: string | null
          start_time?: string
          end_time?: string | null
          recording_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_status: 'active' | 'away' | 'busy'
      call_type: 'voice' | 'video'
      call_status: 'idle' | 'calling' | 'ringing' | 'connected' | 'ended' | 'declined' | 'missed'
    }
  }
}