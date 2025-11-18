# Supabase Storage Setup for Media Library

## Step 1: Create Storage Bucket

1. Go to your Supabase Dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **"New bucket"**
4. Enter the following details:
   - **Name**: `media`
   - **Public bucket**: Toggle **ON** (checked)
   - Click **"Create bucket"**

## Step 2: Set Up Storage Policies

After creating the bucket, you need to add policies:

1. Click on the `media` bucket you just created
2. Click on **"Policies"** tab at the top
3. Click **"New Policy"**

### Policy 1: Public Read Access
- **Policy Name**: `Public Access`
- **Allowed operation**: `SELECT`
- **Policy definition**: Click **"Use custom SQL"** and paste:
```sql
(bucket_id = 'media'::text)
```
- Click **"Review"** then **"Save policy"**

### Policy 2: Authenticated Upload
- **Policy Name**: `Authenticated Upload`
- **Allowed operation**: `INSERT`
- **Target roles**: `authenticated`
- **Policy definition**: Click **"Use custom SQL"** and paste:
```sql
((bucket_id = 'media'::text) AND (auth.role() = 'authenticated'::text))
```
- Click **"Review"** then **"Save policy"**

### Policy 3: Authenticated Delete
- **Policy Name**: `Authenticated Delete`
- **Allowed operation**: `DELETE`
- **Target roles**: `authenticated`
- **Policy definition**: Click **"Use custom SQL"** and paste:
```sql
((bucket_id = 'media'::text) AND (auth.role() = 'authenticated'::text))
```
- Click **"Review"** then **"Save policy"**

### Policy 4: Authenticated Update
- **Policy Name**: `Authenticated Update`
- **Allowed operation**: `UPDATE`
- **Target roles**: `authenticated`
- **Policy definition**: Click **"Use custom SQL"** and paste:
```sql
((bucket_id = 'media'::text) AND (auth.role() = 'authenticated'::text))
```
- Click **"Review"** then **"Save policy"**

## Alternative: Quick SQL Setup (Easier Method)

Instead of using the UI, you can run this SQL directly in the **SQL Editor**:

```sql
-- Create the storage bucket (if you haven't via UI)
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;

-- Grant public read access
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'media');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated Upload"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'media' AND auth.role() = 'authenticated');

-- Allow authenticated users to update
CREATE POLICY "Authenticated Update"
ON storage.objects FOR UPDATE
USING (bucket_id = 'media' AND auth.role() = 'authenticated');

-- Allow authenticated users to delete
CREATE POLICY "Authenticated Delete"
ON storage.objects FOR DELETE
USING (bucket_id = 'media' AND auth.role() = 'authenticated');
```

## Step 3: Test Upload

1. Go to `/admin/media` in your app
2. Click **"Upload File"**
3. Select a file (image, video, PDF, or audio)
4. Click **"Upload"**

If you see any errors, check:
- The bucket name is exactly `media`
- The bucket is marked as public
- All 4 policies are created
- You're logged in as an authenticated user

## Troubleshooting

### Error: "Bucket not found"
- Make sure the bucket `media` exists
- Check the bucket name is spelled correctly

### Error: "Permission denied" or "Row level security policy"
- The policies might not be set up correctly
- Run the SQL script above to ensure all policies exist

### Error: "File too large"
- Default Supabase limit is 50MB per file
- To increase, contact Supabase support or upgrade your plan

### Files uploaded but not showing
- Refresh the page
- Check browser console for errors
- Verify the bucket is marked as "public"
