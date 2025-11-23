export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          role: 'student' | 'admin'
          payment_status: 'paid' | 'unpaid' | 'trial'
          trial_end_date: string | null
          login_enabled: boolean
          xp: number
          level: number
          streak_count: number
          last_activity_date: string | null
          streak_freeze_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          role?: 'student' | 'admin'
          payment_status?: 'paid' | 'unpaid' | 'trial'
          trial_end_date?: string | null
          login_enabled?: boolean
          xp?: number
          level?: number
          streak_count?: number
          last_activity_date?: string | null
          streak_freeze_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          role?: 'student' | 'admin'
          payment_status?: 'paid' | 'unpaid' | 'trial'
          trial_end_date?: string | null
          login_enabled?: boolean
          xp?: number
          level?: number
          streak_count?: number
          last_activity_date?: string | null
          streak_freeze_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      courses: {
        Row: {
          id: string
          title: string
          description: string | null
          language: string
          level: string
          thumbnail_url: string | null
          is_published: boolean
          order_index: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          language: string
          level: string
          thumbnail_url?: string | null
          is_published?: boolean
          order_index?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          language?: string
          level?: string
          thumbnail_url?: string | null
          is_published?: boolean
          order_index?: number
          created_at?: string
          updated_at?: string
        }
      }
      units: {
        Row: {
          id: string
          course_id: string
          title: string
          description: string | null
          order_index: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          course_id: string
          title: string
          description?: string | null
          order_index?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          course_id?: string
          title?: string
          description?: string | null
          order_index?: number
          created_at?: string
          updated_at?: string
        }
      }
      lessons: {
        Row: {
          id: string
          unit_id: string
          title: string
          description: string | null
          type: 'video' | 'pdf' | 'live_class' | 'quiz'
          content_url: string | null
          meet_link: string | null
          scheduled_at: string | null
          duration_minutes: number | null
          xp_reward: number
          order_index: number
          is_published: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          unit_id: string
          title: string
          description?: string | null
          type: 'video' | 'pdf' | 'live_class' | 'quiz'
          content_url?: string | null
          meet_link?: string | null
          scheduled_at?: string | null
          duration_minutes?: number | null
          xp_reward?: number
          order_index?: number
          is_published?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          unit_id?: string
          title?: string
          description?: string | null
          type?: 'video' | 'pdf' | 'live_class' | 'quiz'
          content_url?: string | null
          meet_link?: string | null
          scheduled_at?: string | null
          duration_minutes?: number | null
          xp_reward?: number
          order_index?: number
          is_published?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      questions: {
        Row: {
          id: string
          lesson_id: string
          type: 'multiple_choice' | 'fill_blank' | 'translation' | 'listen_type' | 'speak_record' | 'match_pairs' | 'word_order' | 'image_select'
          question_text: string
          question_audio_url: string | null
          question_image_url: string | null
          options: Json | null
          correct_answer: Json
          explanation: string | null
          xp_reward: number
          order_index: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          lesson_id: string
          type: 'multiple_choice' | 'fill_blank' | 'translation' | 'listen_type' | 'speak_record' | 'match_pairs' | 'word_order' | 'image_select'
          question_text: string
          question_audio_url?: string | null
          question_image_url?: string | null
          options?: Json | null
          correct_answer: Json
          explanation?: string | null
          xp_reward?: number
          order_index?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          lesson_id?: string
          type?: 'multiple_choice' | 'fill_blank' | 'translation' | 'listen_type' | 'speak_record' | 'match_pairs' | 'word_order' | 'image_select'
          question_text?: string
          question_audio_url?: string | null
          question_image_url?: string | null
          options?: Json | null
          correct_answer?: Json
          explanation?: string | null
          xp_reward?: number
          order_index?: number
          created_at?: string
          updated_at?: string
        }
      }
      progress: {
        Row: {
          id: string
          user_id: string
          lesson_id: string
          status: 'not_started' | 'in_progress' | 'completed'
          score: number | null
          completed_at: string | null
          attempts: number
          last_attempt_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          lesson_id: string
          status?: 'not_started' | 'in_progress' | 'completed'
          score?: number | null
          completed_at?: string | null
          attempts?: number
          last_attempt_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          lesson_id?: string
          status?: 'not_started' | 'in_progress' | 'completed'
          score?: number | null
          completed_at?: string | null
          attempts?: number
          last_attempt_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      question_attempts: {
        Row: {
          id: string
          user_id: string
          question_id: string
          user_answer: Json
          is_correct: boolean
          pronunciation_score: number | null
          time_taken_seconds: number | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          question_id: string
          user_answer: Json
          is_correct: boolean
          pronunciation_score?: number | null
          time_taken_seconds?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          question_id?: string
          user_answer?: Json
          is_correct?: boolean
          pronunciation_score?: number | null
          time_taken_seconds?: number | null
          created_at?: string
        }
      }
      achievements: {
        Row: {
          id: string
          title: string
          description: string
          icon: string
          type: 'badge' | 'crown'
          tier: number | null
          requirement_type: 'xp' | 'streak' | 'lessons_completed' | 'perfect_score' | 'speed'
          requirement_value: number
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          icon: string
          type: 'badge' | 'crown'
          tier?: number | null
          requirement_type: 'xp' | 'streak' | 'lessons_completed' | 'perfect_score' | 'speed'
          requirement_value: number
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          icon?: string
          type?: 'badge' | 'crown'
          tier?: number | null
          requirement_type?: 'xp' | 'streak' | 'lessons_completed' | 'perfect_score' | 'speed'
          requirement_value?: number
          created_at?: string
        }
      }
      user_achievements: {
        Row: {
          id: string
          user_id: string
          achievement_id: string
          earned_at: string
        }
        Insert: {
          id?: string
          user_id: string
          achievement_id: string
          earned_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          achievement_id?: string
          earned_at?: string
        }
      }
      friendships: {
        Row: {
          id: string
          user_id: string
          friend_id: string
          status: 'pending' | 'accepted' | 'rejected'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          friend_id: string
          status?: 'pending' | 'accepted' | 'rejected'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          friend_id?: string
          status?: 'pending' | 'accepted' | 'rejected'
          created_at?: string
          updated_at?: string
        }
      }
      activity_feed: {
        Row: {
          id: string
          user_id: string
          activity_type: 'lesson_completed' | 'achievement_earned' | 'streak_milestone' | 'level_up'
          activity_data: Json
          is_public: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          activity_type: 'lesson_completed' | 'achievement_earned' | 'streak_milestone' | 'level_up'
          activity_data: Json
          is_public?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          activity_type?: 'lesson_completed' | 'achievement_earned' | 'streak_milestone' | 'level_up'
          activity_data?: Json
          is_public?: boolean
          created_at?: string
        }
      }
      attendance: {
        Row: {
          id: string
          user_id: string
          lesson_id: string
          joined_at: string
          duration_minutes: number | null
        }
        Insert: {
          id?: string
          user_id: string
          lesson_id: string
          joined_at?: string
          duration_minutes?: number | null
        }
        Update: {
          id?: string
          user_id?: string
          lesson_id?: string
          joined_at?: string
          duration_minutes?: number | null
        }
      }
      analytics_events: {
        Row: {
          id: string
          user_id: string | null
          event_type: string
          event_data: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          event_type: string
          event_data: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          event_type?: string
          event_data?: Json
          created_at?: string
        }
      }
      course_access: {
        Row: {
          id: string
          user_id: string
          course_id: string
          granted_by: string | null
          granted_at: string | null
          expires_at: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          course_id: string
          granted_by?: string | null
          granted_at?: string | null
          expires_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          course_id?: string
          granted_by?: string | null
          granted_at?: string | null
          expires_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
    }
    Views: {
      leaderboard: {
        Row: {
          user_id: string
          full_name: string | null
          avatar_url: string | null
          xp: number
          level: number
          rank: number
        }
      }
      course_access_overview: {
        Row: {
          id: string | null
          user_id: string | null
          user_email: string | null
          user_name: string | null
          course_id: string | null
          course_title: string | null
          granted_by: string | null
          granted_by_email: string | null
          granted_by_name: string | null
          granted_at: string | null
          expires_at: string | null
          access_status: string | null
        }
      }
    }
    Functions: {
      grant_course_access: {
        Args: { p_user_id: string; p_course_id: string; p_expires_at?: string }
        Returns: string
      }
      revoke_course_access: {
        Args: { p_user_id: string; p_course_id: string }
        Returns: boolean
      }
      grant_course_access_bulk: {
        Args: { p_user_ids: string[]; p_course_id: string; p_expires_at?: string }
        Returns: number
      }
      has_course_access: {
        Args: { p_user_id: string; p_course_id: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}
