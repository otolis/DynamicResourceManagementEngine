import { type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FileJson, Settings, Menu, X, LogOut } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../context';
import '../../styles/layout.css';

interface FluidShellProps {
  children: ReactNode;
  sidebarContent?: ReactNode;
}

export function FluidShell({ children, sidebarContent }: FluidShellProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navLinks = [
    { to: '/app', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/app/schemas', icon: FileJson, label: 'Schemas' },
    { to: '/app/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="fluid-shell">
      {/* Header */}
      <header className="fluid-header">
        <div className="fluid-header__logo">
          <span className="fluid-header__logo-icon">&#9670;</span>
          DRME
        </div>
        <div className="fluid-header__user">
          {user && (
            <span className="text-sm text-muted">
              {user.email}
            </span>
          )}
          <button
            className="cyber-button cyber-button--ghost cyber-button--sm"
            onClick={handleLogout}
            aria-label="Logout"
          >
            <LogOut size={16} />
          </button>
        </div>
        <div className="fluid-header__actions">
          <button
            className="cyber-button cyber-button--ghost cyber-button--sm fluid-header__menu-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </header>

      {/* Sidebar */}
      <nav className={`fluid-sidebar ${sidebarOpen ? 'fluid-sidebar--open' : ''}`}>
        <div className="fluid-sidebar__section-title">Navigation</div>
        <div className="fluid-sidebar__nav">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`fluid-sidebar__link ${isActive ? 'fluid-sidebar__link--active' : ''}`}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon size={16} />
                {link.label}
              </Link>
            );
          })}
        </div>

        {sidebarContent && (
          <>
            <div className="fluid-sidebar__divider" />
            {sidebarContent}
          </>
        )}
      </nav>

      {/* Main Content */}
      <main className="fluid-content">{children}</main>
    </div>
  );
}
