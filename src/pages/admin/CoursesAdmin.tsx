import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/database.types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Pencil, Trash2, Plus, Eye, EyeOff, Users, Camera, ImageIcon, Loader2, X } from 'lucide-react'

type Course = Database['public']['Tables']['courses']['Row']
type CourseInsert = Database['public']['Tables']['courses']['Insert']

export function CoursesAdmin() {
  const navigate = useNavigate()
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [formData, setFormData] = useState<Partial<CourseInsert>>({
    title: '',
    description: '',
    language: '',
    level: '',
    thumbnail_url: '',
    is_published: false,
    order_index: 0,
  })

  useEffect(() => {
    fetchCourses()
  }, [])

  const fetchCourses = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('order_index')

      if (error) throw error
      setCourses(data || [])
    } catch (error) {
      console.error('Error fetching courses:', error)
      alert('Failed to fetch courses')
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB')
      return
    }

    try {
      setUploadingImage(true)

      // Create unique file name
      const fileExt = file.name.split('.').pop()
      const fileName = `course-${Date.now()}.${fileExt}`

      // Delete old image if exists and we're editing
      if (formData.thumbnail_url) {
        const oldFileName = formData.thumbnail_url.split('/').pop()
        if (oldFileName) {
          await supabase.storage.from('media').remove([oldFileName])
        }
      }

      // Upload new image
      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(fileName, file, { upsert: true })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(fileName)

      setFormData({ ...formData, thumbnail_url: publicUrl })
      setPreviewUrl(publicUrl)

    } catch (error) {
      console.error('Error uploading image:', error)
      alert('Failed to upload image')
    } finally {
      setUploadingImage(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemoveImage = async () => {
    if (!formData.thumbnail_url) return

    try {
      setUploadingImage(true)

      // Extract file name from URL and delete
      const fileName = formData.thumbnail_url.split('/').pop()
      if (fileName) {
        await supabase.storage.from('media').remove([fileName])
      }

      setFormData({ ...formData, thumbnail_url: '' })
      setPreviewUrl(null)

    } catch (error) {
      console.error('Error removing image:', error)
      alert('Failed to remove image')
    } finally {
      setUploadingImage(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (editingCourse) {
        // Update existing course
        const { error } = await supabase
          .from('courses')
          .update(formData)
          .eq('id', editingCourse.id)

        if (error) throw error
        alert('Course updated successfully!')
      } else {
        // Create new course
        const { error } = await supabase
          .from('courses')
          .insert(formData as CourseInsert)

        if (error) throw error
        alert('Course created successfully!')
      }

      resetForm()
      fetchCourses()
    } catch (error) {
      console.error('Error saving course:', error)
      alert('Failed to save course')
    }
  }

  const handleEdit = (course: Course) => {
    setEditingCourse(course)
    setFormData({
      title: course.title,
      description: course.description,
      language: course.language,
      level: course.level,
      thumbnail_url: course.thumbnail_url,
      is_published: course.is_published,
      order_index: course.order_index,
    })
    setPreviewUrl(course.thumbnail_url)
    setShowForm(true)
  }

  const handleDelete = async (id: string, thumbnailUrl: string | null) => {
    if (!confirm('Are you sure you want to delete this course? This will also delete all units and lessons.')) {
      return
    }

    try {
      // Delete thumbnail image if exists
      if (thumbnailUrl) {
        const fileName = thumbnailUrl.split('/').pop()
        if (fileName) {
          await supabase.storage.from('media').remove([fileName])
        }
      }

      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', id)

      if (error) throw error
      alert('Course deleted successfully!')
      fetchCourses()
    } catch (error) {
      console.error('Error deleting course:', error)
      alert('Failed to delete course')
    }
  }

  const togglePublish = async (course: Course) => {
    try {
      const { error } = await supabase
        .from('courses')
        .update({ is_published: !course.is_published })
        .eq('id', course.id)

      if (error) throw error
      fetchCourses()
    } catch (error) {
      console.error('Error toggling publish:', error)
      alert('Failed to toggle publish status')
    }
  }

  const resetForm = () => {
    setEditingCourse(null)
    setFormData({
      title: '',
      description: '',
      language: '',
      level: '',
      thumbnail_url: '',
      is_published: false,
      order_index: 0,
    })
    setPreviewUrl(null)
    setShowForm(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading courses...</div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Course Management</h1>
          <p className="text-muted-foreground mt-1">Create and manage language courses</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Course
        </Button>
      </div>

      {showForm && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{editingCourse ? 'Edit Course' : 'Create New Course'}</CardTitle>
            <CardDescription>
              {editingCourse ? 'Update course information' : 'Add a new language course'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Thumbnail Upload Section */}
              <div className="space-y-3">
                <Label>Course Thumbnail</Label>
                <div className="flex items-start gap-4">
                  {/* Preview */}
                  <div className="relative">
                    {previewUrl || formData.thumbnail_url ? (
                      <div className="relative w-40 h-24 rounded-lg overflow-hidden border">
                        <img
                          src={previewUrl || formData.thumbnail_url || ''}
                          alt="Course thumbnail"
                          className="w-full h-full object-cover"
                        />
                        {uploadingImage && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                            <Loader2 className="w-6 h-6 text-white animate-spin" />
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="w-40 h-24 rounded-lg border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center bg-muted/30">
                        <ImageIcon className="w-8 h-8 text-muted-foreground/50 mb-1" />
                        <span className="text-xs text-muted-foreground">No image</span>
                      </div>
                    )}
                  </div>

                  {/* Upload/Remove Buttons */}
                  <div className="flex flex-col gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingImage}
                      className="gap-2"
                    >
                      {uploadingImage ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Camera className="w-4 h-4" />
                      )}
                      {formData.thumbnail_url ? 'Change Image' : 'Upload Image'}
                    </Button>

                    {formData.thumbnail_url && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleRemoveImage}
                        disabled={uploadingImage}
                        className="gap-2 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                        Remove
                      </Button>
                    )}

                    <p className="text-xs text-muted-foreground mt-1">
                      Recommended: 16:9 ratio, max 5MB
                    </p>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Course Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Spanish for Beginners"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="language">Language *</Label>
                  <Input
                    id="language"
                    value={formData.language}
                    onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                    placeholder="e.g., Spanish"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="level">Level *</Label>
                  <select
                    id="level"
                    value={formData.level}
                    onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    required
                  >
                    <option value="">Select level</option>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
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
                  placeholder="Course description..."
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  rows={3}
                />
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
                  Publish course (make visible to students)
                </Label>
              </div>

              <div className="flex gap-2">
                <Button type="submit">
                  {editingCourse ? 'Update Course' : 'Create Course'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {courses.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground mb-4">No courses yet</p>
              <Button onClick={() => setShowForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Course
              </Button>
            </CardContent>
          </Card>
        ) : (
          courses.map((course) => (
            <Card key={course.id}>
              <CardContent className="flex items-center justify-between p-6">
                <div className="flex items-center gap-4">
                  {course.thumbnail_url ? (
                    <div className="relative group">
                      <img
                        src={course.thumbnail_url}
                        alt={course.title}
                        className="w-20 h-14 rounded-lg object-cover"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-white hover:text-white hover:bg-white/20"
                          onClick={() => handleEdit(course)}
                        >
                          <Camera className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="w-20 h-14 rounded-lg bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center cursor-pointer hover:from-primary/30 hover:to-purple-500/30 transition-colors"
                      onClick={() => handleEdit(course)}
                    >
                      <ImageIcon className="w-6 h-6 text-primary/50" />
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold">{course.title}</h3>
                      {course.is_published ? (
                        <Badge variant="default">Published</Badge>
                      ) : (
                        <Badge variant="secondary">Draft</Badge>
                      )}
                      <Badge variant="outline">{course.level}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-1">{course.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Language: {course.language} • Order: {course.order_index}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/admin/course-access')}
                    title="Manage student access"
                  >
                    <Users className="w-4 h-4 mr-1" />
                    Access
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => togglePublish(course)}
                    title={course.is_published ? 'Unpublish' : 'Publish'}
                  >
                    {course.is_published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(course)}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(course.id, course.thumbnail_url)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
