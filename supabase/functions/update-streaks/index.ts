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

    // Get all users with their last activity date
    const { data: users, error: usersError } = await supabaseClient
      .from('profiles')
      .select('id, last_activity_date, streak_count, streak_freeze_count')

    if (usersError) throw usersError

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    for (const user of users || []) {
      if (!user.last_activity_date) continue

      const lastActivity = new Date(user.last_activity_date)
      lastActivity.setHours(0, 0, 0, 0)

      const daysDiff = Math.floor((today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24))

      if (daysDiff === 1) {
        // User was active yesterday, streak continues
        continue
      } else if (daysDiff > 1) {
        // Streak broken, check if user has freeze available
        if (user.streak_freeze_count > 0) {
          // Use one freeze
          await supabaseClient
            .from('profiles')
            .update({
              streak_freeze_count: user.streak_freeze_count - 1
            })
            .eq('id', user.id)
        } else {
          // Reset streak
          await supabaseClient
            .from('profiles')
            .update({
              streak_count: 0
            })
            .eq('id', user.id)
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Streaks updated' }),
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
