import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ScrollToTop } from './components/layout/ScrollToTop';
import { ErrorBoundary } from './components/ErrorBoundary';
import { NavigationGuard } from './components/NavigationGuard';

const HomePage = lazy(() => import('./pages/HomePage'));
const CalendarPage = lazy(() => import('./pages/CalendarPage'));
const PerksPage = lazy(() => import('./pages/PerksPage'));
const MembershipsPage = lazy(() => import('./pages/MembershipsPage'));
const ExperiencesPage = lazy(() => import('./pages/ExperiencesPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const AllPreferencesPage = lazy(() => import('./pages/AllPreferencesPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const TravelPage = lazy(() => import('./pages/TravelPage'));
const TasksPage = lazy(() => import('./pages/TasksPage'));
const ConversationPage = lazy(() => import('./pages/ConversationPage'));
const OAuthCallback = lazy(() => import('./pages/OAuthCallback'));
const OnboardingPage = lazy(() => import('./pages/onboarding/OnboardingPage'));

const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-accent"></div>
  </div>
);

// Wrapper to ensure context is available before rendering
const RouteWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

// Protected route component - redirects to onboarding if not completed
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  
  // Always wait for auth to finish loading before making routing decisions
  // This prevents redirect loops and flash of login page
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-accent"></div>
      </div>
    );
  }
  
  // Only redirect if we're sure there's no user (after loading is complete)
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // Redirect to onboarding if not completed (default to false if undefined)
  if (user.onboarding_completed === false || user.onboarding_completed === undefined) {
    return <Navigate to="/onboarding" replace />;
  }
  
  return <>{children}</>;
};

// Onboarding route - only accessible if onboarding is not completed
const OnboardingRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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
  
  // If onboarding is completed (explicitly true), redirect to home
  if (user.onboarding_completed === true) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};


// Public route component - redirects to home if already authenticated
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();

  // Always wait for auth to finish loading before making routing decisions
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-accent"></div>
      </div>
    );
  }

  // Only redirect if we're sure user is authenticated (after loading is complete)
  if (user) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ThemeProvider>
          <Router>
            <ScrollToTop />
            <NavigationGuard />
            <ErrorBoundary fallback={<LoadingSpinner />}>
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

            {/* Onboarding Route */}
            <Route
              path="/onboarding"
              element={
                <OnboardingRoute>
                  <OnboardingPage />
                </OnboardingRoute>
              }
            />

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
              path="/preferences/all"
              element={
                <ProtectedRoute>
                  <AllPreferencesPage />
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
            </ErrorBoundary>
          </Router>
        </ThemeProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;