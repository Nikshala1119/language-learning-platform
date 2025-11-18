import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/database.types'

type Course = Database['public']['Tables']['courses']['Row']
type Unit = Database['public']['Tables']['units']['Row']
type Lesson = Database['public']['Tables']['lessons']['Row']
type Progress = Database['public']['Tables']['progress']['Row']

interface CourseState {
  courses: Course[]
  currentCourse: Course | null
  units: Unit[]
  lessons: Lesson[]
  progress: Record<string, Progress>
  loading: boolean
  fetchCourses: () => Promise<void>
  fetchCourse: (courseId: string) => Promise<void>
  fetchUnits: (courseId: string) => Promise<void>
  fetchLessons: (unitId: string) => Promise<void>
  fetchProgress: (userId: string) => Promise<void>
  updateProgress: (userId: string, lessonId: string, updates: Partial<Progress>) => Promise<void>
}

export const useCourseStore = create<CourseState>((set, get) => ({
  courses: [],
  currentCourse: null,
  units: [],
  lessons: [],
  progress: {},
  loading: false,

  fetchCourses: async () => {
    try {
      set({ loading: true })
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('is_published', true)
        .order('order_index')

      if (error) throw error
      set({ courses: data || [] })
    } catch (error) {
      console.error('Error fetching courses:', error)
    } finally {
      set({ loading: false })
    }
  },

  fetchCourse: async (courseId) => {
    try {
      set({ loading: true })
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single()

      if (error) throw error
      set({ currentCourse: data })
    } catch (error) {
      console.error('Error fetching course:', error)
    } finally {
      set({ loading: false })
    }
  },

  fetchUnits: async (courseId) => {
    try {
      set({ loading: true })
      const { data, error } = await supabase
        .from('units')
        .select('*')
        .eq('course_id', courseId)
        .order('order_index')

      if (error) throw error
      set({ units: data || [] })
    } catch (error) {
      console.error('Error fetching units:', error)
    } finally {
      set({ loading: false })
    }
  },

  fetchLessons: async (unitId) => {
    try {
      set({ loading: true })
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('unit_id', unitId)
        .eq('is_published', true)
        .order('order_index')

      if (error) throw error
      set({ lessons: data || [] })
    } catch (error) {
      console.error('Error fetching lessons:', error)
    } finally {
      set({ loading: false })
    }
  },

  fetchProgress: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('progress')
        .select('*')
        .eq('user_id', userId)

      if (error) throw error

      const progressMap = (data || []).reduce((acc, prog) => {
        acc[prog.lesson_id] = prog
        return acc
      }, {} as Record<string, Progress>)

      set({ progress: progressMap })
    } catch (error) {
      console.error('Error fetching progress:', error)
    }
  },

  updateProgress: async (userId, lessonId, updates) => {
    try {
      const { data, error } = await supabase
        .from('progress')
        .upsert({
          user_id: userId,
          lesson_id: lessonId,
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) throw error

      set((state) => ({
        progress: {
          ...state.progress,
          [lessonId]: data,
        },
      }))
    } catch (error) {
      console.error('Error updating progress:', error)
    }
  },
}))
