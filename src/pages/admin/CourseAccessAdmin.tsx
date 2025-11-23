import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/database.types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Search, UserPlus, X, Check, Calendar, Users } from 'lucide-react'

type CourseAccessOverview = Database['public']['Views']['course_access_overview']['Row']
type Profile = Database['public']['Tables']['profiles']['Row']
type Course = Database['public']['Tables']['courses']['Row']

export function CourseAccessAdmin() {
  const [accessGrants, setAccessGrants] = useState<CourseAccessOverview[]>([])
  const [filteredGrants, setFilteredGrants] = useState<CourseAccessOverview[]>([])
  const [students, setStudents] = useState<Profile[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showGrantModal, setShowGrantModal] = useState(false)
  const [grantFormData, setGrantFormData] = useState({
    selectedStudents: [] as string[],
    selectedCourse: '',
    expiresAt: '',
  })

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (searchTerm) {
      const filtered = accessGrants.filter(grant =>
        grant.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        grant.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        grant.course_title?.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredGrants(filtered)
    } else {
      setFilteredGrants(accessGrants)
    }
  }, [searchTerm, accessGrants])

  const fetchData = async () => {
    try {
      setLoading(true)

      const [accessData, studentsData, coursesData] = await Promise.all([
        supabase.from('course_access_overview').select('*'),
        supabase.from('profiles').select('*').eq('role', 'student').order('created_at', { ascending: false }),
        supabase.from('courses').select('*').order('order_index'),
      ])

      if (accessData.error) throw accessData.error
      if (studentsData.error) throw studentsData.error
      if (coursesData.error) throw coursesData.error

      setAccessGrants(accessData.data || [])
      setFilteredGrants(accessData.data || [])
      setStudents(studentsData.data || [])
      setCourses(coursesData.data || [])
    } catch (error) {
      console.error('Error fetching data:', error)
      alert('Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }

  const handleGrantAccess = async (e: React.FormEvent) => {
    e.preventDefault()

    if (grantFormData.selectedStudents.length === 0 || !grantFormData.selectedCourse) {
      alert('Please select at least one student and a course')
      return
    }

    try {
      const { data, error } = await supabase.rpc('grant_course_access_bulk', {
        p_user_ids: grantFormData.selectedStudents,
        p_course_id: grantFormData.selectedCourse,
        p_expires_at: grantFormData.expiresAt || null,
      })

      if (error) throw error

      alert(`Successfully granted access to ${data} student(s)!`)
      setShowGrantModal(false)
      setGrantFormData({
        selectedStudents: [],
        selectedCourse: '',
        expiresAt: '',
      })
      fetchData()
    } catch (error) {
      console.error('Error granting access:', error)
      alert('Failed to grant access. Make sure you are logged in as an admin.')
    }
  }

  const handleRevokeAccess = async (userId: string, courseId: string, userName: string, courseName: string) => {
    if (!confirm(`Are you sure you want to revoke ${userName}'s access to "${courseName}"?`)) {
      return
    }

    try {
      const { data, error } = await supabase.rpc('revoke_course_access', {
        p_user_id: userId,
        p_course_id: courseId,
      })

      if (error) throw error

      alert('Access revoked successfully!')
      fetchData()
    } catch (error) {
      console.error('Error revoking access:', error)
      alert('Failed to revoke access')
    }
  }

  const toggleStudentSelection = (studentId: string) => {
    setGrantFormData(prev => ({
      ...prev,
      selectedStudents: prev.selectedStudents.includes(studentId)
        ? prev.selectedStudents.filter(id => id !== studentId)
        : [...prev.selectedStudents, studentId]
    }))
  }

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-600">Active</Badge>
      case 'expired':
        return <Badge variant="destructive">Expired</Badge>
      case 'permanent':
        return <Badge variant="secondary">Permanent</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const getStatusCounts = () => {
    const active = accessGrants.filter(g => g.access_status === 'active').length
    const permanent = accessGrants.filter(g => g.access_status === 'permanent').length
    const expired = accessGrants.filter(g => g.access_status === 'expired').length
    return { active, permanent, expired, total: accessGrants.length }
  }

  const counts = getStatusCounts()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading course access data...</div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Course Access Management</h1>
          <p className="text-muted-foreground mt-1">Control which students can access which courses</p>
        </div>
        <Button onClick={() => setShowGrantModal(true)}>
          <UserPlus className="w-4 h-4 mr-2" />
          Grant Access
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold mb-1">{counts.total}</div>
            <p className="text-sm text-muted-foreground">Total Access Grants</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold mb-1 text-green-600">{counts.active}</div>
            <p className="text-sm text-muted-foreground">Active (Time-limited)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold mb-1">{counts.permanent}</div>
            <p className="text-sm text-muted-foreground">Permanent</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold mb-1 text-red-600">{counts.expired}</div>
            <p className="text-sm text-muted-foreground">Expired</p>
          </CardContent>
        </Card>
      </div>

      {/* Search Bar */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by student name, email, or course..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Access Grants List */}
      <div className="space-y-4">
        {filteredGrants.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                {searchTerm ? 'No access grants found matching your search' : 'No course access grants yet'}
              </p>
              <Button onClick={() => setShowGrantModal(true)}>
                <UserPlus className="w-4 h-4 mr-2" />
                Grant Your First Access
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredGrants.map((grant) => (
            <Card key={grant.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <Avatar className="w-12 h-12">
                      <AvatarFallback>
                        {grant.user_name?.[0]?.toUpperCase() || grant.user_email?.[0]?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{grant.user_name || 'Unnamed User'}</h3>
                        <span className="text-muted-foreground">→</span>
                        <span className="font-medium text-primary">{grant.course_title}</span>
                        {getStatusBadge(grant.access_status)}
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">{grant.user_email}</p>
                      <div className="flex gap-4 text-xs text-muted-foreground">
                        {grant.granted_at && (
                          <span>
                            Granted: {new Date(grant.granted_at).toLocaleDateString()}
                          </span>
                        )}
                        {grant.expires_at && (
                          <span className={grant.access_status === 'expired' ? 'text-red-600' : ''}>
                            <Calendar className="w-3 h-3 inline mr-1" />
                            Expires: {new Date(grant.expires_at).toLocaleDateString()}
                          </span>
                        )}
                        {grant.granted_by_name && (
                          <span>
                            By: {grant.granted_by_name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRevokeAccess(
                      grant.user_id!,
                      grant.course_id!,
                      grant.user_name || grant.user_email || 'User',
                      grant.course_title || 'Course'
                    )}
                    className="text-destructive hover:text-destructive"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Revoke
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Grant Access Modal */}
      {showGrantModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Grant Course Access</CardTitle>
              <CardDescription>
                Select students and a course to grant access
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleGrantAccess} className="space-y-6">
                {/* Course Selection */}
                <div className="space-y-2">
                  <Label htmlFor="course">Select Course *</Label>
                  <select
                    id="course"
                    value={grantFormData.selectedCourse}
                    onChange={(e) => setGrantFormData({ ...grantFormData, selectedCourse: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    required
                  >
                    <option value="">Choose a course...</option>
                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.title} ({course.language} - {course.level})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Expiration Date */}
                <div className="space-y-2">
                  <Label htmlFor="expiresAt">Expiration Date (Optional)</Label>
                  <Input
                    id="expiresAt"
                    type="date"
                    value={grantFormData.expiresAt}
                    onChange={(e) => setGrantFormData({ ...grantFormData, expiresAt: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave empty for permanent access
                  </p>
                </div>

                {/* Student Selection */}
                <div className="space-y-2">
                  <Label>Select Students * ({grantFormData.selectedStudents.length} selected)</Label>
                  <div className="border rounded-md p-4 max-h-64 overflow-y-auto space-y-2">
                    {students.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No students found
                      </p>
                    ) : (
                      students.map((student) => (
                        <div
                          key={student.id}
                          className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                            grantFormData.selectedStudents.includes(student.id)
                              ? 'bg-primary/10 border-primary'
                              : 'hover:bg-muted'
                          }`}
                          onClick={() => toggleStudentSelection(student.id)}
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={student.avatar_url || undefined} />
                              <AvatarFallback>
                                {student.full_name?.[0]?.toUpperCase() || student.email[0].toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium text-sm">
                                {student.full_name || 'Unnamed User'}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {student.email}
                              </div>
                            </div>
                          </div>
                          {grantFormData.selectedStudents.includes(student.id) && (
                            <Check className="w-5 h-5 text-primary" />
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={grantFormData.selectedStudents.length === 0 || !grantFormData.selectedCourse}>
                    Grant Access to {grantFormData.selectedStudents.length} Student(s)
                  </Button>
                  <Button type="button" variant="outline" onClick={() => {
                    setShowGrantModal(false)
                    setGrantFormData({
                      selectedStudents: [],
                      selectedCourse: '',
                      expiresAt: '',
                    })
                  }}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
