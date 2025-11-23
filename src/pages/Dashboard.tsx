import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useCourseStore } from '@/store/courseStore'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Menu, X } from 'lucide-react'

export function Dashboard() {
  const { profile, signOut } = useAuthStore()
  const { courses, fetchCourses } = useCourseStore()
  const [signingOut, setSigningOut] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    fetchCourses()
  }, [fetchCourses])

  const handleSignOut = async () => {
    setSigningOut(true)
    try {
      await signOut()
    } catch (error) {
      console.error('Sign out error:', error)
      setSigningOut(false)
    }
  }

  const levelProgress = profile ? ((profile.xp % 100) / 100) * 100 : 0

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b sticky top-0 bg-background z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-2xl font-bold truncate">Language Learning Platform</h1>
              <p className="text-xs sm:text-sm text-muted-foreground truncate">Welcome back, {profile?.full_name || 'Learner'}!</p>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-2">
              <Link to="/leaderboard">
                <Button variant="ghost" size="sm">Leaderboard</Button>
              </Link>
              <Link to="/social">
                <Button variant="ghost" size="sm">Social</Button>
              </Link>
              <Link to="/profile">
                <Button variant="ghost" size="sm">Profile</Button>
              </Link>
              {profile?.role === 'admin' && (
                <Link to="/admin">
                  <Button variant="outline" size="sm">Admin Panel</Button>
                </Link>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                disabled={signingOut}
              >
                {signingOut ? 'Signing out...' : 'Sign Out'}
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden ml-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="lg:hidden mt-4 pb-4 space-y-2">
              <Link to="/leaderboard" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start">Leaderboard</Button>
              </Link>
              <Link to="/social" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start">Social</Button>
              </Link>
              <Link to="/profile" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start">Profile</Button>
              </Link>
              {profile?.role === 'admin' && (
                <Link to="/admin" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full justify-start">Admin Panel</Button>
                </Link>
              )}
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => {
                  handleSignOut()
                  setMobileMenuOpen(false)
                }}
                disabled={signingOut}
              >
                {signingOut ? 'Signing out...' : 'Sign Out'}
              </Button>
            </div>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-4 sm:py-8">
        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">XP</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{profile?.xp || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Level</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{profile?.level || 1}</div>
              <Progress value={levelProgress} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Streak</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">🔥 {profile?.streak_count || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {profile?.streak_freeze_count || 0} freezes left
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Status</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge
                variant={
                  profile?.payment_status === 'paid' ? 'default' :
                  profile?.payment_status === 'trial' ? 'secondary' :
                  'destructive'
                }
                className="text-sm"
              >
                {profile?.payment_status || 'trial'}
              </Badge>
            </CardContent>
          </Card>
        </div>

        {/* Courses Section */}
        <div>
          <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">My Courses</h2>

          {courses.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8 sm:py-12 px-4">
                <p className="text-base sm:text-lg text-muted-foreground mb-4 text-center">
                  No courses available yet
                </p>
                {profile?.role === 'admin' && (
                  <Link to="/admin">
                    <Button size="sm">Create Your First Course</Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {courses.map((course) => (
                <Link key={course.id} to={`/course/${course.id}`}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                    {course.thumbnail_url && (
                      <div className="aspect-video bg-muted overflow-hidden rounded-t-lg">
                        <img
                          src={course.thumbnail_url}
                          alt={course.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-lg">{course.title}</CardTitle>
                        <Badge variant="outline">{course.level}</Badge>
                      </div>
                      <CardDescription className="line-clamp-2">
                        {course.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>🌍</span>
                        <span>{course.language}</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
