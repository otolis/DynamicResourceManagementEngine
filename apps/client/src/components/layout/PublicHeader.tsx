import { Link, useLocation } from 'react-router-dom';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../context';
import { CyberButton } from '../ui/cyberButton';

export function PublicHeader() {
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const handleThemeToggle = () => {
    console.log('Theme toggle clicked! Current theme:', theme);
    toggleTheme();
    console.log('Toggle function called');
  };

  return (
    <nav className="public-nav">
      <Link to="/" className="public-nav__logo">
        <span className="public-nav__logo-icon">&#9670;</span>
        DRME
      </Link>
      <div className="public-nav__links">
        <Link 
          to="/features" 
          className={`public-nav__link ${isActive('/features') ? 'public-nav__link--active' : ''}`}
        >
          Features
        </Link>
        <Link 
          to="/pricing" 
          className={`public-nav__link ${isActive('/pricing') ? 'public-nav__link--active' : ''}`}
        >
          Pricing
        </Link>
        <Link 
          to="/about" 
          className={`public-nav__link ${isActive('/about') ? 'public-nav__link--active' : ''}`}
        >
          About
        </Link>
        <Link 
          to="/contact" 
          className={`public-nav__link ${isActive('/contact') ? 'public-nav__link--active' : ''}`}
        >
          Contact
        </Link>
        <CyberButton 
          variant="ghost" 
          size="sm"
          onClick={handleThemeToggle}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          className="public-nav__theme-toggle"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </CyberButton>
        <Link to="/register">
          <CyberButton variant="glass" size="sm">Register</CyberButton>
        </Link>
        <Link to="/app">
          <CyberButton variant="primary" size="sm">Enter App</CyberButton>
        </Link>
      </div>
    </nav>
  );
}
