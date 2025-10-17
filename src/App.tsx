import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ScrollToTop } from './components/layout/ScrollToTop';

const HomePage = lazy(() => import('./pages/HomePage'));
const PerksPage = lazy(() => import('./pages/PerksPage'));
const PerkDetailPage = lazy(() => import('./pages/PerkDetailPage'));
const ExplorePage = lazy(() => import('./pages/ExplorePage'));
const EventDetailPage = lazy(() => import('./pages/EventDetailPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const MembershipPage = lazy(() => import('./pages/MembershipPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const TravelPage = lazy(() => import('./pages/TravelPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));

const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-900"></div>
  </div>
);

// Protected route component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-900"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

// Admin route component
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-900"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

// Public route component - redirects to home if already authenticated
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-900"></div>
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

            {/* Admin routes */}
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminPage />
                </AdminRoute>
              }
            />

            {/* Protected routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <HomePage />
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
              path="/perks/:id"
              element={
                <ProtectedRoute>
                  <PerkDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/explore"
              element={
                <ProtectedRoute>
                  <ExplorePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/explore/:id"
              element={
                <ProtectedRoute>
                  <EventDetailPage />
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
              path="/membership"
              element={
                <ProtectedRoute>
                  <MembershipPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/travel"
              element={
                <ProtectedRoute>
                  <TravelPage />
                </ProtectedRoute>
              }
            />

            {/* Catch all route */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </Router>
    </AuthProvider>
  );
}

export default App;