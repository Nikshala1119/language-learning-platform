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
import {
  Camera,
  Pencil,
  Trash2,
  X,
  Check,
  Loader2,
  ArrowLeft,
  Flame,
  Star,
  Zap,
  Calendar,
  Mail,
  Phone,
  Award,
  Shield,
} from 'lucide-react'

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

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB')
      return
    }

    try {
      setUploadingPhoto(true)

      const fileExt = file.name.split('.').pop()
      const fileName = `${profile.id}-${Date.now()}.${fileExt}`

      if (profile.avatar_url) {
        const oldFileName = profile.avatar_url.split('/').pop()
        if (oldFileName) {
          await supabase.storage.from('avatars').remove([oldFileName])
        }
      }

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)

      await updateProfile({ avatar_url: publicUrl })
      await fetchProfile()

    } catch (error) {
      console.error('Error uploading photo:', error)
      alert('Failed to upload photo')
    } finally {
      setUploadingPhoto(false)
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

      const urlParts = profile.avatar_url.split('/')
      const fileName = urlParts[urlParts.length - 1]
      if (fileName) {
        await supabase.storage.from('avatars').remove([fileName])
      }

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
    <div className="min-h-screen page-wrapper">
      <header className="border-b sticky top-0 header-glass z-50">
        <div className="container mx-auto px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <Link to="/dashboard">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
            </Link>
            <h1 className="text-base sm:text-lg font-semibold">My Profile</h1>
            <div className="w-20"></div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 sm:py-8 max-w-4xl relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <Card className="lg:col-span-1 border-0 shadow-lg overflow-hidden">
            {/* Gradient Header Background */}
            <div className="h-24 bg-gradient-to-br from-primary via-purple-500 to-pink-500"></div>

            <CardHeader className="text-center -mt-12 pb-4">
              {/* Avatar with upload/remove options */}
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <Avatar className="h-24 w-24 ring-4 ring-background shadow-xl">
                    <AvatarImage src={profile.avatar_url || undefined} />
                    <AvatarFallback className="text-2xl bg-gradient-to-br from-primary to-purple-600 text-white">
                      {profile.full_name?.[0] || 'U'}
                    </AvatarFallback>
                  </Avatar>

                  {uploadingPhoto && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                      <Loader2 className="w-6 h-6 text-white animate-spin" />
                    </div>
                  )}

                  {/* Photo action buttons */}
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex gap-1">
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-8 w-8 rounded-full shadow-lg hover:scale-110 transition-transform"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingPhoto}
                    >
                      <Camera className="h-4 w-4" />
                    </Button>
                    {profile.avatar_url && (
                      <Button
                        variant="destructive"
                        size="icon"
                        className="h-8 w-8 rounded-full shadow-lg hover:scale-110 transition-transform"
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
                <div className="space-y-4 text-left px-2">
                  <div className="space-y-2">
                    <Label htmlFor="full_name" className="text-xs uppercase tracking-wide text-muted-foreground">
                      Full Name
                    </Label>
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      placeholder="Enter your name"
                      className="text-center"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone_number" className="text-xs uppercase tracking-wide text-muted-foreground">
                      Phone Number
                    </Label>
                    <Input
                      id="phone_number"
                      value={formData.phone_number}
                      onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                      placeholder="Enter your phone number"
                      type="tel"
                      className="text-center"
                    />
                  </div>
                  <div className="flex gap-2 justify-center pt-2">
                    <Button
                      size="sm"
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className="gap-2"
                    >
                      {saving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCancelEdit}
                      disabled={saving}
                      className="gap-2"
                    >
                      <X className="h-4 w-4" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-center gap-2 mt-2">
                    <CardTitle className="text-xl">{profile.full_name || 'Learner'}</CardTitle>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 hover:bg-primary/10"
                      onClick={handleEditClick}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-2 mt-3">
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      <span>{profile.email}</span>
                    </div>
                    {profile.phone_number && (
                      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        <span>{profile.phone_number}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-center gap-2 mt-4">
                    <Badge
                      variant={
                        profile.payment_status === 'paid' ? 'default' :
                        profile.payment_status === 'trial' ? 'secondary' :
                        'destructive'
                      }
                      className="px-3 py-1"
                    >
                      {profile.payment_status === 'paid' ? 'Premium' :
                       profile.payment_status === 'trial' ? 'Trial' : 'Free'}
                    </Badge>
                    {profile.role === 'admin' && (
                      <Badge variant="outline" className="px-3 py-1 gap-1">
                        <Shield className="w-3 h-3" />
                        Admin
                      </Badge>
                    )}
                  </div>
                </>
              )}
            </CardHeader>
          </Card>

          {/* Stats */}
          <div className="lg:col-span-2 space-y-6">
            {/* Progress Stats */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Zap className="w-5 h-5 text-primary" />
                  Progress Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Level Progress */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30">
                  <div className="flex justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Star className="w-5 h-5 text-blue-600" />
                      <span className="font-semibold">Level {profile.level}</span>
                    </div>
                    <span className="text-sm text-muted-foreground font-medium">
                      {profile.xp} XP
                    </span>
                  </div>
                  <Progress value={levelProgress} className="h-3" />
                  <p className="text-xs text-muted-foreground mt-2 text-right">
                    {100 - (profile.xp % 100)} XP to level {profile.level + 1}
                  </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-orange-50 dark:bg-orange-950/30">
                    <div className="flex items-center gap-2 mb-2">
                      <Flame className="w-5 h-5 text-orange-600" />
                      <span className="text-sm text-muted-foreground">Current Streak</span>
                    </div>
                    <p className="text-3xl font-bold text-orange-600">
                      {profile.streak_count}
                      <span className="text-lg ml-1">days</span>
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-cyan-50 dark:bg-cyan-950/30">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">❄️</span>
                      <span className="text-sm text-muted-foreground">Streak Freezes</span>
                    </div>
                    <p className="text-3xl font-bold text-cyan-600">
                      {profile.streak_freeze_count}
                    </p>
                  </div>
                </div>

                {/* Last Activity */}
                <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50">
                  <Calendar className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Last Activity</p>
                    <p className="font-medium">
                      {profile.last_activity_date
                        ? new Date(profile.last_activity_date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })
                        : 'No activity yet'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Achievements */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Award className="w-5 h-5 text-yellow-500" />
                  Achievements
                </CardTitle>
                <CardDescription>
                  Complete lessons and challenges to earn badges!
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="empty-state py-8">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <Award className="w-8 h-8 text-muted-foreground/50" />
                  </div>
                  <p className="text-muted-foreground">
                    No achievements yet. Start learning to unlock them!
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
