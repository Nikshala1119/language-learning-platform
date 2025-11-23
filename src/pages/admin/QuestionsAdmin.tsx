import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/database.types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Pencil, Trash2, Plus, X } from 'lucide-react'

type Lesson = Database['public']['Tables']['lessons']['Row']
type Question = Database['public']['Tables']['questions']['Row']
type QuestionInsert = Database['public']['Tables']['questions']['Insert']

const QUESTION_TYPES = [
  { value: 'multiple_choice', label: 'Multiple Choice' },
  { value: 'fill_blank', label: 'Fill in the Blank' },
  { value: 'translation', label: 'Translation' },
  { value: 'listen_type', label: 'Listen & Type' },
  { value: 'speak_record', label: 'Speak & Record' },
  { value: 'match_pairs', label: 'Match Pairs' },
  { value: 'word_order', label: 'Word Order' },
  { value: 'image_select', label: 'Image Select' },
] as const

export function QuestionsAdmin() {
  const navigate = useNavigate()
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null)
  const [loading, setLoading] = useState(true)
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState<any>({
    type: 'multiple_choice',
    question_text: '',
    question_audio_url: '',
    question_image_url: '',
    explanation: '',
    xp_reward: 5,
    order_index: 0,
    // Type-specific fields
    options: ['', '', '', ''],
    correct_answer: null,
    pairs: [{ left: '', right: '' }],
    words: [''],
    images: [''],
  })

  useEffect(() => {
    fetchLessons()
  }, [])

  useEffect(() => {
    if (selectedLesson) {
      fetchQuestions(selectedLesson.id)
    }
  }, [selectedLesson])

  const fetchLessons = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('type', 'quiz')
        .order('order_index')

      if (error) throw error
      setLessons(data || [])
      if (data && data.length > 0) {
        setSelectedLesson(data[0])
      }
    } catch (error) {
      console.error('Error fetching lessons:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchQuestions = async (lessonId: string) => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('lesson_id', lessonId)
        .order('order_index')

      if (error) throw error
      setQuestions(data || [])
    } catch (error) {
      console.error('Error fetching questions:', error)
    } finally {
      setLoading(false)
    }
  }

  const validateQuestion = (): string | null => {
    // Validate based on question type
    switch (formData.type) {
      case 'multiple_choice':
        const validOptions = formData.options.filter((o: string) => o.trim())
        if (validOptions.length < 2) {
          return 'Multiple choice questions need at least 2 options'
        }
        if (!formData.correct_answer || !formData.correct_answer.trim()) {
          return 'Please provide a correct answer'
        }
        if (!validOptions.includes(formData.correct_answer.trim())) {
          return 'Correct answer must match one of the options exactly'
        }
        break

      case 'fill_blank':
      case 'translation':
      case 'listen_type':
      case 'speak_record':
        if (!formData.correct_answer || !formData.correct_answer.trim()) {
          return 'Please provide a correct answer'
        }
        break

      case 'match_pairs':
        const validPairs = formData.pairs.filter((p: any) => p.left && p.right)
        if (validPairs.length < 2) {
          return 'Match pairs questions need at least 2 pairs'
        }
        // Check for duplicate left or right values
        const leftValues = validPairs.map((p: any) => p.left.toLowerCase())
        const rightValues = validPairs.map((p: any) => p.right.toLowerCase())
        if (new Set(leftValues).size !== leftValues.length) {
          return 'Left side values must be unique'
        }
        if (new Set(rightValues).size !== rightValues.length) {
          return 'Right side values must be unique'
        }
        break

      case 'word_order':
        const validWords = formData.words.filter((w: string) => w.trim())
        if (validWords.length < 2) {
          return 'Word order questions need at least 2 words'
        }
        break

      case 'image_select':
        const validImages = formData.images.filter((i: string) => i.trim())
        if (validImages.length < 2) {
          return 'Image select questions need at least 2 images'
        }
        if (!formData.correct_answer || !formData.correct_answer.trim()) {
          return 'Please provide the correct image URL'
        }
        if (!validImages.includes(formData.correct_answer.trim())) {
          return 'Correct answer must match one of the image URLs exactly'
        }
        break
    }

    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedLesson) {
      alert('Please select a lesson first')
      return
    }

    // Validate the question
    const validationError = validateQuestion()
    if (validationError) {
      alert(validationError)
      return
    }

    try {
      const dataToSubmit: any = {
        lesson_id: selectedLesson.id,
        type: formData.type,
        question_text: formData.question_text,
        explanation: formData.explanation || null,
        xp_reward: formData.xp_reward,
        order_index: formData.order_index,
      }

      // Build options and correct_answer based on question type
      switch (formData.type) {
        case 'multiple_choice':
          dataToSubmit.options = formData.options.filter((o: string) => o.trim())
          dataToSubmit.correct_answer = formData.correct_answer.trim()
          break

        case 'fill_blank':
          dataToSubmit.correct_answer = formData.correct_answer
          break

        case 'translation':
          dataToSubmit.correct_answer = formData.correct_answer
          break

        case 'listen_type':
          dataToSubmit.question_audio_url = formData.question_audio_url
          dataToSubmit.correct_answer = formData.correct_answer
          break

        case 'speak_record':
          dataToSubmit.correct_answer = formData.correct_answer
          break

        case 'match_pairs':
          const validPairs = formData.pairs.filter((p: any) => p.left && p.right)
          dataToSubmit.options = validPairs
          dataToSubmit.correct_answer = validPairs
          break

        case 'word_order':
          dataToSubmit.options = formData.words.filter((w: string) => w.trim())
          dataToSubmit.correct_answer = formData.words.filter((w: string) => w.trim())
          break

        case 'image_select':
          dataToSubmit.options = formData.images.filter((i: string) => i.trim())
          dataToSubmit.correct_answer = formData.correct_answer
          dataToSubmit.question_image_url = formData.question_image_url
          break
      }

      if (editingQuestion) {
        const { error } = await supabase
          .from('questions')
          .update(dataToSubmit)
          .eq('id', editingQuestion.id)

        if (error) throw error
        alert('Question updated successfully!')
      } else {
        const { error } = await supabase
          .from('questions')
          .insert(dataToSubmit as QuestionInsert)

        if (error) throw error
        alert('Question created successfully!')
      }

      resetForm()
      fetchQuestions(selectedLesson.id)
    } catch (error) {
      console.error('Error saving question:', error)
      alert('Failed to save question: ' + (error as any).message)
    }
  }

  const handleEdit = (question: Question) => {
    setEditingQuestion(question)
    const newFormData: any = {
      type: question.type,
      question_text: question.question_text,
      question_audio_url: question.question_audio_url || '',
      question_image_url: question.question_image_url || '',
      explanation: question.explanation || '',
      xp_reward: question.xp_reward,
      order_index: question.order_index,
      options: ['', '', '', ''],
      correct_answer: null,
      pairs: [{ left: '', right: '' }],
      words: [''],
      images: [''],
    }

    // Parse existing data based on type
    switch (question.type) {
      case 'multiple_choice':
        newFormData.options = Array.isArray(question.options) ? question.options : ['', '', '', '']
        newFormData.correct_answer = question.correct_answer
        break
      case 'match_pairs':
        newFormData.pairs = Array.isArray(question.options) ? question.options : [{ left: '', right: '' }]
        break
      case 'word_order':
        newFormData.words = Array.isArray(question.options) ? question.options : ['']
        break
      case 'image_select':
        newFormData.images = Array.isArray(question.options) ? question.options : ['']
        newFormData.correct_answer = question.correct_answer
        break
      default:
        newFormData.correct_answer = question.correct_answer
    }

    setFormData(newFormData)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this question?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('questions')
        .delete()
        .eq('id', id)

      if (error) throw error
      alert('Question deleted successfully!')
      if (selectedLesson) {
        fetchQuestions(selectedLesson.id)
      }
    } catch (error) {
      console.error('Error deleting question:', error)
      alert('Failed to delete question')
    }
  }

  const resetForm = () => {
    setEditingQuestion(null)
    setFormData({
      type: 'multiple_choice',
      question_text: '',
      question_audio_url: '',
      question_image_url: '',
      explanation: '',
      xp_reward: 5,
      order_index: 0,
      options: ['', '', '', ''],
      correct_answer: null,
      pairs: [{ left: '', right: '' }],
      words: [''],
      images: [''],
    })
    setShowForm(false)
  }

  const addOption = () => {
    setFormData({ ...formData, options: [...formData.options, ''] })
  }

  const removeOption = (index: number) => {
    const newOptions = formData.options.filter((_: any, i: number) => i !== index)
    setFormData({ ...formData, options: newOptions })
  }

  const updateOption = (index: number, value: string) => {
    const newOptions = [...formData.options]
    newOptions[index] = value
    setFormData({ ...formData, options: newOptions })
  }

  const addPair = () => {
    setFormData({ ...formData, pairs: [...formData.pairs, { left: '', right: '' }] })
  }

  const removePair = (index: number) => {
    const newPairs = formData.pairs.filter((_: any, i: number) => i !== index)
    setFormData({ ...formData, pairs: newPairs })
  }

  const updatePair = (index: number, side: 'left' | 'right', value: string) => {
    const newPairs = [...formData.pairs]
    newPairs[index][side] = value
    setFormData({ ...formData, pairs: newPairs })
  }

  const addWord = () => {
    setFormData({ ...formData, words: [...formData.words, ''] })
  }

  const removeWord = (index: number) => {
    const newWords = formData.words.filter((_: any, i: number) => i !== index)
    setFormData({ ...formData, words: newWords })
  }

  const updateWord = (index: number, value: string) => {
    const newWords = [...formData.words]
    newWords[index] = value
    setFormData({ ...formData, words: newWords })
  }

  const addImage = () => {
    setFormData({ ...formData, images: [...formData.images, ''] })
  }

  const removeImage = (index: number) => {
    const newImages = formData.images.filter((_: any, i: number) => i !== index)
    setFormData({ ...formData, images: newImages })
  }

  const updateImage = (index: number, value: string) => {
    const newImages = [...formData.images]
    newImages[index] = value
    setFormData({ ...formData, images: newImages })
  }

  if (loading && lessons.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  if (lessons.length === 0) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">No quiz lessons available</p>
            <p className="text-sm text-muted-foreground mb-4">
              Create a quiz-type lesson first before adding questions
            </p>
            <Button onClick={() => navigate('/admin/lessons')}>
              Go to Lessons
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Question Management</h1>
          <p className="text-muted-foreground mt-1">Create quiz questions</p>
        </div>
        <Button onClick={() => setShowForm(true)} disabled={!selectedLesson}>
          <Plus className="w-4 h-4 mr-2" />
          New Question
        </Button>
      </div>

      {/* Lesson Selector */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Select Quiz Lesson</CardTitle>
          <CardDescription>Choose a quiz to manage its questions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {lessons.map((lesson) => (
              <Button
                key={lesson.id}
                variant={selectedLesson?.id === lesson.id ? 'default' : 'outline'}
                onClick={() => setSelectedLesson(lesson)}
                size="sm"
              >
                {lesson.title}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {showForm && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{editingQuestion ? 'Edit Question' : 'Create New Question'}</CardTitle>
            <CardDescription>
              {editingQuestion ? 'Update question' : `Add a question to ${selectedLesson?.title}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2 md:col-span-1">
                  <Label htmlFor="type">Question Type *</Label>
                  <select
                    id="type"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    required
                  >
                    {QUESTION_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="xp_reward">XP Reward</Label>
                  <Input
                    id="xp_reward"
                    type="number"
                    value={formData.xp_reward}
                    onChange={(e) => setFormData({ ...formData, xp_reward: parseInt(e.target.value) || 5 })}
                  />
                </div>
              </div>

              {formData.type !== 'listen_type' && (
                <div className="space-y-2">
                  <Label htmlFor="question_text">Question Text *</Label>
                  <textarea
                    id="question_text"
                    value={formData.question_text}
                    onChange={(e) => setFormData({ ...formData, question_text: e.target.value })}
                    placeholder="Enter the question..."
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    rows={2}
                    required
                  />
                </div>
              )}

              {/* Type-specific fields */}
              {formData.type === 'multiple_choice' && (
                <>
                  <div className="space-y-2">
                    <Label>Options *</Label>
                    {formData.options.map((option: string, index: number) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={option}
                          onChange={(e) => updateOption(index, e.target.value)}
                          placeholder={`Option ${index + 1}`}
                          required
                        />
                        {formData.options.length > 2 && (
                          <Button type="button" variant="ghost" size="sm" onClick={() => removeOption(index)}>
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={addOption}>
                      <Plus className="w-4 h-4 mr-2" /> Add Option
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="correct_answer">Correct Answer *</Label>
                    <Input
                      id="correct_answer"
                      value={formData.correct_answer || ''}
                      onChange={(e) => setFormData({ ...formData, correct_answer: e.target.value })}
                      placeholder="Enter the exact text of the correct option"
                      required
                    />
                  </div>
                </>
              )}

              {(formData.type === 'fill_blank' || formData.type === 'translation') && (
                <div className="space-y-2">
                  <Label htmlFor="correct_answer">Correct Answer *</Label>
                  <Input
                    id="correct_answer"
                    value={formData.correct_answer || ''}
                    onChange={(e) => setFormData({ ...formData, correct_answer: e.target.value })}
                    placeholder={formData.type === 'fill_blank' ? 'The word that fills the blank' : 'Correct translation'}
                    required
                  />
                </div>
              )}

              {formData.type === 'listen_type' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="question_audio_url">Audio URL *</Label>
                    <Input
                      id="question_audio_url"
                      value={formData.question_audio_url}
                      onChange={(e) => setFormData({ ...formData, question_audio_url: e.target.value })}
                      placeholder="https://..."
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="correct_answer">Correct Text *</Label>
                    <Input
                      id="correct_answer"
                      value={formData.correct_answer || ''}
                      onChange={(e) => setFormData({ ...formData, correct_answer: e.target.value })}
                      placeholder="What the student should type"
                      required
                    />
                  </div>
                </>
              )}

              {formData.type === 'speak_record' && (
                <div className="space-y-2">
                  <Label htmlFor="correct_answer">Expected Pronunciation *</Label>
                  <Input
                    id="correct_answer"
                    value={formData.correct_answer || ''}
                    onChange={(e) => setFormData({ ...formData, correct_answer: e.target.value })}
                    placeholder="The phrase they should say"
                    required
                  />
                </div>
              )}

              {formData.type === 'match_pairs' && (
                <div className="space-y-2">
                  <Label>Pairs to Match *</Label>
                  {formData.pairs.map((pair: any, index: number) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={pair.left}
                        onChange={(e) => updatePair(index, 'left', e.target.value)}
                        placeholder="Left side"
                        required
                      />
                      <span className="flex items-center">↔</span>
                      <Input
                        value={pair.right}
                        onChange={(e) => updatePair(index, 'right', e.target.value)}
                        placeholder="Right side"
                        required
                      />
                      {formData.pairs.length > 1 && (
                        <Button type="button" variant="ghost" size="sm" onClick={() => removePair(index)}>
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={addPair}>
                    <Plus className="w-4 h-4 mr-2" /> Add Pair
                  </Button>
                </div>
              )}

              {formData.type === 'word_order' && (
                <div className="space-y-2">
                  <Label>Words (in correct order) *</Label>
                  {formData.words.map((word: string, index: number) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={word}
                        onChange={(e) => updateWord(index, e.target.value)}
                        placeholder={`Word ${index + 1}`}
                        required
                      />
                      {formData.words.length > 1 && (
                        <Button type="button" variant="ghost" size="sm" onClick={() => removeWord(index)}>
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={addWord}>
                    <Plus className="w-4 h-4 mr-2" /> Add Word
                  </Button>
                </div>
              )}

              {formData.type === 'image_select' && (
                <>
                  <div className="space-y-2">
                    <Label>Image URLs *</Label>
                    {formData.images.map((image: string, index: number) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={image}
                          onChange={(e) => updateImage(index, e.target.value)}
                          placeholder="https://..."
                          required
                        />
                        {formData.images.length > 1 && (
                          <Button type="button" variant="ghost" size="sm" onClick={() => removeImage(index)}>
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={addImage}>
                      <Plus className="w-4 h-4 mr-2" /> Add Image
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="correct_answer">Correct Image URL *</Label>
                    <Input
                      id="correct_answer"
                      value={formData.correct_answer || ''}
                      onChange={(e) => setFormData({ ...formData, correct_answer: e.target.value })}
                      placeholder="URL of the correct image"
                      required
                    />
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="explanation">Explanation (optional)</Label>
                <textarea
                  id="explanation"
                  value={formData.explanation}
                  onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                  placeholder="Explain the correct answer..."
                  className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  rows={2}
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit">
                  {editingQuestion ? 'Update Question' : 'Create Question'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Questions List */}
      <div className="space-y-4">
        {selectedLesson && (
          <div className="mb-4">
            <h2 className="text-xl font-semibold mb-2">
              Questions in {selectedLesson.title}
            </h2>
            <p className="text-sm text-muted-foreground">
              {questions.length} question{questions.length !== 1 ? 's' : ''}
            </p>
          </div>
        )}

        {questions.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground mb-4">No questions yet in this quiz</p>
              <Button onClick={() => setShowForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create First Question
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {questions.map((question, index) => (
              <Card key={question.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-bold text-muted-foreground">Q{index + 1}</span>
                        <Badge variant="outline">
                          {QUESTION_TYPES.find(t => t.value === question.type)?.label}
                        </Badge>
                        <Badge variant="secondary">{question.xp_reward} XP</Badge>
                      </div>
                      <p className="font-medium mb-1">{question.question_text}</p>
                      {question.explanation && (
                        <p className="text-sm text-muted-foreground">{question.explanation}</p>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(question)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(question.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
