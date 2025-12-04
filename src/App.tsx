import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ScrollToTop } from './components/layout/ScrollToTop';

const HomePage = lazy(() => import('./pages/HomePage'));
const CalendarPage = lazy(() => import('./pages/CalendarPage'));
const PerksPage = lazy(() => import('./pages/PerksPage'));
const MembershipsPage = lazy(() => import('./pages/MembershipsPage'));
const ExperiencesPage = lazy(() => import('./pages/ExperiencesPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const TravelPage = lazy(() => import('./pages/TravelPage'));
const TasksPage = lazy(() => import('./pages/TasksPage'));
const ConversationPage = lazy(() => import('./pages/ConversationPage'));
const OAuthCallback = lazy(() => import('./pages/OAuthCallback'));

const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-accent"></div>
  </div>
);

// Protected route component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-accent"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};


// Public route component - redirects to home if already authenticated
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-accent"></div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            {/* Public routes with redirect if authenticated */}
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <LoginPage />
                </PublicRoute>
              }
            />
            <Route
              path="/forgot-password"
              element={
                <PublicRoute>
                  <ForgotPasswordPage />
                </PublicRoute>
              }
            />
            <Route path="/auth/callback" element={<Navigate to="/" replace />} />
            
            {/* OAuth Callback Route (public - handles OAuth redirects) */}
            <Route path="/oauth-callback" element={<OAuthCallback />} />

            {/* Main Platform Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <HomePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/calendar"
              element={
                <ProtectedRoute>
                  <CalendarPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/perks"
              element={
                <ProtectedRoute>
                  <PerksPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/memberships"
              element={
                <ProtectedRoute>
                  <MembershipsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/experiences"
              element={
                <ProtectedRoute>
                  <ExperiencesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/conversation/:taskId?"
              element={
                <ProtectedRoute>
                  <ConversationPage />
                </ProtectedRoute>
              }
            />

            {/* Legacy/Redirect routes */}
            <Route path="/travel" element={<Navigate to="/" replace />} />
            <Route path="/tasks" element={<Navigate to="/" replace />} />
            <Route path="/admin" element={<Navigate to="/" replace />} />
            <Route path="/perks/:id" element={<Navigate to="/perks" replace />} />
            <Route path="/explore" element={<Navigate to="/experiences" replace />} />
            <Route path="/explore/:id" element={<Navigate to="/experiences" replace />} />
            <Route path="/membership" element={<Navigate to="/memberships" replace />} />
            <Route path="/events" element={<Navigate to="/experiences" replace />} />

            {/* Catch all route */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </Router>
    </AuthProvider>
  );
}

export default App;