import { useEffect, useRef, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileJson, Settings, Menu, X } from 'lucide-react';
import anime from 'animejs';
import { useState } from 'react';
import '../../styles/layout.css';

interface FluidShellProps {
  children: ReactNode;
}

export function FluidShell({ children }: FluidShellProps) {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const orb1Ref = useRef<HTMLDivElement>(null);
  const orb2Ref = useRef<HTMLDivElement>(null);
  const orb3Ref = useRef<HTMLDivElement>(null);

  // Animate gradient orbs
  useEffect(() => {
    const orbs = [orb1Ref.current, orb2Ref.current, orb3Ref.current];
    const animations: anime.AnimeInstance[] = [];

    orbs.forEach((orb, index) => {
      if (!orb) return;

      const anim = anime({
        targets: orb,
        translateX: [
          { value: (index + 1) * 20, duration: 4000 + index * 1000 },
          { value: -(index + 1) * 20, duration: 4000 + index * 1000 },
        ],
        translateY: [
          { value: -(index + 1) * 15, duration: 3000 + index * 800 },
          { value: (index + 1) * 15, duration: 3000 + index * 800 },
        ],
        scale: [
          { value: 1.1, duration: 5000 + index * 500 },
          { value: 0.9, duration: 5000 + index * 500 },
        ],
        easing: 'easeInOutSine',
        loop: true,
        direction: 'alternate',
      });

      animations.push(anim);
    });

    return () => {
      animations.forEach((anim) => anim.pause());
      orbs.forEach((orb) => orb && anime.remove(orb));
    };
  }, []);

  const navLinks = [
    { to: '/app', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/app/schemas', icon: FileJson, label: 'Schemas' },
    { to: '/app/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="fluid-shell">
      {/* Gradient Mesh Background */}
      <div className="mesh-background">
        <div ref={orb1Ref} className="mesh-orb mesh-orb--1" />
        <div ref={orb2Ref} className="mesh-orb mesh-orb--2" />
        <div ref={orb3Ref} className="mesh-orb mesh-orb--3" />
      </div>

      {/* Glass Header */}
      <header className="fluid-header">
        <div className="fluid-header__logo">
          <span className="fluid-header__logo-icon">◈</span>
          DRME
        </div>
        <div className="fluid-header__actions">
          <button
            className="cyber-button cyber-button--ghost cyber-button--sm fluid-header__menu-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* Glass Sidebar */}
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
                <Icon size={18} />
                {link.label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Main Content */}
      <main className="fluid-content">{children}</main>
    </div>
  );
}
