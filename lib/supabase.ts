import { createClient } from "@supabase/supabase-js"

// Environment variables with fallbacks for development
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co"
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key"

// Check if we have real Supabase credentials
const hasSupabaseCredentials =
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
  process.env.NEXT_PUBLIC_SUPABASE_URL !== "https://placeholder.supabase.co"

export const supabase = hasSupabaseCredentials
  ? createClient(supabaseUrl, supabaseAnonKey, {
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    })
  : null

// Database types
export interface User {
  id: string
  username: string
  email?: string
  avatar_url?: string
  games_played: number
  total_score: number
  created_at: string
  updated_at: string
}

export interface Room {
  id: string
  code: string
  name: string
  host_id: string
  max_players: number
  is_active: boolean
  is_public: boolean
  current_word?: string
  current_drawer_id?: string
  time_left: number
  round_number: number
  created_at: string
  updated_at: string
}

export interface RoomPlayer {
  id: string
  room_id: string
  user_id: string
  score: number
  is_drawing: boolean
  has_guessed: boolean
  joined_at: string
  users?: User
}

export interface Guess {
  id: string
  room_id: string
  user_id: string
  guess: string
  is_correct: boolean
  created_at: string
  users?: User
}

export interface DrawingStroke {
  id: string
  room_id: string
  user_id: string
  stroke_data: {
    type: "start" | "draw" | "end" | "clear"
    x?: number
    y?: number
    color?: string
    size?: number
    tool?: string
  }
  created_at: string
}

// Export flag to check if Supabase is available
export { hasSupabaseCredentials }
