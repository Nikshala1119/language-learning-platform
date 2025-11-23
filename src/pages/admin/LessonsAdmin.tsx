import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/database.types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Pencil, Trash2, Plus, Video, FileText, Users, ClipboardList, Eye, EyeOff } from 'lucide-react'

type Course = Database['public']['Tables']['courses']['Row']
type Unit = Database['public']['Tables']['units']['Row']
type Lesson = Database['public']['Tables']['lessons']['Row']
type LessonInsert = Database['public']['Tables']['lessons']['Insert']

const LESSON_TYPES = [
  { value: 'video', label: 'Video Lesson', icon: Video },
  { value: 'pdf', label: 'PDF Document', icon: FileText },
  { value: 'live_class', label: 'Live Class', icon: Users },
  { value: 'quiz', label: 'Quiz', icon: ClipboardList },
] as const

export function LessonsAdmin() {
  const navigate = useNavigate()
  const [courses, setCourses] = useState<Course[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null)
  const [loading, setLoading] = useState(true)
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState<Partial<LessonInsert>>({
    title: '',
    description: '',
    type: 'video',
    content_url: '',
    meet_link: '',
    scheduled_at: '',
    duration_minutes: 60,
    xp_reward: 10,
    order_index: 0,
    is_published: false,
  })

  useEffect(() => {
    fetchCourses()
  }, [])

  useEffect(() => {
    if (selectedCourse) {
      fetchUnits(selectedCourse.id)
    }
  }, [selectedCourse])

  useEffect(() => {
    if (selectedUnit) {
      fetchLessons(selectedUnit.id)
    }
  }, [selectedUnit])

  const fetchCourses = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('order_index')

      if (error) throw error
      setCourses(data || [])
      if (data && data.length > 0) {
        setSelectedCourse(data[0])
      }
    } catch (error) {
      console.error('Error fetching courses:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUnits = async (courseId: string) => {
    try {
      const { data, error } = await supabase
        .from('units')
        .select('*')
        .eq('course_id', courseId)
        .order('order_index')

      if (error) throw error
      setUnits(data || [])
      if (data && data.length > 0) {
        setSelectedUnit(data[0])
      } else {
        setSelectedUnit(null)
        setLessons([])
      }
    } catch (error) {
      console.error('Error fetching units:', error)
    }
  }

  const fetchLessons = async (unitId: string) => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('unit_id', unitId)
        .order('order_index')

      if (error) throw error
      setLessons(data || [])
    } catch (error) {
      console.error('Error fetching lessons:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUnit) {
      alert('Please select a unit first')
      return
    }

    try {
      const dataToSubmit: any = {
        ...formData,
        unit_id: selectedUnit.id,
      }

      // Clean up fields based on lesson type
      if (formData.type !== 'live_class') {
        delete dataToSubmit.meet_link
        delete dataToSubmit.scheduled_at
        delete dataToSubmit.duration_minutes
      }
      if (formData.type === 'quiz' || formData.type === 'live_class') {
        delete dataToSubmit.content_url
      }

      if (editingLesson) {
        const { error } = await supabase
          .from('lessons')
          .update(dataToSubmit)
          .eq('id', editingLesson.id)

        if (error) throw error
        alert('Lesson updated successfully!')
      } else {
        const { error } = await supabase
          .from('lessons')
          .insert(dataToSubmit as LessonInsert)

        if (error) throw error
        alert('Lesson created successfully!')
      }

      resetForm()
      fetchLessons(selectedUnit.id)
    } catch (error) {
      console.error('Error saving lesson:', error)
      alert('Failed to save lesson')
    }
  }

  const handleEdit = (lesson: Lesson) => {
    setEditingLesson(lesson)
    setFormData({
      title: lesson.title,
      description: lesson.description,
      type: lesson.type,
      content_url: lesson.content_url || '',
      meet_link: lesson.meet_link || '',
      scheduled_at: lesson.scheduled_at || '',
      duration_minutes: lesson.duration_minutes || 60,
      xp_reward: lesson.xp_reward,
      order_index: lesson.order_index,
      is_published: lesson.is_published,
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this lesson? This will also delete all questions in it.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('lessons')
        .delete()
        .eq('id', id)

      if (error) throw error
      alert('Lesson deleted successfully!')
      if (selectedUnit) {
        fetchLessons(selectedUnit.id)
      }
    } catch (error) {
      console.error('Error deleting lesson:', error)
      alert('Failed to delete lesson')
    }
  }

  const togglePublish = async (lesson: Lesson) => {
    try {
      const { error } = await supabase
        .from('lessons')
        .update({ is_published: !lesson.is_published })
        .eq('id', lesson.id)

      if (error) throw error
      if (selectedUnit) {
        fetchLessons(selectedUnit.id)
      }
    } catch (error) {
      console.error('Error toggling publish:', error)
      alert('Failed to toggle publish status')
    }
  }

  const resetForm = () => {
    setEditingLesson(null)
    setFormData({
      title: '',
      description: '',
      type: 'video',
      content_url: '',
      meet_link: '',
      scheduled_at: '',
      duration_minutes: 60,
      xp_reward: 10,
      order_index: 0,
      is_published: false,
    })
    setShowForm(false)
  }

  const getLessonIcon = (type: string) => {
    const lessonType = LESSON_TYPES.find(t => t.value === type)
    return lessonType ? lessonType.icon : FileText
  }

  if (loading && courses.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  if (courses.length === 0) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">No courses available</p>
            <Button onClick={() => navigate('/admin/courses')}>
              Go to Courses
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (units.length === 0) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">No units in this course</p>
            <Button onClick={() => navigate('/admin/units')}>
              Go to Units
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
          <h1 className="text-3xl font-bold">Lesson Management</h1>
          <p className="text-muted-foreground mt-1">Create and manage lessons</p>
        </div>
        <Button onClick={() => setShowForm(true)} disabled={!selectedUnit}>
          <Plus className="w-4 h-4 mr-2" />
          New Lesson
        </Button>
      </div>

      {/* Course and Unit Selector */}
      <div className="grid md:grid-cols-2 gap-4 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Select Course</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {courses.map((course) => (
                <Button
                  key={course.id}
                  variant={selectedCourse?.id === course.id ? 'default' : 'outline'}
                  onClick={() => setSelectedCourse(course)}
                  size="sm"
                >
                  {course.title}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Select Unit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {units.map((unit) => (
                <Button
                  key={unit.id}
                  variant={selectedUnit?.id === unit.id ? 'default' : 'outline'}
                  onClick={() => setSelectedUnit(unit)}
                  size="sm"
                >
                  {unit.title}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {showForm && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{editingLesson ? 'Edit Lesson' : 'Create New Lesson'}</CardTitle>
            <CardDescription>
              {editingLesson ? 'Update lesson information' : `Add a new lesson to ${selectedUnit?.title}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2 md:col-span-1">
                  <Label htmlFor="title">Lesson Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Introduction to Greetings"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Lesson Type *</Label>
                  <select
                    id="type"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    required
                  >
                    {LESSON_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="What will students learn?"
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  rows={3}
                />
              </div>

              {/* Conditional Fields Based on Type */}
              {(formData.type === 'video' || formData.type === 'pdf') && (
                <div className="space-y-2">
                  <Label htmlFor="content_url">
                    {formData.type === 'video' ? 'Video URL' : 'PDF URL'} *
                  </Label>
                  <Input
                    id="content_url"
                    value={formData.content_url}
                    onChange={(e) => setFormData({ ...formData, content_url: e.target.value })}
                    placeholder="https://..."
                    required
                  />
                </div>
              )}

              {formData.type === 'live_class' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="meet_link">Google Meet Link *</Label>
                      <Input
                        id="meet_link"
                        value={formData.meet_link}
                        onChange={(e) => setFormData({ ...formData, meet_link: e.target.value })}
                        placeholder="https://meet.google.com/..."
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="duration_minutes">Duration (minutes)</Label>
                      <Input
                        id="duration_minutes"
                        type="number"
                        value={formData.duration_minutes}
                        onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 60 })}
                        placeholder="60"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="scheduled_at">Scheduled Date & Time</Label>
                    <Input
                      id="scheduled_at"
                      type="datetime-local"
                      value={formData.scheduled_at}
                      onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
                    />
                  </div>
                </>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="xp_reward">XP Reward</Label>
                  <Input
                    id="xp_reward"
                    type="number"
                    value={formData.xp_reward}
                    onChange={(e) => setFormData({ ...formData, xp_reward: parseInt(e.target.value) || 10 })}
                    placeholder="10"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="order_index">Display Order</Label>
                  <Input
                    id="order_index"
                    type="number"
                    value={formData.order_index}
                    onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_published"
                  checked={formData.is_published || false}
                  onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="is_published" className="cursor-pointer">
                  Publish lesson (make visible to students)
                </Label>
              </div>

              <div className="flex gap-2">
                <Button type="submit">
                  {editingLesson ? 'Update Lesson' : 'Create Lesson'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Lessons List */}
      <div className="space-y-4">
        {selectedUnit && (
          <div className="mb-4">
            <h2 className="text-xl font-semibold mb-2">
              Lessons in {selectedUnit.title}
            </h2>
            <p className="text-sm text-muted-foreground">
              {lessons.length} lesson{lessons.length !== 1 ? 's' : ''}
            </p>
          </div>
        )}

        {lessons.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground mb-4">No lessons yet in this unit</p>
              <Button onClick={() => setShowForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create First Lesson
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {lessons.map((lesson, index) => {
              const Icon = getLessonIcon(lesson.type)
              return (
                <Card key={lesson.id}>
                  <CardContent className="flex items-center justify-between p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Icon className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm text-muted-foreground">#{index + 1}</span>
                          <h3 className="text-lg font-semibold">{lesson.title}</h3>
                          {lesson.is_published ? (
                            <Badge variant="default">Published</Badge>
                          ) : (
                            <Badge variant="secondary">Draft</Badge>
                          )}
                          <Badge variant="outline">
                            {LESSON_TYPES.find(t => t.value === lesson.type)?.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{lesson.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          XP: {lesson.xp_reward} • Order: {lesson.order_index}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => togglePublish(lesson)}
                        title={lesson.is_published ? 'Unpublish' : 'Publish'}
                      >
                        {lesson.is_published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(lesson)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(lesson.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
