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
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <Link to="/dashboard">
            <Button variant="ghost">← Back to Dashboard</Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Unit Header */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-3xl">{unit.title}</CardTitle>
            <CardDescription className="text-base mt-2">
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
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Lessons</h2>

          {lessons.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No lessons available in this unit yet</p>
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
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      {/* Lesson Number */}
                      <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center font-bold text-lg">
                        {index + 1}
                      </div>

                      {/* Lesson Type Icon */}
                      <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                        <LessonIcon className="w-6 h-6" />
                      </div>

                      {/* Lesson Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold truncate">{lesson.title}</h3>
                          <Badge variant="outline" className="flex-shrink-0">
                            {lesson.type === 'video' && 'Video'}
                            {lesson.type === 'pdf' && 'PDF'}
                            {lesson.type === 'live_class' && 'Live Class'}
                            {lesson.type === 'quiz' && 'Quiz'}
                          </Badge>
                        </div>
                        {lesson.description && (
                          <p className="text-sm text-muted-foreground truncate">
                            {lesson.description}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-2">
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
                        <StatusIcon className={`w-8 h-8 ${statusColor}`} />
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
