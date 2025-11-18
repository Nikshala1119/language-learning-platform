-- COMPLETE DATABASE RESET - FIXED VERSION (No Infinite Recursion)
-- Run this in Supabase SQL Editor

-- Step 1: Drop everything
DROP TABLE IF EXISTS analytics_events CASCADE;
DROP TABLE IF EXISTS attendance CASCADE;
DROP TABLE IF EXISTS activity_feed CASCADE;
DROP TABLE IF EXISTS friendships CASCADE;
DROP TABLE IF EXISTS user_achievements CASCADE;
DROP TABLE IF EXISTS achievements CASCADE;
DROP TABLE IF EXISTS question_attempts CASCADE;
DROP TABLE IF EXISTS progress CASCADE;
DROP TABLE IF EXISTS questions CASCADE;
DROP TABLE IF EXISTS lessons CASCADE;
DROP TABLE IF EXISTS units CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP VIEW IF EXISTS leaderboard CASCADE;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS calculate_level(INTEGER) CASCADE;
DROP FUNCTION IF EXISTS update_user_level() CASCADE;

-- Step 2: Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Step 3: Create all tables
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT CHECK (role IN ('student', 'admin')) DEFAULT 'student',
  payment_status TEXT CHECK (payment_status IN ('paid', 'unpaid', 'trial')) DEFAULT 'trial',
  trial_end_date TIMESTAMPTZ,
  xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  streak_count INTEGER DEFAULT 0,
  last_activity_date DATE,
  streak_freeze_count INTEGER DEFAULT 2,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  language TEXT NOT NULL,
  level TEXT NOT NULL,
  thumbnail_url TEXT,
  is_published BOOLEAN DEFAULT false,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE units (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE lessons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  unit_id UUID REFERENCES units(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT CHECK (type IN ('video', 'pdf', 'live_class', 'quiz')) NOT NULL,
  content_url TEXT,
  meet_link TEXT,
  scheduled_at TIMESTAMPTZ,
  duration_minutes INTEGER,
  xp_reward INTEGER DEFAULT 10,
  order_index INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('multiple_choice', 'fill_blank', 'translation', 'listen_type', 'speak_record', 'match_pairs', 'word_order', 'image_select')) NOT NULL,
  question_text TEXT NOT NULL,
  question_audio_url TEXT,
  question_image_url TEXT,
  options JSONB,
  correct_answer JSONB NOT NULL,
  explanation TEXT,
  xp_reward INTEGER DEFAULT 5,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('not_started', 'in_progress', 'completed')) DEFAULT 'not_started',
  score DECIMAL(5,2),
  completed_at TIMESTAMPTZ,
  attempts INTEGER DEFAULT 0,
  last_attempt_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, lesson_id)
);

CREATE TABLE question_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  user_answer JSONB NOT NULL,
  is_correct BOOLEAN NOT NULL,
  pronunciation_score DECIMAL(5,2),
  time_taken_seconds INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  type TEXT CHECK (type IN ('badge', 'crown')) NOT NULL,
  tier INTEGER,
  requirement_type TEXT CHECK (requirement_type IN ('xp', 'streak', 'lessons_completed', 'perfect_score', 'speed')) NOT NULL,
  requirement_value INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

CREATE TABLE friendships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  friend_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);

CREATE TABLE activity_feed (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  activity_type TEXT CHECK (activity_type IN ('lesson_completed', 'achievement_earned', 'streak_milestone', 'level_up')) NOT NULL,
  activity_data JSONB NOT NULL,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  duration_minutes INTEGER
);

CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  event_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 4: Create indexes
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_xp ON profiles(xp DESC);
CREATE INDEX idx_units_course_id ON units(course_id);
CREATE INDEX idx_lessons_unit_id ON lessons(unit_id);
CREATE INDEX idx_questions_lesson_id ON questions(lesson_id);
CREATE INDEX idx_progress_user_id ON progress(user_id);
CREATE INDEX idx_progress_lesson_id ON progress(lesson_id);
CREATE INDEX idx_question_attempts_user_id ON question_attempts(user_id);
CREATE INDEX idx_question_attempts_question_id ON question_attempts(question_id);
CREATE INDEX idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX idx_friendships_user_id ON friendships(user_id);
CREATE INDEX idx_friendships_friend_id ON friendships(friend_id);
CREATE INDEX idx_activity_feed_user_id ON activity_feed(user_id);
CREATE INDEX idx_attendance_user_id ON attendance(user_id);
CREATE INDEX idx_attendance_lesson_id ON attendance(lesson_id);
CREATE INDEX idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX idx_analytics_events_event_type ON analytics_events(event_type);

-- Step 5: Create view
CREATE OR REPLACE VIEW leaderboard AS
SELECT
  p.id as user_id,
  p.full_name,
  p.avatar_url,
  p.xp,
  p.level,
  ROW_NUMBER() OVER (ORDER BY p.xp DESC) as rank
FROM profiles p
WHERE p.role = 'student'
ORDER BY p.xp DESC;

-- Step 6: Create functions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, trial_end_date)
  VALUES (
    NEW.id,
    NEW.email,
    NOW() + INTERVAL '7 days'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION calculate_level(xp_amount INTEGER)
RETURNS INTEGER AS $$
BEGIN
  RETURN FLOOR(xp_amount / 100) + 1;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_user_level()
RETURNS TRIGGER AS $$
DECLARE
  new_level INTEGER;
BEGIN
  new_level := calculate_level(NEW.xp);
  IF new_level != NEW.level THEN
    NEW.level := new_level;
    INSERT INTO activity_feed (user_id, activity_type, activity_data)
    VALUES (NEW.id, 'level_up', jsonb_build_object('level', new_level));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 7: Create triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_units_updated_at BEFORE UPDATE ON units
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lessons_updated_at BEFORE UPDATE ON lessons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_questions_updated_at BEFORE UPDATE ON questions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_progress_updated_at BEFORE UPDATE ON progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

CREATE TRIGGER update_level_on_xp_change
  BEFORE UPDATE OF xp ON profiles
  FOR EACH ROW
  WHEN (OLD.xp IS DISTINCT FROM NEW.xp)
  EXECUTE FUNCTION update_user_level();

-- Step 8: Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_feed ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Step 9: Create RLS policies (FIXED - No Infinite Recursion)

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Courses policies (Allow read for published, allow all for authenticated users who will be checked in app)
CREATE POLICY "Anyone can view published courses" ON courses FOR SELECT USING (is_published = true);
CREATE POLICY "Authenticated users can manage courses" ON courses
  FOR ALL USING (auth.role() = 'authenticated');

-- Units policies
CREATE POLICY "Anyone can view units of published courses" ON units FOR SELECT USING (
  EXISTS (SELECT 1 FROM courses WHERE id = units.course_id AND is_published = true)
);
CREATE POLICY "Authenticated users can manage units" ON units
  FOR ALL USING (auth.role() = 'authenticated');

-- Lessons policies
CREATE POLICY "Users can view published lessons" ON lessons FOR SELECT USING (is_published = true);
CREATE POLICY "Authenticated users can manage lessons" ON lessons
  FOR ALL USING (auth.role() = 'authenticated');

-- Questions policies
CREATE POLICY "Users can view questions of published lessons" ON questions FOR SELECT USING (
  EXISTS (SELECT 1 FROM lessons WHERE id = questions.lesson_id AND is_published = true)
);
CREATE POLICY "Authenticated users can manage questions" ON questions
  FOR ALL USING (auth.role() = 'authenticated');

-- Progress policies
CREATE POLICY "Users can view own progress" ON progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own progress" ON progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own progress records" ON progress FOR UPDATE USING (auth.uid() = user_id);

-- Question attempts policies
CREATE POLICY "Users can view own attempts" ON question_attempts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own attempts" ON question_attempts FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Achievements policies
CREATE POLICY "Anyone can view achievements" ON achievements FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage achievements" ON achievements
  FOR ALL USING (auth.role() = 'authenticated');

-- User achievements policies
CREATE POLICY "Users can view own achievements" ON user_achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view friends' achievements" ON user_achievements FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM friendships
    WHERE friendships.user_id = auth.uid()
    AND friendships.friend_id = user_achievements.user_id
    AND friendships.status = 'accepted'
  )
);
CREATE POLICY "System can insert achievements" ON user_achievements FOR INSERT WITH CHECK (true);

-- Friendships policies
CREATE POLICY "Users can view own friendships" ON friendships FOR SELECT USING (
  auth.uid() = user_id OR auth.uid() = friend_id
);
CREATE POLICY "Users can create friendship requests" ON friendships FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update friendship status" ON friendships FOR UPDATE USING (
  auth.uid() = user_id OR auth.uid() = friend_id
);

-- Activity feed policies
CREATE POLICY "Users can view public activities" ON activity_feed FOR SELECT USING (is_public = true);
CREATE POLICY "Users can view own activities" ON activity_feed FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view friends' activities" ON activity_feed FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM friendships
    WHERE friendships.user_id = auth.uid()
    AND friendships.friend_id = activity_feed.user_id
    AND friendships.status = 'accepted'
  )
);
CREATE POLICY "System can insert activities" ON activity_feed FOR INSERT WITH CHECK (true);

-- Attendance policies
CREATE POLICY "Users can view own attendance" ON attendance FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own attendance" ON attendance FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Analytics events policies
CREATE POLICY "System can insert analytics" ON analytics_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can view analytics" ON analytics_events
  FOR SELECT USING (auth.role() = 'authenticated');

-- Step 10: Insert default achievements
INSERT INTO achievements (title, description, icon, type, tier, requirement_type, requirement_value) VALUES
  ('First Steps', 'Complete your first lesson', '🎯', 'badge', null, 'lessons_completed', 1),
  ('Learning Streak', 'Maintain a 7-day streak', '🔥', 'badge', null, 'streak', 7),
  ('XP Hunter', 'Earn 500 XP', '⭐', 'badge', null, 'xp', 500),
  ('Perfect Score', 'Get 100% on a lesson', '💯', 'badge', null, 'perfect_score', 100),
  ('Speed Demon', 'Complete a lesson in under 5 minutes', '⚡', 'badge', null, 'speed', 300),
  ('Bronze Crown', 'Reach level 5', '👑', 'crown', 1, 'xp', 500),
  ('Silver Crown', 'Reach level 10', '👑', 'crown', 2, 'xp', 1000),
  ('Gold Crown', 'Reach level 20', '👑', 'crown', 3, 'xp', 2000),
  ('Platinum Crown', 'Reach level 50', '👑', 'crown', 4, 'xp', 5000);
