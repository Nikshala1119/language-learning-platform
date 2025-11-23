import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import type { Database } from '@/lib/database.types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Users, UserPlus, Search, Award, TrendingUp, Trophy, Flame } from 'lucide-react'

type Profile = Database['public']['Tables']['profiles']['Row']
type Friendship = Database['public']['Tables']['friendships']['Row']
type ActivityFeed = Database['public']['Tables']['activity_feed']['Row']

interface FriendWithProfile extends Friendship {
  friend_profile: Profile
}

interface ActivityWithProfile extends ActivityFeed {
  user_profile: Profile
}

export function Social() {
  const { user, profile } = useAuthStore()
  const [friends, setFriends] = useState<FriendWithProfile[]>([])
  const [pendingRequests, setPendingRequests] = useState<FriendWithProfile[]>([])
  const [activityFeed, setActivityFeed] = useState<ActivityWithProfile[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchFriends()
      fetchActivityFeed()
    }
  }, [user])

  const fetchFriends = async () => {
    if (!user) return

    try {
      // Get accepted friends
      const { data: friendsData, error: friendsError } = await supabase
        .from('friendships')
        .select('*, friend_profile:profiles!friendships_friend_id_fkey(*)')
        .eq('user_id', user.id)
        .eq('status', 'accepted')

      if (friendsError) throw friendsError

      // Get pending requests (incoming)
      const { data: pendingData, error: pendingError } = await supabase
        .from('friendships')
        .select('*, friend_profile:profiles!friendships_user_id_fkey(*)')
        .eq('friend_id', user.id)
        .eq('status', 'pending')

      if (pendingError) throw pendingError

      setFriends(friendsData as any || [])
      setPendingRequests(pendingData as any || [])
    } catch (error) {
      console.error('Error fetching friends:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchActivityFeed = async () => {
    if (!user) return

    try {
      // Get public activities and friend activities
      const { data, error } = await supabase
        .from('activity_feed')
        .select('*, user_profile:profiles(*)')
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      setActivityFeed(data as any || [])

      // Subscribe to real-time updates
      const channel = supabase
        .channel('activity-feed')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'activity_feed',
          },
          () => {
            fetchActivityFeed()
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    } catch (error) {
      console.error('Error fetching activity feed:', error)
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'student')
        .neq('id', user?.id || '')
        .or(`full_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
        .limit(10)

      if (error) throw error
      setSearchResults(data || [])
    } catch (error) {
      console.error('Error searching users:', error)
    }
  }

  const sendFriendRequest = async (friendId: string) => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('friendships')
        .insert({
          user_id: user.id,
          friend_id: friendId,
          status: 'pending',
        })

      if (error) throw error
      alert('Friend request sent!')
      setSearchResults([])
      setSearchQuery('')
    } catch (error: any) {
      console.error('Error sending friend request:', error)
      alert('Failed to send friend request: ' + error.message)
    }
  }

  const respondToRequest = async (friendshipId: string, accept: boolean) => {
    try {
      const { error } = await supabase
        .from('friendships')
        .update({ status: accept ? 'accepted' : 'rejected' })
        .eq('id', friendshipId)

      if (error) throw error
      alert(accept ? 'Friend request accepted!' : 'Friend request rejected')
      fetchFriends()
    } catch (error) {
      console.error('Error responding to friend request:', error)
      alert('Failed to respond to friend request')
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'lesson_completed':
        return Award
      case 'achievement_earned':
        return Trophy
      case 'streak_milestone':
        return Flame
      case 'level_up':
        return TrendingUp
      default:
        return Award
    }
  }

  const getActivityText = (activity: ActivityWithProfile) => {
    const data = activity.activity_data as any
    switch (activity.activity_type) {
      case 'lesson_completed':
        return `completed "${data.lesson_title}"`
      case 'achievement_earned':
        return `earned achievement "${data.achievement_title}"`
      case 'streak_milestone':
        return `reached a ${data.streak_count}-day streak!`
      case 'level_up':
        return `leveled up to Level ${data.level}!`
      default:
        return 'did something awesome'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 bg-background z-50">
        <div className="container mx-auto px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <Link to="/dashboard">
              <Button variant="ghost" size="sm">← Back</Button>
            </Link>
            <h1 className="text-base sm:text-lg font-semibold">Social</h1>
            <div className="w-16"></div> {/* Spacer */}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-4 sm:py-6 lg:py-8 max-w-6xl">
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-4 sm:mb-6">Activity & Friends</h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Left Sidebar - Friends */}
          <div className="lg:col-span-1 space-y-4 sm:space-y-6">
            <Card>
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                  Friends ({friends.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {friends.length === 0 ? (
                  <p className="text-xs sm:text-sm text-muted-foreground text-center py-3 sm:py-4">
                    No friends yet. Search and add friends!
                  </p>
                ) : (
                  <div className="space-y-2 sm:space-y-3">
                    {friends.map((friend) => (
                      <div key={friend.id} className="flex items-center gap-2 sm:gap-3">
                        <Avatar className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0">
                          <AvatarImage src={friend.friend_profile.avatar_url || undefined} />
                          <AvatarFallback>
                            {friend.friend_profile.full_name?.[0] || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs sm:text-sm font-medium truncate">
                            {friend.friend_profile.full_name || 'Anonymous'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Level {friend.friend_profile.level}
                          </p>
                        </div>
                        <Badge variant="secondary" className="text-xs flex-shrink-0">
                          {friend.friend_profile.xp} XP
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {pendingRequests.length > 0 && (
              <Card>
                <CardHeader className="pb-3 sm:pb-6">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <UserPlus className="w-4 h-4 sm:w-5 sm:h-5" />
                    Requests ({pendingRequests.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 sm:space-y-3">
                    {pendingRequests.map((request) => (
                      <div key={request.id} className="space-y-2">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <Avatar className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0">
                            <AvatarImage src={request.friend_profile.avatar_url || undefined} />
                            <AvatarFallback>
                              {request.friend_profile.full_name?.[0] || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs sm:text-sm font-medium truncate">
                              {request.friend_profile.full_name || 'Anonymous'}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="flex-1 text-xs sm:text-sm"
                            onClick={() => respondToRequest(request.id, true)}
                          >
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 text-xs sm:text-sm"
                            onClick={() => respondToRequest(request.id, false)}
                          >
                            Decline
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Search Users */}
            <Card>
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Search className="w-4 h-4 sm:w-5 sm:h-5" />
                  Find Friends
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 sm:space-y-3">
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    placeholder="Search by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    className="text-sm"
                  />
                  <Button onClick={handleSearch} size="sm" className="w-full sm:w-auto">Search</Button>
                </div>
                {searchResults.length > 0 && (
                  <div className="space-y-2">
                    {searchResults.map((result) => (
                      <div key={result.id} className="flex items-center justify-between p-2 bg-muted rounded">
                        <div>
                          <p className="text-sm font-medium">
                            {result.full_name || result.email}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Level {result.level} • {result.xp} XP
                          </p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => sendFriendRequest(result.id)}
                        >
                          Add
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Main Content - Activity Feed */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="text-base sm:text-lg">Activity Feed</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  See what other learners are achieving
                </CardDescription>
              </CardHeader>
              <CardContent>
                {activityFeed.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground py-6 sm:py-8">
                    No activity yet. Start learning to see updates!
                  </p>
                ) : (
                  <div className="space-y-2 sm:space-y-3">
                    {activityFeed.map((activity) => {
                      const Icon = getActivityIcon(activity.activity_type)
                      return (
                        <div
                          key={activity.id}
                          className="flex items-start gap-2 sm:gap-4 p-2 sm:p-4 rounded-lg bg-muted/50"
                        >
                          <Avatar className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0">
                            <AvatarImage src={activity.user_profile.avatar_url || undefined} />
                            <AvatarFallback>
                              {activity.user_profile.full_name?.[0] || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs sm:text-sm">
                              <span className="font-semibold">
                                {activity.user_profile.full_name || 'Anonymous'}
                              </span>{' '}
                              {getActivityText(activity)}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(activity.created_at).toLocaleDateString()} at{' '}
                              {new Date(activity.created_at).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                          <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
