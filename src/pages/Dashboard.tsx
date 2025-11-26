import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useCourseStore } from '@/store/courseStore'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Menu, X, Flame, Trophy, Zap, Star, BookOpen, Users, LogOut, Settings } from 'lucide-react'

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
    <div className="min-h-screen page-wrapper">
      {/* Header */}
      <header className="border-b sticky top-0 header-glass z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <Link to="/profile" className="flex-shrink-0">
                <Avatar className="h-11 w-11 sm:h-12 sm:w-12 ring-2 ring-primary/20 ring-offset-2 ring-offset-background hover:ring-primary/50 transition-all cursor-pointer">
                  <AvatarImage src={profile?.avatar_url || undefined} />
                  <AvatarFallback className="text-sm sm:text-base bg-gradient-to-br from-primary to-purple-600 text-white">
                    {profile?.full_name?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
              </Link>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl font-bold truncate text-gradient">
                  Language Learning Platform
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">
                  Welcome back, {profile?.role === 'admin' ? 'Admin' : (profile?.full_name || 'Learner')}!
                </p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-1">
              <Link to="/leaderboard">
                <Button variant="ghost" size="sm" className="gap-2">
                  <Trophy className="w-4 h-4" />
                  Leaderboard
                </Button>
              </Link>
              <Link to="/social">
                <Button variant="ghost" size="sm" className="gap-2">
                  <Users className="w-4 h-4" />
                  Social
                </Button>
              </Link>
              <Link to="/profile">
                <Button variant="ghost" size="sm" className="gap-2">
                  <Settings className="w-4 h-4" />
                  Profile
                </Button>
              </Link>
              {profile?.role === 'admin' && (
                <Link to="/admin">
                  <Button variant="outline" size="sm" className="gap-2 ml-2">
                    Admin Panel
                  </Button>
                </Link>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                disabled={signingOut}
                className="gap-2 text-muted-foreground hover:text-destructive ml-2"
              >
                <LogOut className="w-4 h-4" />
                {signingOut ? 'Signing out...' : 'Sign Out'}
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden ml-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="lg:hidden mt-4 pb-4 space-y-1 animate-in">
              <Link to="/leaderboard" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start gap-3">
                  <Trophy className="w-4 h-4" />
                  Leaderboard
                </Button>
              </Link>
              <Link to="/social" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start gap-3">
                  <Users className="w-4 h-4" />
                  Social
                </Button>
              </Link>
              <Link to="/profile" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start gap-3">
                  <Settings className="w-4 h-4" />
                  Profile
                </Button>
              </Link>
              {profile?.role === 'admin' && (
                <Link to="/admin" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full justify-start gap-3">
                    Admin Panel
                  </Button>
                </Link>
              )}
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive"
                onClick={() => {
                  handleSignOut()
                  setMobileMenuOpen(false)
                }}
                disabled={signingOut}
              >
                <LogOut className="w-4 h-4" />
                {signingOut ? 'Signing out...' : 'Sign Out'}
              </Button>
            </div>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 sm:py-8 relative z-10">
        {/* Stats Bar */}
        <div className={`grid grid-cols-2 gap-4 mb-8 ${profile?.role === 'admin' ? 'md:grid-cols-3' : 'md:grid-cols-4'}`}>
          <Card className="stats-card card-hover border-0 shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                  <Zap className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <span className="text-sm font-medium text-muted-foreground">XP</span>
              </div>
              <div className="text-3xl font-bold text-gradient">{profile?.xp || 0}</div>
            </CardContent>
          </Card>

          <Card className="stats-card card-hover border-0 shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <Star className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-sm font-medium text-muted-foreground">Level</span>
              </div>
              <div className="text-3xl font-bold">{profile?.level || 1}</div>
              <Progress value={levelProgress} className="mt-2 h-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {100 - (profile?.xp || 0) % 100} XP to next
              </p>
            </CardContent>
          </Card>

          <Card className="stats-card card-hover border-0 shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                  <Flame className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
                <span className="text-sm font-medium text-muted-foreground">Streak</span>
              </div>
              <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                {profile?.streak_count || 0}
                <span className="text-lg ml-1">days</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {profile?.streak_freeze_count || 0} freezes available
              </p>
            </CardContent>
          </Card>

          {profile?.role !== 'admin' && (
            <Card className="stats-card card-hover border-0 shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                    <Trophy className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">Status</span>
                </div>
                <Badge
                  variant={
                    profile?.payment_status === 'paid' ? 'default' :
                    profile?.payment_status === 'trial' ? 'secondary' :
                    'destructive'
                  }
                  className="text-sm px-3 py-1"
                >
                  {profile?.payment_status === 'paid' ? 'Premium' :
                   profile?.payment_status === 'trial' ? 'Trial' : 'Free'}
                </Badge>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Courses Section */}
        <div>
          <h2 className="section-heading mb-6">My Courses</h2>

          {courses.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="empty-state">
                <BookOpen className="empty-state-icon" />
                <p className="text-lg text-muted-foreground mb-4">
                  No courses available yet
                </p>
                {profile?.role === 'admin' && (
                  <Link to="/admin">
                    <Button className="gap-2">
                      <BookOpen className="w-4 h-4" />
                      Create Your First Course
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {courses.map((course, index) => (
                <Link
                  key={course.id}
                  to={`/course/${course.id}`}
                  className="animate-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <Card className="course-card h-full">
                    {course.thumbnail_url ? (
                      <div className="aspect-video bg-muted overflow-hidden">
                        <img
                          src={course.thumbnail_url}
                          alt={course.title}
                          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                        />
                      </div>
                    ) : (
                      <div className="aspect-video bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center">
                        <BookOpen className="w-12 h-12 text-primary/50" />
                      </div>
                    )}
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-lg line-clamp-1">{course.title}</CardTitle>
                        <Badge variant="outline" className="flex-shrink-0">{course.level}</Badge>
                      </div>
                      <CardDescription className="line-clamp-2 mt-1">
                        {course.description || 'Start your learning journey'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-muted">
                          <span>🌍</span>
                          <span>{course.language}</span>
                        </span>
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
