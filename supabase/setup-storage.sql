-- ============================================
-- SUPABASE STORAGE SETUP FOR MEDIA LIBRARY
-- ============================================
-- Run this script in Supabase SQL Editor
-- This will create the 'media' bucket and set up all necessary policies

-- Step 1: Create the storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;

-- Step 2: Drop existing policies (if any) to avoid conflicts
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Update" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Delete" ON storage.objects;

-- Step 3: Create storage policies

-- Allow anyone to read/view files (public access)
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'media');

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated Upload"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'media' AND auth.role() = 'authenticated');

-- Allow authenticated users to update files
CREATE POLICY "Authenticated Update"
ON storage.objects FOR UPDATE
USING (bucket_id = 'media' AND auth.role() = 'authenticated');

-- Allow authenticated users to delete files
CREATE POLICY "Authenticated Delete"
ON storage.objects FOR DELETE
USING (bucket_id = 'media' AND auth.role() = 'authenticated');

-- ============================================
-- VERIFICATION
-- ============================================
-- Check if bucket was created
SELECT * FROM storage.buckets WHERE id = 'media';

-- Check if policies were created
SELECT * FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects';

-- ============================================
-- SUCCESS!
-- ============================================
-- If you see the bucket and 4 policies listed above,
-- you're all set! Go to /admin/media and try uploading.
