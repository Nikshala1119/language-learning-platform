import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/database.types'

type Achievement = Database['public']['Tables']['achievements']['Row']
type UserAchievement = Database['public']['Tables']['user_achievements']['Row']

interface LeaderboardEntry {
  user_id: string
  full_name: string | null
  avatar_url: string | null
  xp: number
  level: number
  rank: number
}

interface GamificationState {
  achievements: Achievement[]
  userAchievements: UserAchievement[]
  leaderboard: LeaderboardEntry[]
  loading: boolean
  fetchAchievements: () => Promise<void>
  fetchUserAchievements: (userId: string) => Promise<void>
  fetchLeaderboard: () => Promise<void>
  checkAchievements: (userId: string) => Promise<void>
  awardXP: (userId: string, xp: number) => Promise<void>
  updateStreak: (userId: string) => Promise<void>
}

export const useGamificationStore = create<GamificationState>((set) => ({
  achievements: [],
  userAchievements: [],
  leaderboard: [],
  loading: false,

  fetchAchievements: async () => {
    try {
      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .order('requirement_value')

      if (error) throw error
      set({ achievements: data || [] })
    } catch (error) {
      console.error('Error fetching achievements:', error)
    }
  },

  fetchUserAchievements: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', userId)

      if (error) throw error
      set({ userAchievements: data || [] })
    } catch (error) {
      console.error('Error fetching user achievements:', error)
    }
  },

  fetchLeaderboard: async () => {
    try {
      set({ loading: true })
      const { data, error } = await supabase
        .from('leaderboard')
        .select('*')
        .limit(100)

      if (error) throw error
      set({ leaderboard: data || [] })
    } catch (error) {
      console.error('Error fetching leaderboard:', error)
    } finally {
      set({ loading: false })
    }
  },

  checkAchievements: async (userId) => {
    try {
      await supabase.functions.invoke('check-achievements', {
        body: { userId },
      })
    } catch (error) {
      console.error('Error checking achievements:', error)
    }
  },

  awardXP: async (userId, xp) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('xp')
        .eq('id', userId)
        .single()

      if (error || !profile) return

      await supabase
        .from('profiles')
        .update({ xp: (profile.xp || 0) + xp })
        .eq('id', userId)
    } catch (error) {
      console.error('Error awarding XP:', error)
    }
  },

  updateStreak: async (userId) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error || !profile) return

      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const lastActivity = profile.last_activity_date
        ? new Date(profile.last_activity_date)
        : null

      if (lastActivity) {
        lastActivity.setHours(0, 0, 0, 0)
      }

      const daysDiff = lastActivity
        ? Math.floor((today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24))
        : 0

      let newStreakCount = profile.streak_count || 0

      if (!lastActivity || daysDiff === 1) {
        newStreakCount = (profile.streak_count || 0) + 1
      } else if (daysDiff === 0) {
        return
      } else {
        newStreakCount = 1
      }

      await supabase
        .from('profiles')
        .update({
          streak_count: newStreakCount,
          last_activity_date: today.toISOString().split('T')[0],
        })
        .eq('id', userId)

      if ([7, 30, 100, 365].includes(newStreakCount)) {
        await supabase
          .from('activity_feed')
          .insert({
            user_id: userId,
            activity_type: 'streak_milestone',
            activity_data: { streak_count: newStreakCount },
          })
      }
    } catch (error) {
      console.error('Error updating streak:', error)
    }
  },
}))
