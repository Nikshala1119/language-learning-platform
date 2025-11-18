-- Add login_enabled field to profiles table
-- This allows admins to control which students can login to the app

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS login_enabled BOOLEAN DEFAULT false;

-- Update existing students to have login enabled (optional - remove if you want to require manual approval for all)
UPDATE profiles SET login_enabled = true WHERE role = 'student';

-- Admins always have login enabled
UPDATE profiles SET login_enabled = true WHERE role = 'admin';

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_login_enabled ON profiles(login_enabled);
