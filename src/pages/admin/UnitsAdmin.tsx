import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/database.types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Pencil, Trash2, Plus, BookOpen } from 'lucide-react'

type Course = Database['public']['Tables']['courses']['Row']
type Unit = Database['public']['Tables']['units']['Row']
type UnitInsert = Database['public']['Tables']['units']['Insert']

export function UnitsAdmin() {
  const navigate = useNavigate()
  const [courses, setCourses] = useState<Course[]>([])
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [units, setUnits] = useState<Unit[]>([])
  const [loading, setLoading] = useState(true)
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState<Partial<UnitInsert>>({
    title: '',
    description: '',
    order_index: 0,
  })

  useEffect(() => {
    fetchCourses()
  }, [])

  useEffect(() => {
    if (selectedCourse) {
      fetchUnits(selectedCourse.id)
    }
  }, [selectedCourse])

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
      alert('Failed to fetch courses')
    } finally {
      setLoading(false)
    }
  }

  const fetchUnits = async (courseId: string) => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('units')
        .select('*')
        .eq('course_id', courseId)
        .order('order_index')

      if (error) throw error
      setUnits(data || [])
    } catch (error) {
      console.error('Error fetching units:', error)
      alert('Failed to fetch units')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCourse) {
      alert('Please select a course first')
      return
    }

    try {
      const dataToSubmit = {
        ...formData,
        course_id: selectedCourse.id,
      }

      if (editingUnit) {
        const { error } = await supabase
          .from('units')
          .update(dataToSubmit)
          .eq('id', editingUnit.id)

        if (error) throw error
        alert('Unit updated successfully!')
      } else {
        const { error } = await supabase
          .from('units')
          .insert(dataToSubmit as UnitInsert)

        if (error) throw error
        alert('Unit created successfully!')
      }

      resetForm()
      fetchUnits(selectedCourse.id)
    } catch (error) {
      console.error('Error saving unit:', error)
      alert('Failed to save unit')
    }
  }

  const handleEdit = (unit: Unit) => {
    setEditingUnit(unit)
    setFormData({
      title: unit.title,
      description: unit.description,
      order_index: unit.order_index,
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this unit? This will also delete all lessons in it.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('units')
        .delete()
        .eq('id', id)

      if (error) throw error
      alert('Unit deleted successfully!')
      if (selectedCourse) {
        fetchUnits(selectedCourse.id)
      }
    } catch (error) {
      console.error('Error deleting unit:', error)
      alert('Failed to delete unit')
    }
  }

  const resetForm = () => {
    setEditingUnit(null)
    setFormData({
      title: '',
      description: '',
      order_index: 0,
    })
    setShowForm(false)
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
            <BookOpen className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No courses available</p>
            <p className="text-sm text-muted-foreground mb-4">
              Create a course first before adding units
            </p>
            <Button onClick={() => navigate('/admin/courses')}>
              Go to Courses
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
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Unit Management</h1>
          <p className="text-muted-foreground mt-1">Organize lessons into units</p>
        </div>
        <Button onClick={() => setShowForm(true)} disabled={!selectedCourse}>
          <Plus className="w-4 h-4 mr-2" />
          New Unit
        </Button>
      </div>

      {/* Course Selector */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Select Course</CardTitle>
          <CardDescription>Choose a course to manage its units</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {courses.map((course) => (
              <Button
                key={course.id}
                variant={selectedCourse?.id === course.id ? 'default' : 'outline'}
                onClick={() => setSelectedCourse(course)}
              >
                {course.title}
                {course.is_published ? ' ✓' : ' (Draft)'}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {showForm && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{editingUnit ? 'Edit Unit' : 'Create New Unit'}</CardTitle>
            <CardDescription>
              {editingUnit ? 'Update unit information' : `Add a new unit to ${selectedCourse?.title}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2 md:col-span-1">
                  <Label htmlFor="title">Unit Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Unit 1: Basics"
                    required
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

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="What will students learn in this unit?"
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit">
                  {editingUnit ? 'Update Unit' : 'Create Unit'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Units List */}
      <div className="space-y-4">
        {selectedCourse && (
          <div className="mb-4">
            <h2 className="text-xl font-semibold mb-2">
              Units for {selectedCourse.title}
            </h2>
            <p className="text-sm text-muted-foreground">
              {units.length} unit{units.length !== 1 ? 's' : ''}
            </p>
          </div>
        )}

        {units.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground mb-4">No units yet for this course</p>
              <Button onClick={() => setShowForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create First Unit
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {units.map((unit, index) => (
              <Card key={unit.id}>
                <CardContent className="flex items-center justify-between p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center font-bold text-xl">
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">{unit.title}</h3>
                      <p className="text-sm text-muted-foreground">{unit.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Order: {unit.order_index}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(unit)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(unit.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
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
