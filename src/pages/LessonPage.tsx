import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { useGamificationStore } from '@/store/gamificationStore'
import type { Database } from '@/lib/database.types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Video, FileText, Users, ClipboardList, CheckCircle, Clock } from 'lucide-react'

type Lesson = Database['public']['Tables']['lessons']['Row']
type Progress = Database['public']['Tables']['progress']['Row']

export function LessonPage() {
  const { lessonId } = useParams<{ lessonId: string }>()
  const navigate = useNavigate()
  const { user, profile } = useAuthStore()
  const { awardXP, updateStreak } = useGamificationStore()
  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [progress, setProgress] = useState<Progress | null>(null)
  const [loading, setLoading] = useState(true)
  const [completing, setCompleting] = useState(false)

  useEffect(() => {
    if (lessonId && user) {
      fetchLesson()
      fetchProgress()
    }
  }, [lessonId, user])

  const fetchLesson = async () => {
    if (!lessonId) return

    try {
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('id', lessonId)
        .single()

      if (error) throw error
      setLesson(data)
    } catch (error) {
      console.error('Error fetching lesson:', error)
      alert('Failed to load lesson')
    } finally {
      setLoading(false)
    }
  }

  const fetchProgress = async () => {
    if (!lessonId || !user) return

    try {
      const { data, error } = await supabase
        .from('progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('lesson_id', lessonId)
        .maybeSingle()

      if (error) throw error
      setProgress(data)

      // If no progress exists, create it using upsert
      if (!data) {
        const { data: newProgress, error: upsertError } = await supabase
          .from('progress')
          .upsert({
            user_id: user.id,
            lesson_id: lessonId,
            status: 'in_progress',
          }, {
            onConflict: 'user_id,lesson_id',
            ignoreDuplicates: false
          })
          .select()
          .single()

        if (!upsertError) {
          setProgress(newProgress)
        }
      }
    } catch (error) {
      console.error('Error fetching progress:', error)
    }
  }

  const handleCompleteLesson = async () => {
    if (!lessonId || !user || !lesson || completing) return

    setCompleting(true)
    try {
      // Update progress to completed using upsert
      const { error: progressError } = await supabase
        .from('progress')
        .upsert({
          user_id: user.id,
          lesson_id: lessonId,
          status: 'completed',
          score: 100,
          completed_at: new Date().toISOString(),
          last_attempt_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,lesson_id',
          ignoreDuplicates: false
        })

      if (progressError) throw progressError

      // Award XP
      await awardXP(user.id, lesson.xp_reward)

      // Update streak
      await updateStreak(user.id)

      // Create activity feed entry
      await supabase
        .from('activity_feed')
        .insert({
          user_id: user.id,
          activity_type: 'lesson_completed',
          activity_data: {
            lesson_id: lessonId,
            lesson_title: lesson.title,
            xp_earned: lesson.xp_reward,
          },
        })

      alert(`Lesson completed! +${lesson.xp_reward} XP`)
      navigate('/dashboard')
    } catch (error) {
      console.error('Error completing lesson:', error)
      alert('Failed to complete lesson')
    } finally {
      setCompleting(false)
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading lesson...</div>
      </div>
    )
  }

  if (!lesson) {
    return (
      <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
        <Card>
          <CardContent className="py-8 sm:py-12 text-center">
            <p className="text-sm text-muted-foreground">Lesson not found</p>
            <Button onClick={() => navigate('/dashboard')} className="mt-4 text-sm">
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const Icon = getLessonIcon(lesson.type)

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 bg-background z-50">
        <div className="container mx-auto px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <Link to="/dashboard">
              <Button variant="ghost" size="sm">← Back</Button>
            </Link>
            {progress?.status === 'completed' && (
              <Badge variant="default" className="flex items-center gap-1 text-xs">
                <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Completed</span>
              </Badge>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-4 sm:py-6 lg:py-8 max-w-4xl">
        {/* Lesson Header */}
        <Card className="mb-4 sm:mb-6">
          <CardHeader className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                  <CardTitle className="text-lg sm:text-xl lg:text-2xl">{lesson.title}</CardTitle>
                  <Badge variant="outline" className="text-xs w-fit">
                    {lesson.type === 'video' && 'Video Lesson'}
                    {lesson.type === 'pdf' && 'PDF Document'}
                    {lesson.type === 'live_class' && 'Live Class'}
                    {lesson.type === 'quiz' && 'Quiz'}
                  </Badge>
                </div>
                <CardDescription className="text-sm">{lesson.description}</CardDescription>
                <div className="flex items-center gap-3 sm:gap-4 mt-2 text-xs sm:text-sm text-muted-foreground flex-wrap">
                  <span>+{lesson.xp_reward} XP</span>
                  {lesson.duration_minutes && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                      {lesson.duration_minutes} min
                    </span>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Lesson Content */}
        <Card className="mb-4 sm:mb-6">
          <CardContent className="p-4 sm:p-6">
            {/* Video Lesson */}
            {lesson.type === 'video' && lesson.content_url && (
              <div className="space-y-3 sm:space-y-4">
                <div className="aspect-video bg-black rounded-lg overflow-hidden">
                  <iframe
                    src={lesson.content_url}
                    className="w-full h-full"
                    allowFullScreen
                    title={lesson.title}
                  />
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Watch the entire video to complete this lesson
                </p>
              </div>
            )}

            {/* PDF Lesson */}
            {lesson.type === 'pdf' && lesson.content_url && (
              <div className="space-y-3 sm:space-y-4">
                <div className="aspect-[3/4] bg-muted rounded-lg overflow-hidden">
                  <iframe
                    src={lesson.content_url}
                    className="w-full h-full"
                    title={lesson.title}
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button asChild size="sm" className="w-full sm:w-auto text-xs sm:text-sm">
                    <a href={lesson.content_url} target="_blank" rel="noopener noreferrer">
                      Open in New Tab
                    </a>
                  </Button>
                  <Button variant="outline" asChild size="sm" className="w-full sm:w-auto text-xs sm:text-sm">
                    <a href={lesson.content_url} download>
                      Download PDF
                    </a>
                  </Button>
                </div>
              </div>
            )}

            {/* Live Class */}
            {lesson.type === 'live_class' && (
              <div className="space-y-3 sm:space-y-4">
                <div className="bg-primary/10 rounded-lg p-6 sm:p-8 text-center">
                  <Users className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 text-primary" />
                  <h3 className="text-lg sm:text-xl font-semibold mb-2">Live Class Session</h3>
                  {lesson.scheduled_at && (
                    <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
                      Scheduled: {new Date(lesson.scheduled_at).toLocaleString()}
                    </p>
                  )}
                  {lesson.duration_minutes && (
                    <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
                      Duration: {lesson.duration_minutes} minutes
                    </p>
                  )}
                  {lesson.meet_link && (
                    <Button size="sm" asChild className="sm:size-default">
                      <a href={lesson.meet_link} target="_blank" rel="noopener noreferrer">
                        Join Live Class
                      </a>
                    </Button>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground text-center">
                  Attend the live class and mark it complete when done
                </p>
              </div>
            )}

            {/* Quiz - Show button to start quiz */}
            {lesson.type === 'quiz' && (
              <div className="space-y-3 sm:space-y-4">
                <div className="bg-primary/10 rounded-lg p-6 sm:p-8 text-center">
                  <ClipboardList className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 text-primary" />
                  <h3 className="text-lg sm:text-xl font-semibold mb-2">Quiz Time!</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
                    Test your knowledge with interactive questions
                  </p>
                  <Button size="sm" onClick={() => navigate(`/quiz/${lessonId}`)} className="sm:size-default">
                    Start Quiz
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Complete Lesson Button */}
        {lesson.type !== 'quiz' && progress?.status !== 'completed' && (
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                <div className="flex-1">
                  <p className="text-sm sm:text-base font-medium mb-1">Ready to complete this lesson?</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    You'll earn {lesson.xp_reward} XP for completing this lesson
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={handleCompleteLesson}
                  disabled={completing}
                  className="w-full sm:w-auto text-xs sm:text-sm whitespace-nowrap"
                >
                  {completing ? 'Completing...' : 'Mark as Complete'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {progress?.status === 'completed' && (
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4 sm:p-6 text-center">
              <CheckCircle className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 text-primary" />
              <p className="text-base sm:text-lg font-medium mb-1">Lesson Completed!</p>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Great job! You earned {lesson.xp_reward} XP
              </p>
              <Button onClick={() => navigate('/dashboard')} className="mt-4 text-xs sm:text-sm">
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
