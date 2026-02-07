import { Routes, Route, Navigate } from 'react-router-dom';
import { 
  AuthProvider, 
  WorkspaceProvider, 
  useAuth,
  PriorityProvider,
  ToastProvider,
  FavoritesProvider,
  CommentsProvider,
  PinsProvider,
  RecentProvider,
  ActivityProvider,
} from './context';
import './styles/base.css';
import './styles/components.css';
import './styles/layout.css';
import './styles/pages.css';
import './styles/workspace.css';

// Public Pages
import { LandingPage } from './pages/landingPage';
import { FeaturesPage } from './pages/featuresPage';
import { AboutPage } from './pages/aboutPage';
import { ContactPage } from './pages/contactPage';
import { PricingPage } from './pages/pricingPage';
import { LoginPage } from './pages/loginPage';

// App Pages
import { DashboardPage } from './pages/dashboardPage';
import { SchemasPage } from './pages/schemasPage';
import { SettingsPage } from './pages/settingsPage';

// Protected Route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh',
        background: 'var(--color-bg)',
        color: 'var(--color-text)',
      }}>
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// App-level providers for authenticated routes
function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <WorkspaceProvider>
      <PriorityProvider>
        <FavoritesProvider>
          <PinsProvider>
            <RecentProvider>
              <ActivityProvider>
                <CommentsProvider>
                  {children}
                </CommentsProvider>
              </ActivityProvider>
            </RecentProvider>
          </PinsProvider>
        </FavoritesProvider>
      </PriorityProvider>
    </WorkspaceProvider>
  );
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public Pages */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/features" element={<FeaturesPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/pricing" element={<PricingPage />} />
      <Route path="/login" element={<LoginPage />} />
      
      {/* Protected App Routes */}
      <Route path="/app" element={
        <ProtectedRoute>
          <AppProviders>
            <DashboardPage />
          </AppProviders>
        </ProtectedRoute>
      } />
      <Route path="/app/schemas" element={
        <ProtectedRoute>
          <AppProviders>
            <SchemasPage />
          </AppProviders>
        </ProtectedRoute>
      } />
      <Route path="/app/settings" element={
        <ProtectedRoute>
          <AppProviders>
            <SettingsPage />
          </AppProviders>
        </ProtectedRoute>
      } />
      <Route path="/app/*" element={
        <ProtectedRoute>
          <AppProviders>
            <DashboardPage />
          </AppProviders>
        </ProtectedRoute>
      } />
      
      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppRoutes />
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
