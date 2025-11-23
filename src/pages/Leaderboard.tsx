import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useGamificationStore } from '@/store/gamificationStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { RefreshCw } from 'lucide-react'

export function Leaderboard() {
  const { leaderboard, fetchLeaderboard } = useGamificationStore()
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchLeaderboard()

    // Subscribe to real-time changes in profiles table
    const channel = supabase
      .channel('leaderboard-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: 'role=eq.student',
        },
        () => {
          // Refresh leaderboard when any student profile changes
          fetchLeaderboard()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchLeaderboard])

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchLeaderboard()
    setTimeout(() => setRefreshing(false), 500)
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 bg-background z-50">
        <div className="container mx-auto px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <Link to="/dashboard">
              <Button variant="ghost" size="sm">← Back</Button>
            </Link>
            <h1 className="text-base sm:text-lg font-semibold">🏆 Leaderboard</h1>
            <div className="w-16"></div> {/* Spacer */}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-4 sm:py-6 lg:py-8 max-w-4xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-3">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold">Top Learners</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="w-full sm:w-auto"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <div className="mb-4 p-2 sm:p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-xs sm:text-sm text-green-800">
            🔴 Live updates enabled - Rankings update automatically
          </p>
        </div>

        <Card>
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="text-base sm:text-lg">Rankings</CardTitle>
          </CardHeader>
          <CardContent>
            {leaderboard.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-6 sm:py-8">
                No learners yet. Be the first to earn XP!
              </p>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {leaderboard.map((entry) => (
                  <div
                    key={entry.user_id}
                    className="flex items-center gap-2 sm:gap-4 p-2 sm:p-4 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    {/* Rank */}
                    <div className="flex items-center justify-center w-8 sm:w-12 h-8 sm:h-12 flex-shrink-0">
                      {entry.rank === 1 && <span className="text-2xl sm:text-3xl">🥇</span>}
                      {entry.rank === 2 && <span className="text-2xl sm:text-3xl">🥈</span>}
                      {entry.rank === 3 && <span className="text-2xl sm:text-3xl">🥉</span>}
                      {entry.rank > 3 && (
                        <span className="text-base sm:text-xl font-bold text-muted-foreground">
                          #{entry.rank}
                        </span>
                      )}
                    </div>

                    {/* Avatar */}
                    <Avatar className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0">
                      <AvatarImage src={entry.avatar_url || undefined} />
                      <AvatarFallback>
                        {entry.full_name?.[0] || 'U'}
                      </AvatarFallback>
                    </Avatar>

                    {/* Name & Level */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm sm:text-base font-semibold truncate">
                        {entry.full_name || 'Anonymous'}
                      </p>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        Level {entry.level}
                      </p>
                    </div>

                    {/* XP */}
                    <Badge variant="secondary" className="text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-1.5 flex-shrink-0">
                      {entry.xp} XP
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
