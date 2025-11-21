import { useEffect, Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { ErrorBoundary } from './components/ErrorBoundary'
import { Login } from './pages/Login'
import { SignUp } from './pages/SignUp'

// Lazy load pages for code splitting
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })))
const CoursePage = lazy(() => import('./pages/CoursePage').then(m => ({ default: m.CoursePage })))
const UnitPage = lazy(() => import('./pages/UnitPage').then(m => ({ default: m.UnitPage })))
const LessonPage = lazy(() => import('./pages/LessonPage').then(m => ({ default: m.LessonPage })))
const QuizPage = lazy(() => import('./pages/QuizPage').then(m => ({ default: m.QuizPage })))
const Leaderboard = lazy(() => import('./pages/Leaderboard').then(m => ({ default: m.Leaderboard })))
const Social = lazy(() => import('./pages/Social').then(m => ({ default: m.Social })))
const Profile = lazy(() => import('./pages/Profile').then(m => ({ default: m.Profile })))
const AdminPanel = lazy(() => import('./pages/admin/AdminPanel').then(m => ({ default: m.AdminPanel })))

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  )
}

function App() {
  const initialize = useAuthStore((state) => state.initialize)

  useEffect(() => {
    initialize()
  }, [initialize])

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/course/:courseId"
            element={
              <ProtectedRoute>
                <CoursePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/unit/:unitId"
            element={
              <ProtectedRoute>
                <UnitPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/lesson/:lessonId"
            element={
              <ProtectedRoute>
                <LessonPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/quiz/:lessonId"
            element={
              <ProtectedRoute>
                <QuizPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/leaderboard"
            element={
              <ProtectedRoute>
                <Leaderboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/social"
            element={
              <ProtectedRoute>
                <Social />
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/*"
            element={
              <ProtectedRoute requireAdmin>
                <AdminPanel />
              </ProtectedRoute>
            }
          />

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
    </ErrorBoundary>
  )
}

export default App
