import { User, Moon, Sun, Shield, Building2 } from 'lucide-react';
import { FluidShell } from '../components/layout/fluidShell';
import { CyberButton } from '../components/ui/cyberButton';
import { AnimatedCard } from '../components/ui/animatedCard';
import { useAuth, useTheme } from '../context';
import { apiClient } from '../api';

export function SettingsPage() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const tenantId = apiClient.getTenantId();

  return (
    <FluidShell>
      <div style={{ padding: 'var(--spacing-lg)', maxWidth: '800px' }}>
        <h1 style={{ color: 'var(--color-text-bright)', fontSize: '1.75rem', marginBottom: 'var(--spacing-lg)' }}>
          Settings
        </h1>

        {/* Profile Section */}
        <AnimatedCard>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)' }}>
            <div style={{ 
              padding: 'var(--spacing-md)',
              background: 'var(--glass-bg-active)',
              borderRadius: 'var(--radius-lg)',
              color: 'var(--color-accent)',
            }}>
              <User size={32} />
            </div>
            <div>
              <h2 style={{ color: 'var(--color-text-bright)', marginBottom: 'var(--spacing-xs)' }}>
                Profile
              </h2>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                Your account information
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gap: 'var(--spacing-md)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--spacing-sm) 0', borderBottom: '1px solid var(--glass-border)' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Email</span>
              <span style={{ color: 'var(--color-text-bright)' }}>{user?.email || 'Not logged in'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--spacing-sm) 0', borderBottom: '1px solid var(--glass-border)' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Name</span>
              <span style={{ color: 'var(--color-text-bright)' }}>
                {user?.firstName && user?.lastName 
                  ? `${user.firstName} ${user.lastName}` 
                  : 'Not set'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--spacing-sm) 0' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>User ID</span>
              <span style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', fontFamily: 'monospace' }}>
                {user?.id || '—'}
              </span>
            </div>
          </div>
        </AnimatedCard>

        {/* Roles Section */}
        <AnimatedCard delay={50}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)' }}>
            <div style={{ 
              padding: 'var(--spacing-md)',
              background: 'var(--glass-bg-active)',
              borderRadius: 'var(--radius-lg)',
              color: 'var(--color-accent)',
            }}>
              <Shield size={32} />
            </div>
            <div>
              <h2 style={{ color: 'var(--color-text-bright)', marginBottom: 'var(--spacing-xs)' }}>
                Roles & Permissions
              </h2>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                Your access levels
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-sm)' }}>
            {user?.roles?.length ? user.roles.map((role) => (
              <span
                key={role}
                style={{
                  padding: 'var(--spacing-xs) var(--spacing-md)',
                  background: 'var(--glass-bg-active)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--color-accent-light)',
                  fontSize: '0.875rem',
                }}
              >
                {role}
              </span>
            )) : (
              <span style={{ color: 'var(--color-text-muted)' }}>No roles assigned</span>
            )}
          </div>
        </AnimatedCard>

        {/* Tenant Section */}
        <AnimatedCard delay={100}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)' }}>
            <div style={{ 
              padding: 'var(--spacing-md)',
              background: 'var(--glass-bg-active)',
              borderRadius: 'var(--radius-lg)',
              color: 'var(--color-accent)',
            }}>
              <Building2 size={32} />
            </div>
            <div>
              <h2 style={{ color: 'var(--color-text-bright)', marginBottom: 'var(--spacing-xs)' }}>
                Organization
              </h2>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                Tenant information
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--spacing-sm) 0' }}>
            <span style={{ color: 'var(--color-text-muted)' }}>Tenant ID</span>
            <span style={{ color: 'var(--color-text-bright)', fontFamily: 'monospace' }}>{tenantId}</span>
          </div>
        </AnimatedCard>

        {/* Appearance Section */}
        <AnimatedCard delay={150}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
              <div style={{ 
                padding: 'var(--spacing-md)',
                background: 'var(--glass-bg-active)',
                borderRadius: 'var(--radius-lg)',
                color: 'var(--color-accent)',
              }}>
                {theme === 'dark' ? <Moon size={32} /> : <Sun size={32} />}
              </div>
              <div>
                <h2 style={{ color: 'var(--color-text-bright)', marginBottom: 'var(--spacing-xs)' }}>
                  Appearance
                </h2>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                  Currently using {theme} theme
                </p>
              </div>
            </div>
            <CyberButton variant="glass" onClick={toggleTheme}>
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              <span style={{ marginLeft: 'var(--spacing-xs)' }}>
                Switch to {theme === 'dark' ? 'Light' : 'Dark'}
              </span>
            </CyberButton>
          </div>
        </AnimatedCard>
      </div>
    </FluidShell>
  );
}
