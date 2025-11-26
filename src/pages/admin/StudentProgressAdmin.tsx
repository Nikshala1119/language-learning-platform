import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/database.types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Clock,
  Target,
  Trophy,
  TrendingUp,
  Calendar,
  Flame,
} from 'lucide-react'

type Profile = Database['public']['Tables']['profiles']['Row']
type Course = Database['public']['Tables']['courses']['Row']
type Unit = Database['public']['Tables']['units']['Row']
type Lesson = Database['public']['Tables']['lessons']['Row']
type ProgressRecord = Database['public']['Tables']['progress']['Row']

interface LessonWithProgress extends Lesson {
  progress?: ProgressRecord
}

interface UnitWithLessons extends Unit {
  lessons: LessonWithProgress[]
}

interface CourseWithUnits extends Course {
  units: UnitWithLessons[]
}

interface StudentProgressStats {
  totalLessons: number
  completedLessons: number
  inProgressLessons: number
  avgScore: number
  totalXpEarned: number
  lastActivityDate: string | null
}

export function StudentProgressAdmin() {
  const { studentId } = useParams<{ studentId: string }>()
  const [student, setStudent] = useState<Profile | null>(null)
  const [courses, setCourses] = useState<CourseWithUnits[]>([])
  const [stats, setStats] = useState<StudentProgressStats>({
    totalLessons: 0,
    completedLessons: 0,
    inProgressLessons: 0,
    avgScore: 0,
    totalXpEarned: 0,
    lastActivityDate: null,
  })
  const [loading, setLoading] = useState(true)
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null)

  useEffect(() => {
    if (studentId) {
      fetchStudentProgress()
    }
  }, [studentId])

  const fetchStudentProgress = async () => {
    if (!studentId) return

    try {
      setLoading(true)

      // Fetch student profile
      const { data: studentData, error: studentError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', studentId)
        .single()

      if (studentError) throw studentError
      setStudent(studentData)

      // Fetch all data separately for reliability
      const [coursesRes, unitsRes, lessonsRes, progressRes] = await Promise.all([
        supabase.from('courses').select('*').order('order_index'),
        supabase.from('units').select('*').order('order_index'),
        supabase.from('lessons').select('*').order('order_index'),
        supabase.from('progress').select('*').eq('user_id', studentId),
      ])

      if (coursesRes.error) throw coursesRes.error
      if (unitsRes.error) throw unitsRes.error
      if (lessonsRes.error) throw lessonsRes.error
      if (progressRes.error) throw progressRes.error

      const coursesData = coursesRes.data || []
      const unitsData = unitsRes.data || []
      const lessonsData = lessonsRes.data || []
      const progressData = progressRes.data || []

      // Create maps for efficient lookups
      const progressMap = new Map(progressData.map(p => [p.lesson_id, p]))

      // Group lessons by unit_id
      const lessonsByUnit = new Map<string, LessonWithProgress[]>()
      lessonsData.forEach(lesson => {
        const lessonsForUnit = lessonsByUnit.get(lesson.unit_id) || []
        lessonsForUnit.push({
          ...lesson,
          progress: progressMap.get(lesson.id),
        })
        lessonsByUnit.set(lesson.unit_id, lessonsForUnit)
      })

      // Group units by course_id
      const unitsByCourse = new Map<string, UnitWithLessons[]>()
      unitsData.forEach(unit => {
        const unitsForCourse = unitsByCourse.get(unit.course_id) || []
        const unitLessons = lessonsByUnit.get(unit.id) || []
        unitsForCourse.push({
          ...unit,
          lessons: unitLessons.sort((a, b) => a.order_index - b.order_index),
        })
        unitsByCourse.set(unit.course_id, unitsForCourse)
      })

      // Build courses with progress data
      const coursesWithProgress: CourseWithUnits[] = coursesData.map(course => ({
        ...course,
        units: (unitsByCourse.get(course.id) || []).sort((a, b) => a.order_index - b.order_index),
      }))

      setCourses(coursesWithProgress)

      // Calculate stats
      let totalLessons = 0
      let completedLessons = 0
      let inProgressLessons = 0
      let totalScore = 0
      let scoresCount = 0
      let totalXpEarned = 0
      let lastActivity: string | null = null

      progressData?.forEach(p => {
        if (p.status === 'completed') {
          completedLessons++
          if (p.score !== null) {
            totalScore += p.score
            scoresCount++
          }
        } else if (p.status === 'in_progress') {
          inProgressLessons++
        }

        if (p.completed_at) {
          if (!lastActivity || new Date(p.completed_at) > new Date(lastActivity)) {
            lastActivity = p.completed_at
          }
        }
      })

      coursesWithProgress.forEach(course => {
        course.units.forEach(unit => {
          totalLessons += unit.lessons.length
          unit.lessons.forEach(lesson => {
            if (lesson.progress?.status === 'completed') {
              totalXpEarned += lesson.xp_reward || 0
            }
          })
        })
      })

      setStats({
        totalLessons,
        completedLessons,
        inProgressLessons,
        avgScore: scoresCount > 0 ? totalScore / scoresCount : 0,
        totalXpEarned,
        lastActivityDate: lastActivity,
      })

      // Auto-select first course if available
      if (coursesWithProgress.length > 0 && !selectedCourse) {
        setSelectedCourse(coursesWithProgress[0].id)
      }
    } catch (error) {
      console.error('Error fetching student progress:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-600">Completed</Badge>
      case 'in_progress':
        return <Badge className="bg-yellow-600">In Progress</Badge>
      default:
        return <Badge variant="secondary">Not Started</Badge>
    }
  }

  const getLessonTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      video: 'bg-blue-100 text-blue-800',
      pdf: 'bg-purple-100 text-purple-800',
      quiz: 'bg-orange-100 text-orange-800',
      live_class: 'bg-green-100 text-green-800',
    }
    return (
      <Badge variant="outline" className={colors[type] || ''}>
        {type.replace('_', ' ')}
      </Badge>
    )
  }

  const getCourseProgress = (course: CourseWithUnits) => {
    let total = 0
    let completed = 0
    course.units.forEach(unit => {
      unit.lessons.forEach(lesson => {
        total++
        if (lesson.progress?.status === 'completed') {
          completed++
        }
      })
    })
    return total > 0 ? (completed / total) * 100 : 0
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading student progress...</div>
      </div>
    )
  }

  if (!student) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">Student not found</p>
            <Button asChild>
              <Link to="/admin/students">Back to Students</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const selectedCourseData = courses.find(c => c.id === selectedCourse)

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/admin/students">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Link>
        </Button>
      </div>

      {/* Student Info Card */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Avatar className="w-16 h-16">
              <AvatarImage src={student.avatar_url || undefined} />
              <AvatarFallback className="text-xl">
                {student.full_name?.[0]?.toUpperCase() || student.email[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">{student.full_name || 'Unnamed Student'}</h1>
              <p className="text-muted-foreground">{student.email}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge variant="secondary">Level {student.level}</Badge>
                <Badge variant="secondary">{student.xp} XP</Badge>
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Flame className="w-3 h-3" />
                  {student.streak_count} day streak
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <div className="text-2xl font-bold">{stats.completedLessons}</div>
            <p className="text-sm text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div className="text-2xl font-bold">{stats.inProgressLessons}</div>
            <p className="text-sm text-muted-foreground">In Progress</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-2xl font-bold">{stats.avgScore.toFixed(1)}%</div>
            <p className="text-sm text-muted-foreground">Avg Score</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="w-5 h-5 text-purple-600" />
            </div>
            <div className="text-2xl font-bold">{stats.totalXpEarned}</div>
            <p className="text-sm text-muted-foreground">XP Earned</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold">
              {stats.totalLessons > 0
                ? Math.round((stats.completedLessons / stats.totalLessons) * 100)
                : 0}%
            </div>
            <p className="text-sm text-muted-foreground">Overall Progress</p>
          </CardContent>
        </Card>
      </div>

      {/* Last Activity */}
      {stats.lastActivityDate && (
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>Last activity: {new Date(stats.lastActivityDate).toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Course Selection */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Course Progress</h2>
        <div className="flex flex-wrap gap-2">
          {courses.map(course => {
            const progress = getCourseProgress(course)
            return (
              <Button
                key={course.id}
                variant={selectedCourse === course.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCourse(course.id)}
                className="flex items-center gap-2"
              >
                <BookOpen className="w-4 h-4" />
                {course.title}
                <Badge variant="secondary" className="ml-1">
                  {Math.round(progress)}%
                </Badge>
              </Button>
            )
          })}
        </div>
      </div>

      {/* Course Details */}
      {selectedCourseData && (
        <Card>
          <CardHeader>
            <CardTitle>{selectedCourseData.title}</CardTitle>
            <CardDescription>
              {selectedCourseData.language} - {selectedCourseData.level}
            </CardDescription>
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span>Overall Progress</span>
                <span>{Math.round(getCourseProgress(selectedCourseData))}%</span>
              </div>
              <Progress value={getCourseProgress(selectedCourseData)} className="h-2" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {selectedCourseData.units.map(unit => {
                const unitCompleted = unit.lessons.filter(
                  l => l.progress?.status === 'completed'
                ).length
                const unitTotal = unit.lessons.length

                return (
                  <div key={unit.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold">{unit.title}</h3>
                      <Badge variant="outline">
                        {unitCompleted}/{unitTotal} lessons
                      </Badge>
                    </div>

                    <div className="space-y-3">
                      {unit.lessons.map(lesson => (
                        <div
                          key={lesson.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-muted/50 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                lesson.progress?.status === 'completed'
                                  ? 'bg-green-100 text-green-600'
                                  : lesson.progress?.status === 'in_progress'
                                  ? 'bg-yellow-100 text-yellow-600'
                                  : 'bg-gray-100 text-gray-400'
                              }`}
                            >
                              {lesson.progress?.status === 'completed' ? (
                                <CheckCircle2 className="w-4 h-4" />
                              ) : (
                                <span className="text-sm">{lesson.order_index + 1}</span>
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-sm">{lesson.title}</p>
                              <div className="flex items-center gap-2 mt-1">
                                {getLessonTypeBadge(lesson.type)}
                                <span className="text-xs text-muted-foreground">
                                  {lesson.xp_reward} XP
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 ml-11 sm:ml-0">
                            {getStatusBadge(lesson.progress?.status)}
                            {lesson.progress?.score !== null &&
                              lesson.progress?.score !== undefined && (
                                <Badge variant="outline">
                                  Score: {lesson.progress.score}%
                                </Badge>
                              )}
                            {lesson.progress?.completed_at && (
                              <span className="text-xs text-muted-foreground hidden lg:inline">
                                {new Date(lesson.progress.completed_at).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {courses.length === 0 && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">No courses available</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
