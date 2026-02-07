import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Folder, Plus, FolderOpen, AlertCircle, Loader, Star, MessageSquare } from 'lucide-react';
import { FluidShell } from '../components/layout/fluidShell';
import { ProjectTabs, ProjectPanel, CommentsPanel } from '../components/workspace';
import { CyberButton } from '../components/ui/cyberButton';
import { CreateEntityModal } from '../components/ui/modal';
import { PriorityBadge, PriorityPicker } from '../components/ui/PriorityPicker';
import { CommandPalette, useCommandPaletteCommands } from '../components/ui/CommandPalette';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useWorkspace, useFavorites, useComments, useToast } from '../context';
import { entityTypesApi, type EntityType } from '../api';
import '../styles/workspace.css';

export function DashboardPage() {
  const navigate = useNavigate();
  const { tabs, activeTabId, openTab, getActiveTab, setActiveTab } = useWorkspace();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { getCommentCount } = useComments();
  const toast = useToast();
  const [projects, setProjects] = useState<EntityType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [activeSection, setActiveSection] = useState<'form' | 'comments'>('form');
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Fetch projects from backend
  const fetchProjects = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await entityTypesApi.getAll({ limit: 50 });
      setProjects(response.data);
    } catch (err) {
      const message = err instanceof Error ? err.message :
        (err as { message?: string })?.message || 'Failed to load projects';
      setError(message);
      setProjects([
        { id: 'demo-1', tenantId: 'default', name: 'project', displayName: 'Project', description: 'Manage projects', tableName: 'projects', isActive: true, createdAt: '', updatedAt: '' },
        { id: 'demo-2', tenantId: 'default', name: 'task', displayName: 'Task', description: 'Track tasks', tableName: 'tasks', isActive: true, createdAt: '', updatedAt: '' },
        { id: 'demo-3', tenantId: 'default', name: 'user', displayName: 'User', description: 'User management', tableName: 'users', isActive: true, createdAt: '', updatedAt: '' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleProjectClick = (project: EntityType) => {
    openTab({
      id: `project-${project.id}`,
      title: project.displayName,
      type: 'project',
      data: project,
    });
  };

  const handleOpenProjectById = useCallback((projectId: string) => {
    const project = projects.find((p) => p.id === projectId);
    if (project) handleProjectClick(project);
  }, [projects]);

  const handleCreateProject = async (data: { name: string; displayName: string; description: string }) => {
    setIsCreating(true);
    try {
      const newProject = await entityTypesApi.create({
        name: data.name,
        displayName: data.displayName,
        description: data.description,
      });
      
      await fetchProjects();
      
      openTab({
        id: `project-${newProject.id}`,
        title: newProject.displayName,
        type: 'project',
        data: newProject,
      });

      toast.success('Project Created', `"${newProject.displayName}" has been created successfully.`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create project';
      toast.error('Creation Failed', message);
      throw err;
    } finally {
      setIsCreating(false);
    }
  };

  const handleSaveProject = async (data: Record<string, unknown>) => {
    const activeTab = getActiveTab();
    if (!activeTab?.data) return;

    try {
      await entityTypesApi.update(activeTab.data.id, {
        displayName: data.displayName as string,
        description: data.description as string,
        isActive: data.isActive as boolean,
      });
      await fetchProjects();
      toast.success('Saved', 'Project changes saved successfully.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save project';
      toast.error('Save Failed', message);
    }
  };

  // Command palette commands
  const commands = useCommandPaletteCommands(
    projects,
    handleOpenProjectById,
    () => setIsCreateModalOpen(true),
    navigate,
  );

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: 'k',
      ctrl: true,
      handler: () => setIsCommandPaletteOpen(true),
      description: 'Open command palette',
    },
    {
      key: 'n',
      ctrl: true,
      handler: () => setIsCreateModalOpen(true),
      description: 'Create new project',
    },
    {
      key: 'Escape',
      handler: () => {
        setIsCommandPaletteOpen(false);
        setIsCreateModalOpen(false);
      },
      description: 'Close modal',
    },
    // Tab switching with Alt+1-5
    ...Array.from({ length: 5 }, (_, i) => ({
      key: String(i + 1),
      alt: true,
      handler: () => {
        const tab = tabs[i];
        if (tab) setActiveTab(tab.id);
      },
      description: `Switch to tab ${i + 1}`,
    })),
  ]);

  const activeTab = getActiveTab();

  // Sort projects: favorites first, then by name
  const sortedProjects = [...projects].sort((a, b) => {
    const aFav = isFavorite(a.id);
    const bFav = isFavorite(b.id);
    if (aFav && !bFav) return -1;
    if (!aFav && bFav) return 1;
    return a.displayName.localeCompare(b.displayName);
  });

  // Sidebar content
  const sidebarContent = (
    <div className="projects-sidebar">
      <div className="projects-sidebar__title">Saved Projects</div>
      
      {isLoading && (
        <div className="projects-sidebar__loading">
          <Loader size={20} className="animate-spin" />
          <span style={{ marginLeft: 'var(--spacing-sm)' }}>Loading...</span>
        </div>
      )}
      
      {error && !isLoading && (
        <div className="projects-sidebar__error">
          <AlertCircle size={16} style={{ marginRight: 'var(--spacing-xs)' }} />
          {error}
        </div>
      )}
      
      {!isLoading && sortedProjects.map((project) => {
        const isActive = activeTabId === `project-${project.id}`;
        const isFav = isFavorite(project.id);
        const commentCount = getCommentCount(project.id);
        
        return (
          <div
            key={project.id}
            className={`projects-sidebar__item ${isActive ? 'projects-sidebar__item--active' : ''}`}
            onClick={() => handleProjectClick(project)}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFavorite(project.id);
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: isFav ? '#eab308' : 'var(--color-text-muted)',
                cursor: 'pointer',
                padding: 2,
                display: 'flex',
                opacity: isFav ? 1 : 0.4,
                transition: 'opacity 0.2s, color 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
              onMouseLeave={(e) => { if (!isFav) e.currentTarget.style.opacity = '0.4'; }}
            >
              <Star size={14} fill={isFav ? '#eab308' : 'none'} />
            </button>
            
            <span className="projects-sidebar__item-icon">
              {isActive ? <FolderOpen size={18} /> : <Folder size={18} />}
            </span>
            
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {project.displayName}
            </span>
            
            <PriorityBadge projectId={project.id} />
            
            {commentCount > 0 && (
              <span style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 2, 
                fontSize: '0.75rem', 
                color: 'var(--color-text-muted)' 
              }}>
                <MessageSquare size={12} />
                {commentCount}
              </span>
            )}
          </div>
        );
      })}
      
      <CyberButton 
        variant="ghost" 
        size="sm" 
        style={{ marginTop: 'var(--spacing-md)' }}
        onClick={() => setIsCreateModalOpen(true)}
      >
        <Plus size={16} style={{ marginRight: 'var(--spacing-xs)' }} />
        New Project
      </CyberButton>

      {/* Keyboard shortcut hint */}
      <div style={{ 
        marginTop: 'var(--spacing-lg)', 
        padding: 'var(--spacing-sm)',
        background: 'var(--glass-bg)',
        borderRadius: 'var(--radius-md)',
        fontSize: '0.75rem',
        color: 'var(--color-text-muted)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span>Search</span>
          <span style={{ fontFamily: 'var(--font-mono)' }}>Ctrl+K</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>New</span>
          <span style={{ fontFamily: 'var(--font-mono)' }}>Ctrl+N</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <FluidShell sidebarContent={sidebarContent}>
        <ProjectTabs />
        
        <div style={{ flex: 1, overflow: 'auto' }}>
          {activeTab && activeTab.data ? (
            <div style={{ padding: 'var(--spacing-lg)' }}>
              <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)' }}>
                <button
                  onClick={() => setActiveSection('form')}
                  style={{
                    padding: 'var(--spacing-sm) var(--spacing-lg)',
                    background: activeSection === 'form' ? 'var(--glass-bg-active)' : 'transparent',
                    border: '1px solid var(--glass-border)',
                    borderRadius: 'var(--radius-md)',
                    color: activeSection === 'form' ? 'var(--color-text-bright)' : 'var(--color-text-muted)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--spacing-xs)',
                  }}
                >
                  <Folder size={16} />
                  Details
                </button>
                <button
                  onClick={() => setActiveSection('comments')}
                  style={{
                    padding: 'var(--spacing-sm) var(--spacing-lg)',
                    background: activeSection === 'comments' ? 'var(--glass-bg-active)' : 'transparent',
                    border: '1px solid var(--glass-border)',
                    borderRadius: 'var(--radius-md)',
                    color: activeSection === 'comments' ? 'var(--color-text-bright)' : 'var(--color-text-muted)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--spacing-xs)',
                  }}
                >
                  <MessageSquare size={16} />
                  Comments
                  {getCommentCount(activeTab.data.id) > 0 && (
                    <span style={{
                      padding: '2px 6px',
                      background: 'var(--color-accent)',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.75rem',
                      color: 'white',
                    }}>
                      {getCommentCount(activeTab.data.id)}
                    </span>
                  )}
                </button>

                <div style={{ marginLeft: 'auto' }}>
                  <PriorityPicker projectId={activeTab.data.id} />
                </div>
              </div>

              {activeSection === 'form' ? (
                <ProjectPanel
                  project={activeTab.data}
                  onSave={handleSaveProject}
                />
              ) : (
                <CommentsPanel projectId={activeTab.data.id} />
              )}
            </div>
          ) : (
            <div className="workspace-empty">
              <div className="workspace-empty__icon">📂</div>
              <h3 className="workspace-empty__title">No Project Open</h3>
              <p className="workspace-empty__text">
                Select a project from the sidebar to open it, or press <kbd style={{ 
                  padding: '2px 6px', 
                  background: 'var(--glass-bg)', 
                  borderRadius: 4,
                  fontFamily: 'var(--font-mono)',
                }}>Ctrl+K</kbd> to search.
              </p>
              <CyberButton 
                variant="primary" 
                style={{ marginTop: 'var(--spacing-lg)' }}
                onClick={() => setIsCreateModalOpen(true)}
              >
                <Plus size={18} style={{ marginRight: 'var(--spacing-xs)' }} />
                Create New Project
              </CyberButton>
            </div>
          )}
        </div>
      </FluidShell>

      {/* Command Palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        commands={commands}
      />

      {/* Create Project Modal */}
      <CreateEntityModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateProject}
        title="Create New Project"
        submitLabel="Create Project"
        isLoading={isCreating}
      />
    </>
  );
}
