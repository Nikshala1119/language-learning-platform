import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { userId } = await req.json()

    if (!userId) {
      throw new Error('userId is required')
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (profileError) throw profileError

    // Get user's existing achievements
    const { data: userAchievements, error: userAchievementsError } = await supabaseClient
      .from('user_achievements')
      .select('achievement_id')
      .eq('user_id', userId)

    if (userAchievementsError) throw userAchievementsError

    const earnedAchievementIds = new Set(userAchievements?.map(ua => ua.achievement_id) || [])

    // Get all achievements
    const { data: achievements, error: achievementsError } = await supabaseClient
      .from('achievements')
      .select('*')

    if (achievementsError) throw achievementsError

    const newAchievements = []

    for (const achievement of achievements || []) {
      if (earnedAchievementIds.has(achievement.id)) continue

      let qualifies = false

      switch (achievement.requirement_type) {
        case 'xp':
          qualifies = profile.xp >= achievement.requirement_value
          break

        case 'streak':
          qualifies = profile.streak_count >= achievement.requirement_value
          break

        case 'lessons_completed': {
          const { count } = await supabaseClient
            .from('progress')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('status', 'completed')

          qualifies = (count || 0) >= achievement.requirement_value
          break
        }

        case 'perfect_score': {
          const { data: progress } = await supabaseClient
            .from('progress')
            .select('score')
            .eq('user_id', userId)
            .eq('status', 'completed')
            .gte('score', achievement.requirement_value)
            .limit(1)

          qualifies = (progress?.length || 0) > 0
          break
        }

        case 'speed': {
          const { data: attempts } = await supabaseClient
            .from('question_attempts')
            .select('time_taken_seconds')
            .eq('user_id', userId)
            .lte('time_taken_seconds', achievement.requirement_value)
            .limit(1)

          qualifies = (attempts?.length || 0) > 0
          break
        }
      }

      if (qualifies) {
        // Award achievement
        await supabaseClient
          .from('user_achievements')
          .insert({ user_id: userId, achievement_id: achievement.id })

        // Create activity feed entry
        await supabaseClient
          .from('activity_feed')
          .insert({
            user_id: userId,
            activity_type: 'achievement_earned',
            activity_data: { achievement_id: achievement.id, title: achievement.title, icon: achievement.icon }
          })

        newAchievements.push(achievement)
      }
    }

    return new Response(
      JSON.stringify({ success: true, newAchievements }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
