import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { useGamificationStore } from '@/store/gamificationStore'
import type { Database } from '@/lib/database.types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { CheckCircle, XCircle, ArrowRight, ArrowLeft } from 'lucide-react'

type Question = Database['public']['Tables']['questions']['Row']
type Lesson = Database['public']['Tables']['lessons']['Row']

interface UserAnswer {
  questionId: string
  answer: any
  isCorrect: boolean
}

export function QuizPage() {
  const { lessonId } = useParams<{ lessonId: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { awardXP, updateStreak } = useGamificationStore()

  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([])
  const [currentAnswer, setCurrentAnswer] = useState<any>(null)
  const [showResult, setShowResult] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [quizCompleted, setQuizCompleted] = useState(false)
  const [loading, setLoading] = useState(true)

  // For match_pairs
  const [selectedPairs, setSelectedPairs] = useState<{left: string, right: string}[]>([])
  const [shuffledRightSide, setShuffledRightSide] = useState<string[]>([])
  // For word_order
  const [orderedWords, setOrderedWords] = useState<string[]>([])
  // For speak_record (placeholder)
  const [isRecording, setIsRecording] = useState(false)

  useEffect(() => {
    if (lessonId && user) {
      fetchLessonAndQuestions()
    }
  }, [lessonId, user])

  const fetchLessonAndQuestions = async () => {
    if (!lessonId) return

    try {
      setLoading(true)

      const { data: lessonData, error: lessonError } = await supabase
        .from('lessons')
        .select('*')
        .eq('id', lessonId)
        .single()

      if (lessonError) throw lessonError
      setLesson(lessonData)

      const { data: questionsData, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .eq('lesson_id', lessonId)
        .order('order_index')

      if (questionsError) throw questionsError
      setQuestions(questionsData || [])
    } catch (error) {
      console.error('Error fetching quiz:', error)
      alert('Failed to load quiz')
    } finally {
      setLoading(false)
    }
  }

  const currentQuestion = questions[currentQuestionIndex]

  // Initialize match_pairs when question changes
  useEffect(() => {
    if (currentQuestion?.type === 'match_pairs' && currentQuestion.options) {
      const pairs = currentQuestion.options as {left: string, right: string}[]
      // Shuffle the right side for matching
      const rightSide = pairs.map(p => p.right)
      const shuffled = [...rightSide].sort(() => Math.random() - 0.5)
      setShuffledRightSide(shuffled)
      // Initialize selected pairs with left side and empty right side
      setSelectedPairs(pairs.map(p => ({ left: p.left, right: '' })))
    }
  }, [currentQuestionIndex, currentQuestion])

  const checkAnswer = () => {
    if (!currentQuestion) return

    let correct = false

    switch (currentQuestion.type) {
      case 'multiple_choice':
      case 'fill_blank':
      case 'translation':
      case 'listen_type':
      case 'speak_record':
        correct = currentAnswer?.toLowerCase().trim() === String(currentQuestion.correct_answer).toLowerCase().trim()
        break

      case 'match_pairs':
        const correctPairs = currentQuestion.correct_answer as {left: string, right: string}[]
        // Check if all pairs are matched and every pair has the correct right side
        correct = selectedPairs.length === correctPairs.length &&
          selectedPairs.every(selectedPair => {
            // Check if this pair has been filled
            if (!selectedPair.right) return false
            // Find the correct pair for this left side
            const correctPair = correctPairs.find(cp => cp.left === selectedPair.left)
            // Check if the right side matches
            return correctPair && selectedPair.right === correctPair.right
          })
        break

      case 'word_order':
        const correctOrder = currentQuestion.correct_answer as string[]
        correct = orderedWords.length === correctOrder.length &&
          orderedWords.every((word, idx) => word === correctOrder[idx])
        break

      case 'image_select':
        correct = currentAnswer === currentQuestion.correct_answer
        break
    }

    setIsCorrect(correct)
    setShowResult(true)

    // Save answer
    const newAnswer: UserAnswer = {
      questionId: currentQuestion.id,
      answer: currentAnswer || selectedPairs || orderedWords,
      isCorrect: correct,
    }
    setUserAnswers([...userAnswers, newAnswer])

    // Record attempt in database
    if (user) {
      supabase
        .from('question_attempts')
        .insert({
          user_id: user.id,
          question_id: currentQuestion.id,
          user_answer: newAnswer.answer,
          is_correct: correct,
        })
        .then(({ error }) => {
          if (error) console.error('Error saving attempt:', error)
        })
    }
  }

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
      resetQuestionState()
      setShowResult(false)
    } else {
      finishQuiz()
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
      resetQuestionState()
      setShowResult(false)
    }
  }

  const resetQuestionState = () => {
    setCurrentAnswer(null)
    setSelectedPairs([])
    setShuffledRightSide([])
    setOrderedWords([])
    setIsCorrect(false)
  }

  const finishQuiz = async () => {
    if (!user || !lessonId || !lesson) return

    const correctCount = userAnswers.filter(a => a.isCorrect).length
    const totalCount = questions.length
    const scorePercent = (correctCount / totalCount) * 100

    try {
      // Update progress with proper upsert
      await supabase
        .from('progress')
        .upsert({
          user_id: user.id,
          lesson_id: lessonId,
          status: 'completed',
          score: scorePercent,
          completed_at: new Date().toISOString(),
          attempts: 1, // Will be incremented on conflict
          last_attempt_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,lesson_id',
          ignoreDuplicates: false
        })

      // Award XP
      const xpToAward = Math.floor(lesson.xp_reward * (scorePercent / 100))
      await awardXP(user.id, xpToAward)

      // Update streak
      await updateStreak(user.id)

      // Create activity feed
      await supabase
        .from('activity_feed')
        .insert({
          user_id: user.id,
          activity_type: 'lesson_completed',
          activity_data: {
            lesson_id: lessonId,
            lesson_title: lesson.title,
            score: scorePercent,
            xp_earned: xpToAward,
          },
        })

      setQuizCompleted(true)
    } catch (error) {
      console.error('Error finishing quiz:', error)
      alert('Failed to complete quiz')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading quiz...</div>
      </div>
    )
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-background p-8">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No questions in this quiz yet</p>
            <Button onClick={() => navigate('/dashboard')} className="mt-4">
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (quizCompleted) {
    const correctCount = userAnswers.filter(a => a.isCorrect).length
    const scorePercent = Math.round((correctCount / questions.length) * 100)

    return (
      <div className="min-h-screen bg-background p-8">
        <div className="container mx-auto max-w-2xl">
          <Card>
            <CardContent className="py-12 text-center">
              <CheckCircle className="w-16 h-16 mx-auto mb-4 text-primary" />
              <h2 className="text-3xl font-bold mb-2">Quiz Complete!</h2>
              <p className="text-xl mb-4">Your Score: {scorePercent}%</p>
              <p className="text-muted-foreground mb-6">
                You got {correctCount} out of {questions.length} questions correct
              </p>
              <div className="flex gap-2 justify-center">
                <Button onClick={() => navigate('/dashboard')}>
                  Back to Dashboard
                </Button>
                <Button variant="outline" onClick={() => window.location.reload()}>
                  Retake Quiz
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const progressPercent = ((currentQuestionIndex + 1) / questions.length) * 100

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="container mx-auto max-w-3xl">
        {/* Progress Bar */}
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">
                Question {currentQuestionIndex + 1} of {questions.length}
              </span>
              <span className="text-sm text-muted-foreground">
                {Math.round(progressPercent)}%
              </span>
            </div>
            <Progress value={progressPercent} />
          </CardContent>
        </Card>

        {/* Question Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <Badge variant="outline">{currentQuestion.type.replace('_', ' ')}</Badge>
              <Badge variant="secondary">+{currentQuestion.xp_reward} XP</Badge>
            </div>
            <CardTitle className="text-2xl mt-4">{currentQuestion.question_text}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Multiple Choice */}
            {currentQuestion.type === 'multiple_choice' && (
              <div className="space-y-2">
                {(currentQuestion.options as string[]).map((option, idx) => (
                  <Button
                    key={idx}
                    variant={currentAnswer === option ? 'default' : 'outline'}
                    className="w-full justify-start"
                    onClick={() => setCurrentAnswer(option)}
                    disabled={showResult}
                  >
                    {option}
                  </Button>
                ))}
              </div>
            )}

            {/* Fill in the Blank / Translation / Listen & Type */}
            {['fill_blank', 'translation', 'listen_type'].includes(currentQuestion.type) && (
              <>
                {currentQuestion.type === 'listen_type' && currentQuestion.question_audio_url && (
                  <div className="mb-4">
                    <audio controls className="w-full">
                      <source src={currentQuestion.question_audio_url} />
                    </audio>
                  </div>
                )}
                <Input
                  placeholder="Type your answer..."
                  value={currentAnswer || ''}
                  onChange={(e) => setCurrentAnswer(e.target.value)}
                  disabled={showResult}
                />
              </>
            )}

            {/* Speak & Record */}
            {currentQuestion.type === 'speak_record' && (
              <div className="space-y-2">
                <div className="bg-muted p-4 rounded text-center">
                  <p className="text-sm text-muted-foreground mb-4">
                    Say: "{currentQuestion.correct_answer}"
                  </p>
                  <Button
                    onClick={() => setIsRecording(!isRecording)}
                    variant={isRecording ? 'destructive' : 'default'}
                    disabled={showResult}
                  >
                    {isRecording ? 'Stop Recording' : 'Start Recording'}
                  </Button>
                </div>
                {currentAnswer && (
                  <p className="text-sm text-muted-foreground">
                    Note: Speech recognition would be integrated here
                  </p>
                )}
              </div>
            )}

            {/* Match Pairs */}
            {currentQuestion.type === 'match_pairs' && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground mb-2">
                  Match the items from left to right:
                </p>
                {selectedPairs.map((pair, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <Input value={pair.left} readOnly className="flex-1 bg-muted" />
                    <span className="text-muted-foreground">↔</span>
                    <select
                      value={pair.right}
                      onChange={(e) => {
                        const newPairs = [...selectedPairs]
                        newPairs[idx].right = e.target.value
                        setSelectedPairs(newPairs)
                      }}
                      className="flex h-10 w-full flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                      disabled={showResult}
                    >
                      <option value="">-- Select match --</option>
                      {shuffledRightSide.map((rightValue, rightIdx) => (
                        <option key={rightIdx} value={rightValue}>
                          {rightValue}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            )}

            {/* Word Order */}
            {currentQuestion.type === 'word_order' && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground mb-2">
                  Arrange the words in the correct order:
                </p>
                <div className="flex flex-wrap gap-2">
                  {(currentQuestion.options as string[]).map((word, idx) => (
                    <Button
                      key={idx}
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (orderedWords.includes(word)) {
                          setOrderedWords(orderedWords.filter(w => w !== word))
                        } else {
                          setOrderedWords([...orderedWords, word])
                        }
                      }}
                      disabled={showResult}
                    >
                      {word}
                      {orderedWords.includes(word) && ` (${orderedWords.indexOf(word) + 1})`}
                    </Button>
                  ))}
                </div>
                <div className="mt-4 p-3 bg-muted rounded">
                  <p className="text-sm font-medium">Your order:</p>
                  <p>{orderedWords.join(' ') || '(click words to order them)'}</p>
                </div>
              </div>
            )}

            {/* Image Select */}
            {currentQuestion.type === 'image_select' && (
              <div className="grid grid-cols-2 gap-4">
                {(currentQuestion.options as string[]).map((imageUrl, idx) => (
                  <div
                    key={idx}
                    onClick={() => setCurrentAnswer(imageUrl)}
                    className={`cursor-pointer rounded-lg overflow-hidden border-2 transition ${
                      currentAnswer === imageUrl ? 'border-primary' : 'border-transparent'
                    }`}
                  >
                    <img src={imageUrl} alt={`Option ${idx + 1}`} className="w-full h-40 object-cover" />
                  </div>
                ))}
              </div>
            )}

            {/* Result */}
            {showResult && (
              <Card className={isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {isCorrect ? (
                      <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
                    )}
                    <div>
                      <p className="font-semibold mb-1">
                        {isCorrect ? 'Correct!' : 'Incorrect'}
                      </p>
                      {currentQuestion.explanation && (
                        <p className="text-sm text-muted-foreground">
                          {currentQuestion.explanation}
                        </p>
                      )}
                      {!isCorrect && (
                        <p className="text-sm mt-2">
                          Correct answer: {JSON.stringify(currentQuestion.correct_answer)}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Navigation Buttons */}
            <div className="flex gap-2 justify-between pt-4">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentQuestionIndex === 0 || !showResult}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>

              {!showResult ? (
                <Button
                  onClick={checkAnswer}
                  disabled={
                    (currentQuestion.type === 'word_order' && orderedWords.length === 0) ||
                    (currentQuestion.type === 'match_pairs' && selectedPairs.some(p => !p.right)) ||
                    (!['word_order', 'match_pairs'].includes(currentQuestion.type) && !currentAnswer)
                  }
                >
                  Check Answer
                </Button>
              ) : (
                <Button onClick={handleNext}>
                  {currentQuestionIndex === questions.length - 1 ? 'Finish Quiz' : 'Next'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
