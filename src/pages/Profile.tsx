import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Camera, Pencil, Trash2, X, Check, Loader2 } from 'lucide-react'

export function Profile() {
  const { profile, updateProfile, fetchProfile } = useAuthStore()
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    phone_number: profile?.phone_number || '',
  })

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  const levelProgress = ((profile.xp % 100) / 100) * 100

  const handleEditClick = () => {
    setFormData({
      full_name: profile.full_name || '',
      phone_number: profile.phone_number || '',
    })
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setFormData({
      full_name: profile.full_name || '',
      phone_number: profile.phone_number || '',
    })
    setIsEditing(false)
  }

  const handleSaveProfile = async () => {
    try {
      setSaving(true)
      await updateProfile({
        full_name: formData.full_name || null,
        phone_number: formData.phone_number || null,
      })
      setIsEditing(false)
    } catch (error) {
      console.error('Error saving profile:', error)
      alert('Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB')
      return
    }

    try {
      setUploadingPhoto(true)

      // Create unique file name
      const fileExt = file.name.split('.').pop()
      const fileName = `${profile.id}-${Date.now()}.${fileExt}`

      // Delete old avatar if exists
      if (profile.avatar_url) {
        const oldFileName = profile.avatar_url.split('/').pop()
        if (oldFileName) {
          await supabase.storage.from('avatars').remove([oldFileName])
        }
      }

      // Upload new avatar
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)

      // Update profile with new avatar URL
      await updateProfile({ avatar_url: publicUrl })
      await fetchProfile()

    } catch (error) {
      console.error('Error uploading photo:', error)
      alert('Failed to upload photo')
    } finally {
      setUploadingPhoto(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemovePhoto = async () => {
    if (!profile.avatar_url) return

    if (!confirm('Are you sure you want to remove your profile photo?')) return

    try {
      setUploadingPhoto(true)

      // Extract file path from URL and delete from storage
      const urlParts = profile.avatar_url.split('/')
      const fileName = urlParts[urlParts.length - 1]
      if (fileName) {
        await supabase.storage.from('avatars').remove([fileName])
      }

      // Update profile to remove avatar URL
      await updateProfile({ avatar_url: null })
      await fetchProfile()

    } catch (error) {
      console.error('Error removing photo:', error)
      alert('Failed to remove photo')
    } finally {
      setUploadingPhoto(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 bg-background z-50">
        <div className="container mx-auto px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <Link to="/dashboard">
              <Button variant="ghost" size="sm">← Back</Button>
            </Link>
            <h1 className="text-base sm:text-lg font-semibold">My Profile</h1>
            <div className="w-16"></div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-4 sm:py-6 lg:py-8 max-w-4xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {/* Profile Card */}
          <Card className="md:col-span-1">
            <CardHeader className="text-center">
              {/* Avatar with upload/remove options */}
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={profile.avatar_url || undefined} />
                    <AvatarFallback className="text-2xl">
                      {profile.full_name?.[0] || 'U'}
                    </AvatarFallback>
                  </Avatar>

                  {uploadingPhoto && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                      <Loader2 className="w-6 h-6 text-white animate-spin" />
                    </div>
                  )}

                  {/* Photo action buttons */}
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-8 w-8 rounded-full shadow-md"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingPhoto}
                    >
                      <Camera className="h-4 w-4" />
                    </Button>
                    {profile.avatar_url && (
                      <Button
                        variant="destructive"
                        size="icon"
                        className="h-8 w-8 rounded-full shadow-md"
                        onClick={handleRemovePhoto}
                        disabled={uploadingPhoto}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoUpload}
                  />
                </div>
              </div>

              {/* Editable Name and Contact Info */}
              {isEditing ? (
                <div className="space-y-4 text-left">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      placeholder="Enter your name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone_number">Phone Number</Label>
                    <Input
                      id="phone_number"
                      value={formData.phone_number}
                      onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                      placeholder="Enter your phone number"
                      type="tel"
                    />
                  </div>
                  <div className="flex gap-2 justify-center pt-2">
                    <Button
                      size="sm"
                      onClick={handleSaveProfile}
                      disabled={saving}
                    >
                      {saving ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Check className="h-4 w-4 mr-2" />
                      )}
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCancelEdit}
                      disabled={saving}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-center gap-2">
                    <CardTitle>{profile.full_name || 'Learner'}</CardTitle>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={handleEditClick}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>
                  <CardDescription>{profile.email}</CardDescription>
                  {profile.phone_number && (
                    <CardDescription className="mt-1">
                      {profile.phone_number}
                    </CardDescription>
                  )}
                  <div className="mt-4">
                    <Badge
                      variant={
                        profile.payment_status === 'paid' ? 'default' :
                        profile.payment_status === 'trial' ? 'secondary' :
                        'destructive'
                      }
                    >
                      {profile.payment_status}
                    </Badge>
                  </div>
                </>
              )}
            </CardHeader>
          </Card>

          {/* Stats */}
          <div className="md:col-span-2 space-y-4 sm:space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">Progress Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Level {profile.level}</span>
                    <span className="text-sm text-muted-foreground">
                      {profile.xp} XP
                    </span>
                  </div>
                  <Progress value={levelProgress} />
                  <p className="text-xs text-muted-foreground mt-1">
                    {100 - (profile.xp % 100)} XP to next level
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground">Current Streak</p>
                    <p className="text-xl sm:text-2xl font-bold">{profile.streak_count} days</p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground">Streak Freezes</p>
                    <p className="text-xl sm:text-2xl font-bold">{profile.streak_freeze_count}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Last Activity</p>
                  <p className="font-medium">
                    {profile.last_activity_date
                      ? new Date(profile.last_activity_date).toLocaleDateString()
                      : 'Never'}
                  </p>
                </div>

                {profile.role === 'admin' && (
                  <Badge variant="outline">Admin Access</Badge>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">Achievements</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Complete lessons and challenges to earn badges!
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-center text-sm text-muted-foreground py-6 sm:py-8">
                  No achievements yet. Start learning to unlock them!
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
