import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/database.types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Users,
  BookOpen,
  GraduationCap,
  TrendingUp,
  Clock,
  Award,
  Target,
  BarChart3,
} from 'lucide-react'

type Profile = Database['public']['Tables']['profiles']['Row']
type Course = Database['public']['Tables']['courses']['Row']
type Lesson = Database['public']['Tables']['lessons']['Row']
type Progress = Database['public']['Tables']['progress']['Row']

interface CourseStats {
  course: Course
  enrollments: number
  completions: number
  avgScore: number
}

interface ActivityStats {
  date: string
  lessons_completed: number
  new_users: number
}

export function AnalyticsDashboard() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeStudents: 0,
    totalCourses: 0,
    totalLessons: 0,
    totalCompletions: 0,
    avgCompletionRate: 0,
    totalXPAwarded: 0,
    avgStudentLevel: 0,
  })
  const [courseStats, setCourseStats] = useState<CourseStats[]>([])
  const [recentActivity, setRecentActivity] = useState<ActivityStats[]>([])
  const [topLearners, setTopLearners] = useState<Profile[]>([])

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)

      // Fetch students
      const { data: students } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'student')

      const totalStudents = students?.length || 0
      const activeStudents = students?.filter(s => {
        const lastActivity = s.last_activity_date ? new Date(s.last_activity_date) : null
        if (!lastActivity) return false
        const daysSince = Math.floor((Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24))
        return daysSince <= 7
      }).length || 0

      const totalXP = students?.reduce((sum, s) => sum + (s.xp || 0), 0) || 0
      const avgLevel = students && students.length > 0
        ? students.reduce((sum, s) => sum + (s.level || 1), 0) / students.length
        : 0

      // Fetch courses
      const { data: courses } = await supabase
        .from('courses')
        .select('*')

      // Fetch lessons
      const { data: lessons } = await supabase
        .from('lessons')
        .select('*')

      // Fetch progress
      const { data: progressData } = await supabase
        .from('progress')
        .select('*')

      const totalCompletions = progressData?.filter(p => p.status === 'completed').length || 0
      const avgCompletionRate = progressData && progressData.length > 0
        ? (totalCompletions / progressData.length) * 100
        : 0

      // Calculate course stats
      const courseStatsData: CourseStats[] = []
      if (courses) {
        for (const course of courses) {
          const { data: courseProgress } = await supabase
            .from('progress')
            .select('*, lessons!inner(unit_id, units!inner(course_id))')
            .eq('lessons.units.course_id', course.id)

          const enrollments = new Set(courseProgress?.map(p => p.user_id)).size
          const completions = courseProgress?.filter(p => p.status === 'completed').length || 0
          const avgScore = courseProgress && courseProgress.length > 0
            ? courseProgress
                .filter(p => p.score != null)
                .reduce((sum, p) => sum + (p.score || 0), 0) / courseProgress.filter(p => p.score != null).length
            : 0

          courseStatsData.push({
            course,
            enrollments,
            completions,
            avgScore,
          })
        }
      }

      // Get top learners
      const topLearnersData = students?.sort((a, b) => (b.xp || 0) - (a.xp || 0)).slice(0, 10) || []

      // Get recent activity (last 7 days)
      const activityData: ActivityStats[] = []
      for (let i = 6; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        date.setHours(0, 0, 0, 0)

        const nextDate = new Date(date)
        nextDate.setDate(nextDate.getDate() + 1)

        const { data: dayProgress } = await supabase
          .from('progress')
          .select('*')
          .gte('completed_at', date.toISOString())
          .lt('completed_at', nextDate.toISOString())
          .eq('status', 'completed')

        const { data: newUsers } = await supabase
          .from('profiles')
          .select('*')
          .gte('created_at', date.toISOString())
          .lt('created_at', nextDate.toISOString())
          .eq('role', 'student')

        activityData.push({
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          lessons_completed: dayProgress?.length || 0,
          new_users: newUsers?.length || 0,
        })
      }

      setStats({
        totalStudents,
        activeStudents,
        totalCourses: courses?.length || 0,
        totalLessons: lessons?.length || 0,
        totalCompletions,
        avgCompletionRate,
        totalXPAwarded: totalXP,
        avgStudentLevel: avgLevel,
      })

      setCourseStats(courseStatsData.sort((a, b) => b.enrollments - a.enrollments))
      setTopLearners(topLearnersData)
      setRecentActivity(activityData)
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading analytics...</div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground mt-1">Monitor your platform's performance</p>
        </div>
        <Button onClick={fetchAnalytics}>
          <BarChart3 className="w-4 h-4 mr-2" />
          Refresh Data
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-8 h-8 text-blue-500" />
              <Badge variant="secondary">{stats.activeStudents} active</Badge>
            </div>
            <div className="text-2xl font-bold mb-1">{stats.totalStudents}</div>
            <p className="text-sm text-muted-foreground">Total Students</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <BookOpen className="w-8 h-8 text-green-500" />
              <Badge variant="secondary">{stats.totalLessons} lessons</Badge>
            </div>
            <div className="text-2xl font-bold mb-1">{stats.totalCourses}</div>
            <p className="text-sm text-muted-foreground">Total Courses</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <Target className="w-8 h-8 text-purple-500" />
              <Badge variant="secondary">{stats.avgCompletionRate.toFixed(1)}%</Badge>
            </div>
            <div className="text-2xl font-bold mb-1">{stats.totalCompletions}</div>
            <p className="text-sm text-muted-foreground">Total Completions</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <Award className="w-8 h-8 text-yellow-500" />
              <Badge variant="secondary">Avg Lvl {stats.avgStudentLevel.toFixed(1)}</Badge>
            </div>
            <div className="text-2xl font-bold mb-1">{stats.totalXPAwarded.toLocaleString()}</div>
            <p className="text-sm text-muted-foreground">Total XP Awarded</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Recent Activity Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity (Last 7 Days)</CardTitle>
            <CardDescription>Lessons completed and new user signups</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((day, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{day.date}</span>
                    <div className="flex gap-4">
                      <span className="text-blue-600">{day.lessons_completed} lessons</span>
                      <span className="text-green-600">{day.new_users} users</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1 bg-blue-100 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all"
                        style={{
                          width: `${Math.min(100, (day.lessons_completed / Math.max(...recentActivity.map(d => d.lessons_completed))) * 100)}%`
                        }}
                      />
                    </div>
                    <div className="flex-1 bg-green-100 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all"
                        style={{
                          width: `${Math.min(100, (day.new_users / Math.max(...recentActivity.map(d => d.new_users), 1)) * 100)}%`
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Learners */}
        <Card>
          <CardHeader>
            <CardTitle>Top Learners</CardTitle>
            <CardDescription>Students with highest XP</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topLearners.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No students yet
                </p>
              ) : (
                topLearners.map((learner, idx) => (
                  <div key={learner.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                        idx === 0 ? 'bg-yellow-500 text-white' :
                        idx === 1 ? 'bg-gray-400 text-white' :
                        idx === 2 ? 'bg-orange-600 text-white' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {idx + 1}
                      </div>
                      <div>
                        <p className="font-medium text-sm">
                          {learner.full_name || learner.email}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Level {learner.level} • {learner.streak_count} day streak
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary">{learner.xp} XP</Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Course Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Course Performance</CardTitle>
          <CardDescription>Enrollment and completion statistics by course</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {courseStats.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No courses yet
              </p>
            ) : (
              courseStats.map((courseStat) => (
                <div key={courseStat.course.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{courseStat.course.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {courseStat.course.language} • {courseStat.course.level}
                      </p>
                    </div>
                    <div className="flex gap-4 text-sm">
                      <div className="text-right">
                        <p className="font-semibold">{courseStat.enrollments}</p>
                        <p className="text-xs text-muted-foreground">Enrolled</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{courseStat.completions}</p>
                        <p className="text-xs text-muted-foreground">Completed</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{courseStat.avgScore.toFixed(1)}%</p>
                        <p className="text-xs text-muted-foreground">Avg Score</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <div className="bg-muted rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{
                            width: `${courseStat.enrollments > 0 ? (courseStat.completions / courseStat.enrollments) * 100 : 0}%`
                          }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {courseStat.enrollments > 0
                          ? `${((courseStat.completions / courseStat.enrollments) * 100).toFixed(1)}% completion rate`
                          : 'No enrollments yet'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
