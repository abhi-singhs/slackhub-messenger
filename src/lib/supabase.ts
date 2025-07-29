import { createClient } from '@supabase/supabase-js'

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY'

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

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