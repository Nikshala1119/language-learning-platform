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
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/dashboard">
              <Button variant="ghost">← Back to Dashboard</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">🏆 Leaderboard</h1>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800">
            🔴 Live updates enabled - Rankings update automatically
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Top Learners</CardTitle>
          </CardHeader>
          <CardContent>
            {leaderboard.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No learners yet. Be the first to earn XP!
              </p>
            ) : (
              <div className="space-y-4">
                {leaderboard.map((entry) => (
                  <div
                    key={entry.user_id}
                    className="flex items-center gap-4 p-4 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    {/* Rank */}
                    <div className="flex items-center justify-center w-12 h-12">
                      {entry.rank === 1 && <span className="text-3xl">🥇</span>}
                      {entry.rank === 2 && <span className="text-3xl">🥈</span>}
                      {entry.rank === 3 && <span className="text-3xl">🥉</span>}
                      {entry.rank > 3 && (
                        <span className="text-xl font-bold text-muted-foreground">
                          #{entry.rank}
                        </span>
                      )}
                    </div>

                    {/* Avatar */}
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={entry.avatar_url || undefined} />
                      <AvatarFallback>
                        {entry.full_name?.[0] || 'U'}
                      </AvatarFallback>
                    </Avatar>

                    {/* Name & Level */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">
                        {entry.full_name || 'Anonymous'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Level {entry.level}
                      </p>
                    </div>

                    {/* XP */}
                    <Badge variant="secondary" className="text-base px-4 py-2">
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
