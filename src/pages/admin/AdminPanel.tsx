import { Link, Routes, Route } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CoursesAdmin } from './CoursesAdmin'
import { UnitsAdmin } from './UnitsAdmin'
import { LessonsAdmin } from './LessonsAdmin'
import { QuestionsAdmin } from './QuestionsAdmin'
import { StudentsAdmin } from './StudentsAdmin'
import { MediaLibrary } from './MediaLibrary'
import { AnalyticsDashboard } from './AnalyticsDashboard'

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
          <Route path="analytics" element={<AnalyticsDashboard />} />
          <Route path="media" element={<MediaLibrary />} />
        </Routes>
      </main>
    </div>
  )
}

function AdminOverview() {
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
            <div className="text-2xl font-bold mb-1">0</div>
            <p className="text-sm text-muted-foreground">Total Courses</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold mb-1">0</div>
            <p className="text-sm text-muted-foreground">Active Students</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold mb-1">0</div>
            <p className="text-sm text-muted-foreground">Lessons</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold mb-1">0</div>
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
              <Link to="/admin/analytics">View Analytics</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function AdminCoursesPlaceholder() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Manage Courses</h1>
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">
            Course management interface coming soon
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            See IMPLEMENTATION_GUIDE.md for details
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

function AdminLessonsPlaceholder() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Manage Lessons</h1>
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">
            Lesson management interface coming soon
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

function AdminStudentsPlaceholder() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Manage Students</h1>
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">
            Student management interface coming soon
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

