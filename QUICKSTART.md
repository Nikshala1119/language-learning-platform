# Quick Start Guide

Get your language learning platform up and running in 10 minutes!

## Prerequisites

- Node.js 18+ installed
- npm or yarn
- Supabase account (free tier works!)

## Step 1: Install Dependencies

```bash
cd language-learning-platform
npm install --legacy-peer-deps
```

> Note: We use `--legacy-peer-deps` due to React 19 compatibility with some packages.

## Step 2: Set Up Supabase

### Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Fill in project details
4. Wait for project to be ready (~2 minutes)

### Get Your Credentials

1. Go to Project Settings → API
2. Copy your **Project URL**
3. Copy your **anon/public key**

### Configure Environment Variables

1. Copy the example env file:
```bash
cp .env.example .env
```

2. Edit `.env` and add your credentials:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## Step 3: Set Up Database

### Option A: Using Supabase Dashboard (Easiest)

1. Open your Supabase project
2. Go to **SQL Editor**
3. Click **New query**
4. Copy the entire contents of `supabase/migrations/001_initial_schema.sql`
5. Paste into the editor
6. Click **Run**
7. Wait for completion (you should see "Success" message)

### Option B: Using Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

## Step 4: Create Storage Buckets

1. In Supabase dashboard, go to **Storage**
2. Create these buckets (all public):
   - `course-thumbnails`
   - `lesson-content`
   - `question-media`
   - `user-avatars`

For each bucket:
- Click "New bucket"
- Enter name
- Check "Public bucket"
- Click "Create"

## Step 5: Deploy Edge Functions (Optional)

These enable automated streak tracking and achievements:

```bash
supabase functions deploy update-streaks
supabase functions deploy check-achievements
```

If you skip this step, you can manually trigger these later.

## Step 6: Run the App

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser!

## Step 7: Create Your First Account

1. Click **Sign Up**
2. Enter your details
3. Check your email for confirmation
4. Sign in

Congratulations! You're now a student user with a 7-day trial.

## Step 8: Make Yourself an Admin

To access the admin panel:

1. Go to Supabase dashboard
2. Open **Table Editor**
3. Select **profiles** table
4. Find your row (by email)
5. Edit the **role** column
6. Change from `student` to `admin`
7. Save changes
8. Refresh your app
9. Navigate to `/admin`

## Quick Test Checklist

### As a Student
- [ ] Sign up and sign in work
- [ ] Dashboard loads
- [ ] Can view courses (none yet)
- [ ] Profile page shows your XP and level
- [ ] Leaderboard is visible

### As an Admin
- [ ] Can access `/admin`
- [ ] Can create a course
- [ ] Can add units to course
- [ ] Can add lessons to units
- [ ] Can add questions to quiz lessons
- [ ] Can manage students
- [ ] Can view analytics

## Common Issues

### "Missing Supabase environment variables"

Make sure your `.env` file is in the root directory and contains both variables:
```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

Restart the dev server after creating/editing `.env`.

### Database errors / RLS violations

Make sure you ran the complete migration script. All tables, policies, functions, and triggers must be created.

### Can't see uploaded images

Check that your storage buckets are set to **public** in Supabase dashboard.

### Speech recognition not working

Speech features require HTTPS in production. In development (localhost), they should work in Chrome/Edge.

## Next Steps

### Create Your First Course

1. Go to `/admin`
2. Click **Courses** in sidebar
3. Click **Create Course**
4. Fill in:
   - Title: "Spanish for Beginners"
   - Description: "Learn Spanish from scratch"
   - Language: "Spanish"
   - Level: "Beginner"
5. Click **Create**

### Add a Unit

1. Open your course
2. Click **Add Unit**
3. Title: "Unit 1: Greetings"
4. Click **Create**

### Add a Lesson

1. Open your unit
2. Click **Add Lesson**
3. Choose type: **Quiz**
4. Title: "Basic Greetings"
5. XP Reward: 10
6. Click **Create**

### Add Questions

1. Open your lesson
2. Click **Add Question**
3. Choose type: **Multiple Choice**
4. Question: "How do you say 'Hello' in Spanish?"
5. Options: ["Hola", "Adiós", "Gracias", "Por favor"]
6. Correct answer: "Hola"
7. Click **Create**

### Test as a Student

1. Log out or open incognito window
2. Sign up as a new student
3. Go to dashboard
4. Open your course
5. Complete the lesson
6. Earn XP and see your progress!

## Development Tips

### Hot Reload

Vite provides instant hot module replacement. Just save your files and see changes immediately.

### Database Changes

After modifying the database schema, you may need to update `src/lib/database.types.ts`. You can generate types automatically:

```bash
supabase gen types typescript --project-id your-project-ref > src/lib/database.types.ts
```

### Debugging

Check these in browser DevTools:
- **Console**: For errors and logs
- **Network**: For Supabase API calls
- **Application → Local Storage**: For auth session

### State Management

- Auth state: `useAuthStore()`
- Courses: `useCourseStore()`
- Gamification: `useGamificationStore()`

### Testing RLS Policies

Test as different users by:
1. Opening incognito windows
2. Creating multiple accounts
3. Testing permissions (students vs admins)

## Resources

- [Full Documentation](./README.md)
- [Implementation Guide](./IMPLEMENTATION_GUIDE.md)
- [Supabase Docs](https://supabase.com/docs)
- [React Router Docs](https://reactrouter.com)
- [Zustand Docs](https://zustand-demo.pmnd.rs)
- [shadcn/ui Components](https://ui.shadcn.com)

## Getting Help

If you encounter issues:

1. Check the error message in browser console
2. Verify your Supabase connection
3. Ensure all migrations ran successfully
4. Check RLS policies in Supabase
5. Review the implementation guide

## Production Deployment

When ready to deploy:

1. Build the app:
```bash
npm run build
```

2. Deploy `dist` folder to:
   - Vercel (recommended)
   - Netlify
   - Cloudflare Pages
   - Any static host

3. Set environment variables on your host

4. Update Supabase:
   - Add your domain to Auth → URL Configuration
   - Update CORS settings if needed

---

Happy learning! 🚀
