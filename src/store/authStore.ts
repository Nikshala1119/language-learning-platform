import { create } from 'zustand'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/database.types'

type Profile = Database['public']['Tables']['profiles']['Row']

interface AuthState {
  user: User | null
  session: Session | null
  profile: Profile | null
  loading: boolean
  initialized: boolean
  setUser: (user: User | null) => void
  setSession: (session: Session | null) => void
  setProfile: (profile: Profile | null) => void
  setLoading: (loading: boolean) => void
  initialize: () => Promise<void>
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<Profile>) => Promise<void>
  fetchProfile: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  profile: null,
  loading: true,
  initialized: false,

  setUser: (user) => set({ user }),
  setSession: (session) => set({ session }),
  setProfile: (profile) => set({ profile }),
  setLoading: (loading) => set({ loading }),

  initialize: async () => {
    try {
      set({ loading: true })

      const { data: { session } } = await supabase.auth.getSession()

      if (session) {
        set({ session, user: session.user })
        await get().fetchProfile()
      }

      supabase.auth.onAuthStateChange(async (_event, session) => {
        set({ session, user: session?.user ?? null })
        if (session?.user) {
          await get().fetchProfile()
        } else {
          set({ profile: null })
        }
      })

      set({ initialized: true })
    } catch (error) {
      console.error('Error initializing auth:', error)
    } finally {
      set({ loading: false })
    }
  },

  signIn: async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) return { error }

      if (data.user) {
        // Check if login is enabled for this user
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('login_enabled, role')
          .eq('id', data.user.id)
          .single()

        if (profileError) {
          await supabase.auth.signOut()
          return { error: new Error('Failed to verify account status') }
        }

        // Admins always have access, students need login_enabled to be true
        if (profile.role === 'student' && !profile.login_enabled) {
          await supabase.auth.signOut()
          return { error: new Error('Account not activated. Please contact an administrator.') }
        }
      }

      if (data.session) {
        set({ session: data.session, user: data.user })
        await get().fetchProfile()
      }

      return { error: null }
    } catch (error) {
      return { error: error as Error }
    }
  },

  signUp: async (email, password, fullName) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      })

      if (error) return { error }

      if (data.user) {
        await supabase
          .from('profiles')
          .update({
            full_name: fullName,
            login_enabled: false // New students require admin approval to login
          })
          .eq('id', data.user.id)
      }

      return { error: null }
    } catch (error) {
      return { error: error as Error }
    }
  },

  signOut: async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Sign out error:', error)
        throw error
      }
      set({ user: null, session: null, profile: null })
      // Redirect to login page
      window.location.href = '/login'
    } catch (error) {
      console.error('Failed to sign out:', error)
      // Force clear state and redirect anyway
      set({ user: null, session: null, profile: null })
      window.location.href = '/login'
    }
  },

  fetchProfile: async () => {
    const { user } = get()
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) throw error
      set({ profile: data })
    } catch (error) {
      console.error('Error fetching profile:', error)
    }
  },

  updateProfile: async (updates) => {
    const { user, profile } = get()
    if (!user || !profile) return

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single()

      if (error) throw error
      set({ profile: data })
    } catch (error) {
      console.error('Error updating profile:', error)
    }
  },
}))
