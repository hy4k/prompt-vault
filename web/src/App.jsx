import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import FeedPage from './pages/FeedPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import VaultPage from './pages/VaultPage'
import ProfilePage from './pages/ProfilePage'
import PricingPage from './pages/PricingPage'

function OwnProfileRedirect() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  return <Navigate to={`/profile/${user.id}`} replace />
}

export default function App() {
  return (
    <div className="relative min-h-screen bg-obsidian text-slate-100">
      {/* ---- Atmosphere: aurora glows, blueprint grid, film grain ---- */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div className="aurora absolute -top-40 left-1/2 h-80 w-[42rem] max-w-[120vw] -translate-x-1/2 rounded-full bg-gold/10 blur-3xl" />
        <div className="aurora-slow absolute -right-32 top-1/3 h-72 w-72 rounded-full bg-gold/[0.06] blur-3xl" />
        <div className="bg-grid absolute inset-0" />
        <div className="noise-overlay absolute inset-0" />
        {/* vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_60%,rgba(0,0,0,0.45))]" />
      </div>

      <Navbar />

      <main className="relative mx-auto w-full max-w-shell px-4 pb-24 sm:px-6">
        <Routes>
          <Route path="/" element={<FeedPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route
            path="/vault"
            element={
              <ProtectedRoute>
                <VaultPage />
              </ProtectedRoute>
            }
          />
          <Route path="/profile" element={<OwnProfileRedirect />} />
          <Route path="/profile/:id" element={<ProfilePage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}
