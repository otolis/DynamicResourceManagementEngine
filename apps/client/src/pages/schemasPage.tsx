import { useState, useEffect } from 'react';
import { Plus, FileJson, Loader, AlertCircle } from 'lucide-react';
import { FluidShell } from '../components/layout/fluidShell';
import { CyberInput } from '../components/ui/cyberInput';
import { CyberButton } from '../components/ui/cyberButton';
import { AnimatedCard } from '../components/ui/animatedCard';
import { CreateEntityModal } from '../components/ui/modal';
import { entityTypesApi, type EntityType } from '../api';

export function SchemasPage() {
  const [schemas, setSchemas] = useState<EntityType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const fetchSchemas = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await entityTypesApi.getAll({ 
        limit: 50,
        search: searchQuery || undefined,
      });
      setSchemas(response.data);
    } catch (err) {
      const message = err instanceof Error ? err.message :
        (err as { message?: string })?.message || 'Failed to load schemas';
      setError(message);
      // Demo data on error
      setSchemas([
        { id: 'demo-1', tenantId: 'default', name: 'project', displayName: 'Project', description: 'Manage projects', tableName: 'projects', isActive: true, createdAt: '', updatedAt: '' },
        { id: 'demo-2', tenantId: 'default', name: 'task', displayName: 'Task', description: 'Track tasks', tableName: 'tasks', isActive: true, createdAt: '', updatedAt: '' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const debounce = setTimeout(fetchSchemas, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const handleCreateSchema = async (data: { name: string; displayName: string; description: string }) => {
    setIsCreating(true);
    try {
      await entityTypesApi.create({
        name: data.name,
        displayName: data.displayName,
        description: data.description,
      });
      // Refresh schemas list
      await fetchSchemas();
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <>
      <FluidShell>
        <div style={{ padding: 'var(--spacing-lg)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
            <h1 style={{ color: 'var(--color-text-bright)', fontSize: '1.75rem' }}>Schemas</h1>
            <CyberButton variant="primary" onClick={() => setIsCreateModalOpen(true)}>
              <Plus size={18} style={{ marginRight: 'var(--spacing-xs)' }} />
              New Schema
            </CyberButton>
          </div>

          <div style={{ marginBottom: 'var(--spacing-lg)', maxWidth: '400px' }}>
            <CyberInput
              placeholder="Search schemas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {error && (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 'var(--spacing-sm)',
              padding: 'var(--spacing-md)',
              background: 'var(--color-error-bg)',
              borderRadius: 'var(--radius-md)',
              marginBottom: 'var(--spacing-lg)',
              color: 'var(--color-error)',
            }}>
              <AlertCircle size={18} />
              {error} (showing demo data)
            </div>
          )}

          {isLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--spacing-xl)' }}>
              <Loader size={32} className="animate-spin" />
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--spacing-lg)' }}>
              {schemas.map((schema, index) => (
                <AnimatedCard key={schema.id} delay={index * 50}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--spacing-md)' }}>
                    <div style={{ 
                      padding: 'var(--spacing-sm)',
                      background: 'var(--glass-bg-active)',
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--color-accent)',
                    }}>
                      <FileJson size={24} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ color: 'var(--color-text-bright)', marginBottom: 'var(--spacing-xs)' }}>
                        {schema.displayName}
                      </h3>
                      <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: 'var(--spacing-sm)' }}>
                        {schema.description || 'No description'}
                      </p>
                      <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                        <span style={{ 
                          fontSize: '0.75rem',
                          padding: '2px 8px',
                          background: schema.isActive ? 'var(--color-success-bg)' : 'var(--glass-bg)',
                          color: schema.isActive ? 'var(--color-success)' : 'var(--color-text-muted)',
                          borderRadius: 'var(--radius-sm)',
                        }}>
                          {schema.isActive ? 'Active' : 'Inactive'}
                        </span>
                        <span style={{ 
                          fontSize: '0.75rem',
                          padding: '2px 8px',
                          background: 'var(--glass-bg)',
                          color: 'var(--color-text-muted)',
                          borderRadius: 'var(--radius-sm)',
                        }}>
                          {schema.tableName}
                        </span>
                      </div>
                    </div>
                  </div>
                </AnimatedCard>
              ))}
            </div>
          )}
        </div>
      </FluidShell>

      {/* Create Schema Modal */}
      <CreateEntityModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateSchema}
        title="Create New Schema"
        submitLabel="Create Schema"
        isLoading={isCreating}
      />
    </>
  );
}
