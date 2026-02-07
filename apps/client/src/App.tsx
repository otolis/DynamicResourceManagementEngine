import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, WorkspaceProvider, useAuth } from './context';
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
          <WorkspaceProvider>
            <DashboardPage />
          </WorkspaceProvider>
        </ProtectedRoute>
      } />
      <Route path="/app/schemas" element={
        <ProtectedRoute>
          <SchemasPage />
        </ProtectedRoute>
      } />
      <Route path="/app/settings" element={
        <ProtectedRoute>
          <SettingsPage />
        </ProtectedRoute>
      } />
      <Route path="/app/*" element={
        <ProtectedRoute>
          <WorkspaceProvider>
            <DashboardPage />
          </WorkspaceProvider>
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
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
