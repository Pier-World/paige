import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { IntercomProvider } from './providers/IntercomProvider';
import { ScrollToTop } from './components/layout/ScrollToTop';
import { ErrorBoundary } from './components/ErrorBoundary';
import { NavigationGuard } from './components/NavigationGuard';
import { CapitalMarketsLayout } from './components/layout/CapitalMarketsLayout';

const HomePage = lazy(() => import('./pages/HomePage'));
const MembershipsPage = lazy(() => import('./pages/MembershipsPage'));
const ExperiencesPage = lazy(() => import('./pages/ExperiencesPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const AllPreferencesPage = lazy(() => import('./pages/AllPreferencesPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const ConversationPage = lazy(() => import('./pages/ConversationPage'));
const OAuthCallback = lazy(() => import('./pages/OAuthCallback'));
const OnboardingPage = lazy(() => import('./pages/onboarding/OnboardingPage'));
const NewMember = lazy(() => import('./pages/admin/NewMember'));
const CapitalMarketsDashboardPage = lazy(() => import('./pages/capital-markets/DashboardPage'));
const CapitalMarketsDealsPage = lazy(() => import('./pages/capital-markets/DealsPage'));
const CapitalMarketsDealDetailPage = lazy(() => import('./pages/capital-markets/DealDetailPage'));
const CapitalMarketsEventsPage = lazy(() => import('./pages/capital-markets/CapitalMarketsEventsPage'));
const CapitalMarketsPartnersPage = lazy(() => import('./pages/capital-markets/PartnersPage'));
const CapitalMarketsConciergePage = lazy(() => import('./pages/capital-markets/ConciergePage'));
const CapitalMarketsMembersPage = lazy(() => import('./pages/capital-markets/MembersPage'));

/**
 * Retired full-page routes (components removed from repo; `<Navigate>` aliases remain below):
 * - `/calendar` → `/events`
 * - `/perks`, `/perks/:id` → `/partners`
 * - `/travel` → `/concierge`
 * - `/tasks` → `/dashboard`
 * - `/admin` (no trailing path) → `/dashboard`
 * - `CalendarPage`, `PerksPage`, `TravelPage`, `TravelPageOld`, `TasksPage`, `PerkDetailPage`, `EventDetailPage` modules deleted.
 */

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
  const { pathname } = useLocation();
  const isAdminRoute = pathname.startsWith('/admin/');

  // Always wait for auth to finish loading before making routing decisions
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

  // Skip onboarding redirect for admin routes so admins can reach /admin/members/new
  if (!isAdminRoute && (user.onboarding_completed === false || user.onboarding_completed === undefined)) {
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
  
  // If onboarding is completed (explicitly true), land on capital markets shell (not legacy `/` home)
  if (user.onboarding_completed === true) {
    return <Navigate to="/dashboard" replace />;
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
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

const CapitalMarketsRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ProtectedRoute>
      <CapitalMarketsLayout>{children}</CapitalMarketsLayout>
    </ProtectedRoute>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <IntercomProvider>
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
            {/* Recovery links from email; must not use PublicRoute (would bounce authed session to /) */}
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/auth/callback" element={<Navigate to="/dashboard" replace />} />
            
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

            {/* Capital Markets Routes */}
            <Route
              path="/dashboard"
              element={
                <CapitalMarketsRoute>
                  <CapitalMarketsDashboardPage />
                </CapitalMarketsRoute>
              }
            />
            <Route
              path="/deals"
              element={
                <CapitalMarketsRoute>
                  <CapitalMarketsDealsPage />
                </CapitalMarketsRoute>
              }
            />
            <Route
              path="/deals/:id"
              element={
                <CapitalMarketsRoute>
                  <CapitalMarketsDealDetailPage />
                </CapitalMarketsRoute>
              }
            />
            <Route
              path="/events"
              element={
                <CapitalMarketsRoute>
                  <CapitalMarketsEventsPage />
                </CapitalMarketsRoute>
              }
            />
            <Route
              path="/partners"
              element={
                <CapitalMarketsRoute>
                  <CapitalMarketsPartnersPage />
                </CapitalMarketsRoute>
              }
            />
            <Route
              path="/concierge"
              element={
                <CapitalMarketsRoute>
                  <CapitalMarketsConciergePage />
                </CapitalMarketsRoute>
              }
            />
            <Route
              path="/members"
              element={
                <CapitalMarketsRoute>
                  <CapitalMarketsMembersPage />
                </CapitalMarketsRoute>
              }
            />

            {/* Default app shell: capital markets dashboard (legacy carousel home lives at /home) */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Navigate to="/dashboard" replace />
                </ProtectedRoute>
              }
            />
            <Route
              path="/home"
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
                  <Navigate to="/events" replace />
                </ProtectedRoute>
              }
            />
            <Route
              path="/perks"
              element={
                <ProtectedRoute>
                  <Navigate to="/partners" replace />
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

            {/* Admin: manual member creation (protected; page enforces admin role) */}
            <Route
              path="/admin/members/new"
              element={
                <ProtectedRoute>
                  <NewMember />
                </ProtectedRoute>
              }
            />

            {/* Legacy/Redirect routes */}
            <Route path="/travel" element={<Navigate to="/concierge" replace />} />
            <Route path="/tasks" element={<Navigate to="/dashboard" replace />} />
            <Route path="/admin" element={<Navigate to="/dashboard" replace />} />
            <Route path="/perks/:id" element={<Navigate to="/partners" replace />} />
            <Route path="/explore" element={<Navigate to="/experiences" replace />} />
            <Route path="/explore/:id" element={<Navigate to="/experiences" replace />} />
            <Route path="/membership" element={<Navigate to="/memberships" replace />} />

            {/* Catch all route */}
            <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </Suspense>
            </ErrorBoundary>
          </Router>
        </ThemeProvider>
        </IntercomProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;