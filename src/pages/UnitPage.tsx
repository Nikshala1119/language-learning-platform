import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import type { Database } from '@/lib/database.types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Video, FileText, Users, ClipboardList, Lock, CheckCircle, PlayCircle } from 'lucide-react'

type Unit = Database['public']['Tables']['units']['Row']
type Lesson = Database['public']['Tables']['lessons']['Row']
type Progress = Database['public']['Tables']['progress']['Row']

interface LessonWithProgress extends Lesson {
  progress?: Progress
}

export function UnitPage() {
  const { unitId } = useParams<{ unitId: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [unit, setUnit] = useState<Unit | null>(null)
  const [lessons, setLessons] = useState<LessonWithProgress[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (unitId && user) {
      fetchUnitAndLessons()
    }
  }, [unitId, user])

  const fetchUnitAndLessons = async () => {
    if (!unitId || !user) return

    try {
      setLoading(true)

      // Fetch unit details
      const { data: unitData, error: unitError } = await supabase
        .from('units')
        .select('*')
        .eq('id', unitId)
        .single()

      if (unitError) throw unitError
      setUnit(unitData)

      // Fetch lessons in this unit
      const { data: lessonsData, error: lessonsError } = await supabase
        .from('lessons')
        .select('*')
        .eq('unit_id', unitId)
        .eq('is_published', true)
        .order('order_index')

      if (lessonsError) throw lessonsError

      // Fetch progress for all lessons
      const lessonIds = lessonsData?.map(l => l.id) || []
      const { data: progressData } = await supabase
        .from('progress')
        .select('*')
        .eq('user_id', user.id)
        .in('lesson_id', lessonIds)

      // Combine lessons with progress
      const lessonsWithProgress = lessonsData?.map(lesson => ({
        ...lesson,
        progress: progressData?.find(p => p.lesson_id === lesson.id),
      })) || []

      setLessons(lessonsWithProgress)
    } catch (error) {
      console.error('Error fetching unit:', error)
      alert('Failed to load unit')
    } finally {
      setLoading(false)
    }
  }

  const getLessonIcon = (type: string) => {
    switch (type) {
      case 'video':
        return Video
      case 'pdf':
        return FileText
      case 'live_class':
        return Users
      case 'quiz':
        return ClipboardList
      default:
        return FileText
    }
  }

  const getStatusIcon = (lesson: LessonWithProgress) => {
    if (lesson.progress?.status === 'completed') {
      return CheckCircle
    }
    if (lesson.progress?.status === 'in_progress') {
      return PlayCircle
    }
    return Lock
  }

  const getStatusColor = (lesson: LessonWithProgress) => {
    if (lesson.progress?.status === 'completed') {
      return 'text-green-600'
    }
    if (lesson.progress?.status === 'in_progress') {
      return 'text-blue-600'
    }
    return 'text-gray-400'
  }

  const handleLessonClick = (lesson: LessonWithProgress) => {
    navigate(`/lesson/${lesson.id}`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading unit...</div>
      </div>
    )
  }

  if (!unit) {
    return (
      <div className="min-h-screen bg-background p-8">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Unit not found</p>
            <Button onClick={() => navigate('/dashboard')} className="mt-4">
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const completedCount = lessons.filter(l => l.progress?.status === 'completed').length
  const progressPercent = lessons.length > 0 ? (completedCount / lessons.length) * 100 : 0

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 bg-background z-50">
        <div className="container mx-auto px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <Link to="/dashboard">
              <Button variant="ghost" size="sm">← Back</Button>
            </Link>
            <h1 className="text-base sm:text-lg font-semibold">Unit</h1>
            <div className="w-16"></div> {/* Spacer */}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-4 sm:py-6 lg:py-8 max-w-4xl">
        {/* Unit Header */}
        <Card className="mb-4 sm:mb-6">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-xl sm:text-2xl lg:text-3xl">{unit.title}</CardTitle>
            <CardDescription className="text-sm sm:text-base mt-1 sm:mt-2">
              {unit.description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Progress</span>
                <span className="text-muted-foreground">
                  {completedCount} of {lessons.length} lessons completed
                </span>
              </div>
              <Progress value={progressPercent} className="h-3" />
              <p className="text-xs text-muted-foreground text-right">
                {Math.round(progressPercent)}% complete
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Lessons List */}
        <div className="space-y-3 sm:space-y-4">
          <h2 className="text-lg sm:text-xl lg:text-2xl font-bold">Lessons</h2>

          {lessons.length === 0 ? (
            <Card>
              <CardContent className="py-8 sm:py-12 text-center">
                <p className="text-sm text-muted-foreground">No lessons available in this unit yet</p>
              </CardContent>
            </Card>
          ) : (
            lessons.map((lesson, index) => {
              const LessonIcon = getLessonIcon(lesson.type)
              const StatusIcon = getStatusIcon(lesson)
              const statusColor = getStatusColor(lesson)

              return (
                <Card
                  key={lesson.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleLessonClick(lesson)}
                >
                  <CardContent className="p-3 sm:p-4 lg:p-6">
                    <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
                      {/* Lesson Number */}
                      <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 flex items-center justify-center font-bold text-sm sm:text-base lg:text-lg">
                        {index + 1}
                      </div>

                      {/* Lesson Type Icon - hidden on mobile */}
                      <div className="hidden sm:flex flex-shrink-0 w-12 h-12 rounded-lg bg-muted items-center justify-center">
                        <LessonIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                      </div>

                      {/* Lesson Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start sm:items-center gap-2 mb-1 flex-wrap">
                          <h3 className="text-sm sm:text-base font-semibold truncate flex-shrink min-w-0">{lesson.title}</h3>
                          <Badge variant="outline" className="text-xs flex-shrink-0">
                            {lesson.type === 'video' && 'Video'}
                            {lesson.type === 'pdf' && 'PDF'}
                            {lesson.type === 'live_class' && 'Live'}
                            {lesson.type === 'quiz' && 'Quiz'}
                          </Badge>
                        </div>
                        {lesson.description && (
                          <p className="hidden sm:block text-sm text-muted-foreground truncate">
                            {lesson.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 sm:gap-3 mt-1 sm:mt-2 flex-wrap">
                          <Badge variant="secondary" className="text-xs">
                            +{lesson.xp_reward} XP
                          </Badge>
                          {lesson.duration_minutes && (
                            <span className="text-xs text-muted-foreground">
                              {lesson.duration_minutes} min
                            </span>
                          )}
                          {lesson.progress?.score != null && (
                            <span className="text-xs text-muted-foreground">
                              Score: {lesson.progress.score}%
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Status Icon */}
                      <div className="flex-shrink-0">
                        <StatusIcon className={`w-6 h-6 sm:w-8 sm:h-8 ${statusColor}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      </main>
    </div>
  )
}
