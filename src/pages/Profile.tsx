import { Link } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

export function Profile() {
  const { profile } = useAuthStore()

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  const levelProgress = ((profile.xp % 100) / 100) * 100

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 bg-background z-50">
        <div className="container mx-auto px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <Link to="/dashboard">
              <Button variant="ghost" size="sm">← Back</Button>
            </Link>
            <h1 className="text-base sm:text-lg font-semibold">My Profile</h1>
            <div className="w-16"></div> {/* Spacer for centering */}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-4 sm:py-6 lg:py-8 max-w-4xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {/* Profile Card */}
          <Card className="md:col-span-1">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={profile.avatar_url || undefined} />
                  <AvatarFallback className="text-2xl">
                    {profile.full_name?.[0] || 'U'}
                  </AvatarFallback>
                </Avatar>
              </div>
              <CardTitle>{profile.full_name || 'Learner'}</CardTitle>
              <CardDescription>{profile.email}</CardDescription>
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
                    <p className="text-xl sm:text-2xl font-bold">🔥 {profile.streak_count} days</p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground">Streak Freezes</p>
                    <p className="text-xl sm:text-2xl font-bold">❄️ {profile.streak_freeze_count}</p>
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
