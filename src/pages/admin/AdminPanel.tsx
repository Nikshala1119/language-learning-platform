import { useState, useEffect } from 'react'
import { Link, Routes, Route } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { CoursesAdmin } from './CoursesAdmin'
import { UnitsAdmin } from './UnitsAdmin'
import { LessonsAdmin } from './LessonsAdmin'
import { QuestionsAdmin } from './QuestionsAdmin'
import { StudentsAdmin } from './StudentsAdmin'
import { MediaLibrary } from './MediaLibrary'
import { AnalyticsDashboard } from './AnalyticsDashboard'
import { CourseAccessAdmin } from './CourseAccessAdmin'

export function AdminPanel() {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-muted/40">
        <div className="p-4 border-b">
          <h2 className="font-bold text-lg">Admin Panel</h2>
        </div>
        <nav className="space-y-1 p-2">
          <Link
            to="/dashboard"
            className="block px-3 py-2 rounded hover:bg-accent transition-colors"
          >
            ← Back to Dashboard
          </Link>
          <Link
            to="/admin"
            className="block px-3 py-2 rounded hover:bg-accent transition-colors"
          >
            Overview
          </Link>
          <Link
            to="/admin/courses"
            className="block px-3 py-2 rounded hover:bg-accent transition-colors"
          >
            Courses
          </Link>
          <Link
            to="/admin/units"
            className="block px-3 py-2 rounded hover:bg-accent transition-colors"
          >
            Units
          </Link>
          <Link
            to="/admin/lessons"
            className="block px-3 py-2 rounded hover:bg-accent transition-colors"
          >
            Lessons
          </Link>
          <Link
            to="/admin/questions"
            className="block px-3 py-2 rounded hover:bg-accent transition-colors"
          >
            Questions
          </Link>
          <Link
            to="/admin/students"
            className="block px-3 py-2 rounded hover:bg-accent transition-colors"
          >
            Students
          </Link>
          <Link
            to="/admin/course-access"
            className="block px-3 py-2 rounded hover:bg-accent transition-colors"
          >
            Course Access
          </Link>
          <Link
            to="/admin/analytics"
            className="block px-3 py-2 rounded hover:bg-accent transition-colors"
          >
            Analytics
          </Link>
          <Link
            to="/admin/media"
            className="block px-3 py-2 rounded hover:bg-accent transition-colors"
          >
            Media Library
          </Link>
        </nav>
      </aside>

      {/* Content */}
      <main className="flex-1 p-8">
        <Routes>
          <Route index element={<AdminOverview />} />
          <Route path="courses" element={<CoursesAdmin />} />
          <Route path="units" element={<UnitsAdmin />} />
          <Route path="lessons" element={<LessonsAdmin />} />
          <Route path="questions" element={<QuestionsAdmin />} />
          <Route path="students" element={<StudentsAdmin />} />
          <Route path="course-access" element={<CourseAccessAdmin />} />
          <Route path="analytics" element={<AnalyticsDashboard />} />
          <Route path="media" element={<MediaLibrary />} />
        </Routes>
      </main>
    </div>
  )
}

function AdminOverview() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalCourses: 0,
    activeStudents: 0,
    totalLessons: 0,
    totalCompletions: 0,
  })

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      setLoading(true)

      // Fetch all stats in parallel
      const [coursesRes, studentsRes, lessonsRes, progressRes] = await Promise.all([
        supabase.from('courses').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student').eq('login_enabled', true),
        supabase.from('lessons').select('id', { count: 'exact', head: true }),
        supabase.from('progress').select('id', { count: 'exact', head: true }).eq('status', 'completed'),
      ])

      setStats({
        totalCourses: coursesRes.count || 0,
        activeStudents: studentsRes.count || 0,
        totalLessons: lessonsRes.count || 0,
        totalCompletions: progressRes.count || 0,
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-xl">Loading dashboard...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Manage your language learning platform
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold mb-1">{stats.totalCourses}</div>
            <p className="text-sm text-muted-foreground">Total Courses</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold mb-1">{stats.activeStudents}</div>
            <p className="text-sm text-muted-foreground">Active Students</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold mb-1">{stats.totalLessons}</div>
            <p className="text-sm text-muted-foreground">Lessons</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold mb-1">{stats.totalCompletions}</div>
            <p className="text-sm text-muted-foreground">Completions</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link to="/admin/courses">Create Course</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/admin/students">Manage Students</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/admin/course-access">Manage Course Access</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/admin/analytics">View Analytics</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


