import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/database.types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Search, UserCog, Clock, UserCheck, UserX } from 'lucide-react'

type Profile = Database['public']['Tables']['profiles']['Row']

export function StudentsAdmin() {
  const [students, setStudents] = useState<Profile[]>([])
  const [filteredStudents, setFilteredStudents] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStudent, setSelectedStudent] = useState<Profile | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editFormData, setEditFormData] = useState({
    payment_status: 'trial' as 'paid' | 'unpaid' | 'trial',
    trial_end_date: '',
    login_enabled: false,
  })

  useEffect(() => {
    fetchStudents()
  }, [])

  useEffect(() => {
    if (searchTerm) {
      const filtered = students.filter(student =>
        student.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredStudents(filtered)
    } else {
      setFilteredStudents(students)
    }
  }, [searchTerm, students])

  const fetchStudents = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'student')
        .order('created_at', { ascending: false })

      if (error) throw error
      setStudents(data || [])
      setFilteredStudents(data || [])
    } catch (error) {
      console.error('Error fetching students:', error)
      alert('Failed to fetch students')
    } finally {
      setLoading(false)
    }
  }

  const handleEditClick = (student: Profile) => {
    setSelectedStudent(student)
    setEditFormData({
      payment_status: student.payment_status || 'trial',
      trial_end_date: student.trial_end_date ? new Date(student.trial_end_date).toISOString().split('T')[0] : '',
      login_enabled: student.login_enabled || false,
    })
    setShowEditModal(true)
  }

  const handleUpdateStudent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedStudent) return

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          payment_status: editFormData.payment_status,
          trial_end_date: editFormData.trial_end_date || null,
          login_enabled: editFormData.login_enabled,
        })
        .eq('id', selectedStudent.id)

      if (error) throw error
      alert('Student updated successfully!')
      setShowEditModal(false)
      fetchStudents()
    } catch (error) {
      console.error('Error updating student:', error)
      alert('Failed to update student')
    }
  }

  const extendTrial = async (studentId: string, days: number) => {
    try {
      const { data: student } = await supabase
        .from('profiles')
        .select('trial_end_date')
        .eq('id', studentId)
        .single()

      if (!student) return

      const currentEndDate = student.trial_end_date ? new Date(student.trial_end_date) : new Date()
      currentEndDate.setDate(currentEndDate.getDate() + days)

      const { error } = await supabase
        .from('profiles')
        .update({ trial_end_date: currentEndDate.toISOString() })
        .eq('id', studentId)

      if (error) throw error
      alert(`Trial extended by ${days} days!`)
      fetchStudents()
    } catch (error) {
      console.error('Error extending trial:', error)
      alert('Failed to extend trial')
    }
  }

  const toggleLoginAccess = async (studentId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ login_enabled: !currentStatus })
        .eq('id', studentId)

      if (error) throw error
      alert(currentStatus ? 'Login access revoked' : 'Login access granted')
      fetchStudents()
    } catch (error) {
      console.error('Error toggling login access:', error)
      alert('Failed to update login access')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge variant="default">Paid</Badge>
      case 'unpaid':
        return <Badge variant="destructive">Unpaid</Badge>
      case 'trial':
        return <Badge variant="secondary">Trial</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const isTrialExpired = (trialEndDate: string | null) => {
    if (!trialEndDate) return false
    return new Date(trialEndDate) < new Date()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading students...</div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Student Management</h1>
          <p className="text-muted-foreground mt-1">Manage student accounts and payments</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold">{students.length}</div>
          <div className="text-sm text-muted-foreground">Total Students</div>
        </div>
      </div>

      {/* Search Bar */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-5 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold mb-1 text-green-600">
              {students.filter(s => s.login_enabled).length}
            </div>
            <p className="text-sm text-muted-foreground">Login Enabled</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold mb-1">
              {students.filter(s => s.payment_status === 'paid').length}
            </div>
            <p className="text-sm text-muted-foreground">Paid Students</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold mb-1">
              {students.filter(s => s.payment_status === 'trial').length}
            </div>
            <p className="text-sm text-muted-foreground">Trial Users</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold mb-1">
              {students.filter(s => s.payment_status === 'unpaid').length}
            </div>
            <p className="text-sm text-muted-foreground">Unpaid</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold mb-1">
              {students.filter(s => isTrialExpired(s.trial_end_date)).length}
            </div>
            <p className="text-sm text-muted-foreground">Expired Trials</p>
          </CardContent>
        </Card>
      </div>

      {/* Students List */}
      <div className="space-y-4">
        {filteredStudents.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">
                {searchTerm ? 'No students found matching your search' : 'No students yet'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredStudents.map((student) => (
            <Card key={student.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={student.avatar_url || undefined} />
                      <AvatarFallback>
                        {student.full_name?.[0]?.toUpperCase() || student.email[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{student.full_name || 'Unnamed User'}</h3>
                        {getStatusBadge(student.payment_status || 'trial')}
                        {student.trial_end_date && isTrialExpired(student.trial_end_date) && (
                          <Badge variant="destructive">Expired</Badge>
                        )}
                        {student.login_enabled ? (
                          <Badge variant="default" className="bg-green-600">
                            <UserCheck className="w-3 h-3 mr-1" />
                            Login Enabled
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <UserX className="w-3 h-3 mr-1" />
                            Login Disabled
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">{student.email}</p>
                      <div className="flex gap-4 text-xs text-muted-foreground">
                        <span>Level {student.level}</span>
                        <span>{student.xp} XP</span>
                        <span>{student.streak_count} day streak</span>
                        {student.trial_end_date && (
                          <span>
                            Trial ends: {new Date(student.trial_end_date).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant={student.login_enabled ? "outline" : "default"}
                      size="sm"
                      onClick={() => toggleLoginAccess(student.id, student.login_enabled)}
                      className={student.login_enabled ? "" : "bg-green-600 hover:bg-green-700"}
                    >
                      {student.login_enabled ? (
                        <>
                          <UserX className="w-4 h-4 mr-2" />
                          Revoke Access
                        </>
                      ) : (
                        <>
                          <UserCheck className="w-4 h-4 mr-2" />
                          Grant Access
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditClick(student)}
                    >
                      <UserCog className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    {student.payment_status === 'trial' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => extendTrial(student.id, 7)}
                      >
                        <Clock className="w-4 h-4 mr-2" />
                        +7 Days
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && selectedStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Edit Student: {selectedStudent.full_name || selectedStudent.email}</CardTitle>
              <CardDescription>Update student payment and trial information</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateStudent} className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 p-4 border rounded-md bg-muted/50">
                    <input
                      type="checkbox"
                      id="login_enabled"
                      checked={editFormData.login_enabled}
                      onChange={(e) => setEditFormData({ ...editFormData, login_enabled: e.target.checked })}
                      className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                    />
                    <Label htmlFor="login_enabled" className="cursor-pointer flex-1">
                      <div className="font-semibold">Enable Login Access</div>
                      <div className="text-xs text-muted-foreground">
                        Allow this student to login to the application
                      </div>
                    </Label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="payment_status">Payment Status</Label>
                  <select
                    id="payment_status"
                    value={editFormData.payment_status}
                    onChange={(e) => setEditFormData({ ...editFormData, payment_status: e.target.value as any })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="trial">Trial</option>
                    <option value="paid">Paid</option>
                    <option value="unpaid">Unpaid</option>
                  </select>
                </div>

                {editFormData.payment_status === 'trial' && (
                  <div className="space-y-2">
                    <Label htmlFor="trial_end_date">Trial End Date</Label>
                    <Input
                      id="trial_end_date"
                      type="date"
                      value={editFormData.trial_end_date}
                      onChange={(e) => setEditFormData({ ...editFormData, trial_end_date: e.target.value })}
                    />
                  </div>
                )}

                <div className="flex gap-2">
                  <Button type="submit">Update Student</Button>
                  <Button type="button" variant="outline" onClick={() => setShowEditModal(false)}>
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
