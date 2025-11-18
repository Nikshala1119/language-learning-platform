# Implementation Guide

This guide provides detailed instructions for implementing the remaining components of the language learning platform.

## Table of Contents

1. [Dashboard Components](#dashboard-components)
2. [Question Type Components](#question-type-components)
3. [Admin Panel](#admin-panel)
4. [Additional Pages](#additional-pages)
5. [Custom Hooks](#custom-hooks)
6. [Utils and Helpers](#utils-and-helpers)

---

## Dashboard Components

### Dashboard Page (`src/pages/Dashboard.tsx`)

```typescript
import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useCourseStore } from '@/store/courseStore'
import { useGamificationStore } from '@/store/gamificationStore'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export function Dashboard() {
  const { profile, user } = useAuthStore()
  const { courses, fetchCourses } = useCourseStore()
  const { fetchLeaderboard, leaderboard } = useGamificationStore()

  useEffect(() => {
    fetchCourses()
    if (user) fetchLeaderboard()
  }, [fetchCourses, fetchLeaderboard, user])

  // Calculate level progress
  const levelProgress = profile ? ((profile.xp % 100) / 100) * 100 : 0

  return (
    <div className="min-h-screen bg-background">
      {/* Header with user stats */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">My Learning</h1>
            <div className="flex items-center gap-4">
              <Badge variant="secondary">
                🔥 {profile?.streak_count || 0} day streak
              </Badge>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Level {profile?.level || 1}</p>
                <Progress value={levelProgress} className="w-24" />
              </div>
              <Avatar>
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback>{profile?.full_name?.[0] || 'U'}</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-3 gap-6">
          {/* Courses */}
          <div className="md:col-span-2 space-y-4">
            <h2 className="text-xl font-semibold">Available Courses</h2>
            <div className="grid gap-4">
              {courses.map((course) => (
                <Link key={course.id} to={`/course/${course.id}`}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle>{course.title}</CardTitle>
                          <CardDescription>{course.description}</CardDescription>
                        </div>
                        <Badge>{course.level}</Badge>
                      </div>
                    </CardHeader>
                  </Card>
                </Link>
              ))}
            </div>
          </div>

          {/* Leaderboard Sidebar */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Leaderboard</h2>
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  {leaderboard.slice(0, 10).map((entry) => (
                    <div key={entry.user_id} className="flex items-center gap-3">
                      <span className="font-bold text-muted-foreground w-6">
                        #{entry.rank}
                      </span>
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={entry.avatar_url || undefined} />
                        <AvatarFallback>{entry.full_name?.[0] || 'U'}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{entry.full_name}</p>
                      </div>
                      <Badge variant="secondary">{entry.xp} XP</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
```

### Course Page (`src/pages/CoursePage.tsx`)

Shows units and lessons with progress indicators and unlock logic.

```typescript
// Key logic for progressive unlocking:
const isLessonLocked = (lessonIndex: number, unitIndex: number) => {
  if (lessonIndex === 0 && unitIndex === 0) return false // First lesson always unlocked

  const prevLesson = lessons[lessonIndex - 1]
  if (!prevLesson) return false

  const lessonProgress = progress[prevLesson.id]
  return !lessonProgress || lessonProgress.score < 70
}
```

---

## Question Type Components

### Base Question Component

Create `src/components/questions/QuestionBase.tsx`:

```typescript
interface QuestionBaseProps {
  question: Question
  onAnswer: (answer: any, isCorrect: boolean) => void
  onNext: () => void
}
```

### 1. Multiple Choice (`src/components/questions/MultipleChoice.tsx`)

```typescript
export function MultipleChoice({ question, onAnswer, onNext }: QuestionBaseProps) {
  const [selected, setSelected] = useState<string | null>(null)
  const [checked, setChecked] = useState(false)

  const handleCheck = () => {
    const isCorrect = selected === question.correct_answer
    onAnswer(selected, isCorrect)
    setChecked(true)
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">{question.question_text}</h2>
      <div className="grid gap-2">
        {question.options.map((option: string) => (
          <Button
            key={option}
            variant={selected === option ? "default" : "outline"}
            onClick={() => !checked && setSelected(option)}
            disabled={checked}
          >
            {option}
          </Button>
        ))}
      </div>
      {!checked && (
        <Button onClick={handleCheck} disabled={!selected}>
          Check Answer
        </Button>
      )}
      {checked && (
        <Button onClick={onNext}>
          Next Question
        </Button>
      )}
    </div>
  )
}
```

### 2. Fill in the Blank (`src/components/questions/FillBlank.tsx`)

```typescript
export function FillBlank({ question, onAnswer, onNext }: QuestionBaseProps) {
  const [answer, setAnswer] = useState('')
  const [checked, setChecked] = useState(false)

  const handleCheck = () => {
    const isCorrect = answer.trim().toLowerCase() ===
                     question.correct_answer.toLowerCase()
    onAnswer(answer, isCorrect)
    setChecked(true)
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">{question.question_text}</h2>
      <Input
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        disabled={checked}
        placeholder="Type your answer..."
      />
      {!checked && (
        <Button onClick={handleCheck} disabled={!answer}>
          Check Answer
        </Button>
      )}
      {checked && (
        <>
          {question.explanation && (
            <p className="text-sm text-muted-foreground">{question.explanation}</p>
          )}
          <Button onClick={onNext}>Next Question</Button>
        </>
      )}
    </div>
  )
}
```

### 3. Speak and Record (`src/components/questions/SpeakRecord.tsx`)

```typescript
export function SpeakRecord({ question, onAnswer, onNext }: QuestionBaseProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [score, setScore] = useState<number | null>(null)
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new (window as any).webkitSpeechRecognition()
      recognition.continuous = false
      recognition.interimResults = false

      recognition.onresult = (event: any) => {
        const result = event.results[0][0]
        setTranscript(result.transcript)

        // Calculate pronunciation score based on confidence
        const pronunciationScore = Math.round(result.confidence * 100)
        setScore(pronunciationScore)

        // Check if transcript matches expected answer
        const isCorrect = result.transcript.toLowerCase() ===
                         question.correct_answer.toLowerCase()

        onAnswer(
          { transcript: result.transcript, score: pronunciationScore },
          isCorrect
        )
      }

      recognitionRef.current = recognition
    }
  }, [])

  const startRecording = () => {
    setIsRecording(true)
    recognitionRef.current?.start()
  }

  const stopRecording = () => {
    setIsRecording(false)
    recognitionRef.current?.stop()
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">{question.question_text}</h2>

      <div className="flex flex-col items-center gap-4 p-8 border rounded-lg">
        <Button
          size="lg"
          variant={isRecording ? "destructive" : "default"}
          onClick={isRecording ? stopRecording : startRecording}
        >
          {isRecording ? "Stop Recording" : "Start Recording"}
        </Button>

        {transcript && (
          <div className="text-center">
            <p className="text-lg">"{transcript}"</p>
            {score !== null && (
              <Badge variant="secondary">
                Pronunciation Score: {score}%
              </Badge>
            )}
          </div>
        )}
      </div>

      {score !== null && (
        <Button onClick={onNext}>Next Question</Button>
      )}
    </div>
  )
}
```

### 4. Match Pairs (`src/components/questions/MatchPairs.tsx`)

```typescript
export function MatchPairs({ question, onAnswer, onNext }: QuestionBaseProps) {
  const [pairs, setPairs] = useState<Record<string, string>>({})
  const [checked, setChecked] = useState(false)

  // question.options = { left: [...], right: [...] }
  // question.correct_answer = { "left1": "right1", ... }

  const handleMatch = (left: string, right: string) => {
    setPairs({ ...pairs, [left]: right })
  }

  const handleCheck = () => {
    const isCorrect = Object.keys(question.correct_answer).every(
      key => pairs[key] === question.correct_answer[key]
    )
    onAnswer(pairs, isCorrect)
    setChecked(true)
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">{question.question_text}</h2>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-2">
          {question.options.left.map((item: string) => (
            <Card key={item} className="p-4">
              {item}
            </Card>
          ))}
        </div>
        <div className="space-y-2">
          {question.options.right.map((item: string) => (
            <Button
              key={item}
              variant="outline"
              onClick={() => /* implement matching logic */}
            >
              {item}
            </Button>
          ))}
        </div>
      </div>

      {/* Implementation continues... */}
    </div>
  )
}
```

### 5. Listen and Type (`src/components/questions/ListenType.tsx`)

```typescript
export function ListenType({ question, onAnswer, onNext }: QuestionBaseProps) {
  const [answer, setAnswer] = useState('')
  const [checked, setChecked] = useState(false)

  const playAudio = () => {
    if (question.question_audio_url) {
      const audio = new Audio(question.question_audio_url)
      audio.play()
    } else {
      // Use Web Speech API for TTS
      const utterance = new SpeechSynthesisUtterance(question.correct_answer)
      speechSynthesis.speak(utterance)
    }
  }

  const handleCheck = () => {
    const isCorrect = answer.trim().toLowerCase() ===
                     question.correct_answer.toLowerCase()
    onAnswer(answer, isCorrect)
    setChecked(true)
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Listen and type what you hear</h2>

      <div className="flex justify-center">
        <Button size="lg" onClick={playAudio}>
          🔊 Play Audio
        </Button>
      </div>

      <Input
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        disabled={checked}
        placeholder="Type what you heard..."
      />

      {!checked && (
        <Button onClick={handleCheck} disabled={!answer}>
          Check Answer
        </Button>
      )}
      {checked && <Button onClick={onNext}>Next Question</Button>}
    </div>
  )
}
```

---

## Admin Panel

### Admin Layout (`src/pages/admin/AdminPanel.tsx`)

```typescript
export function AdminPanel() {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-muted/40">
        <div className="p-4">
          <h2 className="font-bold text-lg">Admin Panel</h2>
        </div>
        <nav className="space-y-1 p-2">
          <Link to="/admin/courses" className="block px-3 py-2 rounded hover:bg-accent">
            Courses
          </Link>
          <Link to="/admin/students" className="block px-3 py-2 rounded hover:bg-accent">
            Students
          </Link>
          <Link to="/admin/analytics" className="block px-3 py-2 rounded hover:bg-accent">
            Analytics
          </Link>
          <Link to="/admin/media" className="block px-3 py-2 rounded hover:bg-accent">
            Media Library
          </Link>
        </nav>
      </aside>

      {/* Content */}
      <main className="flex-1 p-8">
        <Routes>
          <Route path="courses" element={<CoursesAdmin />} />
          <Route path="students" element={<StudentsAdmin />} />
          <Route path="analytics" element={<AnalyticsAdmin />} />
          <Route path="media" element={<MediaLibrary />} />
        </Routes>
      </main>
    </div>
  )
}
```

### Course Management (`src/pages/admin/CoursesAdmin.tsx`)

```typescript
export function CoursesAdmin() {
  const [courses, setCourses] = useState<Course[]>([])
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  const fetchCourses = async () => {
    const { data } = await supabase
      .from('courses')
      .select('*')
      .order('order_index')
    setCourses(data || [])
  }

  useEffect(() => {
    fetchCourses()
  }, [])

  const handleCreate = async (courseData: Partial<Course>) => {
    await supabase.from('courses').insert(courseData)
    fetchCourses()
    setIsCreateDialogOpen(false)
  }

  const handleDelete = async (id: string) => {
    await supabase.from('courses').delete().eq('id', id)
    fetchCourses()
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Manage Courses</h1>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          Create Course
        </Button>
      </div>

      <div className="grid gap-4">
        {courses.map((course) => (
          <Card key={course.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{course.title}</CardTitle>
                  <CardDescription>{course.description}</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(course.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>

      {/* Create Dialog */}
      {/* Implement dialog with form */}
    </div>
  )
}
```

### Student Management with Payment Flags

```typescript
export function StudentsAdmin() {
  const [students, setStudents] = useState<Profile[]>([])

  const updatePaymentStatus = async (userId: string, status: string) => {
    await supabase
      .from('profiles')
      .update({ payment_status: status })
      .eq('id', userId)

    fetchStudents()
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Student Management</h1>

      <div className="rounded-md border">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="p-4 text-left">Student</th>
              <th className="p-4 text-left">Email</th>
              <th className="p-4 text-left">XP</th>
              <th className="p-4 text-left">Payment Status</th>
              <th className="p-4 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => (
              <tr key={student.id} className="border-b">
                <td className="p-4">{student.full_name}</td>
                <td className="p-4">{student.email}</td>
                <td className="p-4">{student.xp}</td>
                <td className="p-4">
                  <Badge
                    variant={
                      student.payment_status === 'paid' ? 'default' :
                      student.payment_status === 'trial' ? 'secondary' :
                      'destructive'
                    }
                  >
                    {student.payment_status}
                  </Badge>
                </td>
                <td className="p-4">
                  <select
                    value={student.payment_status}
                    onChange={(e) => updatePaymentStatus(student.id, e.target.value)}
                    className="border rounded px-2 py-1"
                  >
                    <option value="paid">Paid</option>
                    <option value="unpaid">Unpaid</option>
                    <option value="trial">Trial</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

---

## Custom Hooks

### useProgress Hook

```typescript
// src/hooks/useProgress.ts
export function useProgress(userId: string, lessonId: string) {
  const [progress, setProgress] = useState<Progress | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProgress()
  }, [userId, lessonId])

  const fetchProgress = async () => {
    const { data } = await supabase
      .from('progress')
      .select('*')
      .eq('user_id', userId)
      .eq('lesson_id', lessonId)
      .single()

    setProgress(data)
    setLoading(false)
  }

  const updateProgress = async (updates: Partial<Progress>) => {
    const { data } = await supabase
      .from('progress')
      .upsert({
        user_id: userId,
        lesson_id: lessonId,
        ...updates,
      })
      .select()
      .single()

    setProgress(data)
  }

  return { progress, loading, updateProgress }
}
```

### useAttendance Hook

```typescript
// src/hooks/useAttendance.ts
export function useAttendance() {
  const trackAttendance = async (userId: string, lessonId: string) => {
    await supabase.from('attendance').insert({
      user_id: userId,
      lesson_id: lessonId,
      joined_at: new Date().toISOString(),
    })
  }

  return { trackAttendance }
}
```

---

## Implementation Checklist

### Core Features
- [x] Authentication system
- [x] Database schema
- [x] Zustand stores
- [ ] Dashboard with courses
- [ ] Course page with units/lessons
- [ ] Lesson page with question types
- [ ] All 8 question type components
- [ ] Progressive unlocking logic
- [ ] XP and leveling system
- [ ] Streak tracking
- [ ] Achievements system
- [ ] Leaderboard with real-time updates

### Admin Features
- [ ] Course CRUD
- [ ] Unit CRUD
- [ ] Lesson CRUD
- [ ] Question CRUD with rich editor
- [ ] Student management
- [ ] Payment status management
- [ ] Analytics dashboard
- [ ] Media library with upload

### Social Features
- [ ] Friend system
- [ ] Activity feed
- [ ] Sharing functionality

### Additional
- [ ] Profile page
- [ ] Settings page
- [ ] Responsive design
- [ ] Accessibility features
- [ ] Error handling
- [ ] Loading states
- [ ] Toast notifications

---

## Next Steps

1. **Implement Dashboard**: Start with the Dashboard page showing courses
2. **Build Question Components**: Create all 8 question type components
3. **Create Lesson Flow**: Build the lesson page that cycles through questions
4. **Add Admin Panel**: Implement CRUD operations for content management
5. **Test Progressive Unlocking**: Ensure 70% threshold works correctly
6. **Add Social Features**: Implement friends and activity feed
7. **Polish UI/UX**: Add animations, loading states, error handling
8. **Accessibility Testing**: Ensure WCAG AA compliance
9. **Performance Optimization**: Implement lazy loading, code splitting
10. **Deploy**: Set up production environment

---

This guide provides a foundation for completing the platform. Each component can be extended with additional features as needed.
