import { Routes, Route, Navigate } from 'react-router-dom';
import './styles/base.css';
import './styles/components.css';
import './styles/layout.css';
import './styles/pages.css';

// Public Pages
import { LandingPage } from './pages/landingPage';
import { FeaturesPage } from './pages/featuresPage';
import { AboutPage } from './pages/aboutPage';
import { ContactPage } from './pages/contactPage';
import { PricingPage } from './pages/pricingPage';
import { DashboardPage } from './pages/dashboardPage';

function App() {
  return (
    <Routes>
      {/* Public Pages */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/features" element={<FeaturesPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/pricing" element={<PricingPage />} />
      
      {/* App Routes */}
      <Route path="/app" element={<DashboardPage />} />
      <Route path="/app/*" element={<DashboardPage />} />
      
      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
