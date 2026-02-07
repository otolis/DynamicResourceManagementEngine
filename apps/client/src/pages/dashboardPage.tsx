import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Folder, Plus, FolderOpen, AlertCircle, Loader, Star, MessageSquare, 
  Pin, Clock, Zap 
} from 'lucide-react';
import { FluidShell } from '../components/layout/fluidShell';
import { ProjectTabs, ProjectPanel, CommentsPanel } from '../components/workspace';
import { CyberButton } from '../components/ui/cyberButton';
import { CreateEntityModal } from '../components/ui/modal';
import { PriorityBadge, PriorityPicker } from '../components/ui/PriorityPicker';
import { CommandPalette, useCommandPaletteCommands } from '../components/ui/CommandPalette';
import { QuickActionsMenu, useProjectQuickActions } from '../components/ui/QuickActionsMenu';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { 
  useWorkspace, useFavorites, useComments, useToast, usePins, useRecent, useActivity 
} from '../context';
import { entityTypesApi, type EntityType } from '../api';
import '../styles/workspace.css';

export function DashboardPage() {
  const navigate = useNavigate();
  const { tabs, activeTabId, openTab, getActiveTab, setActiveTab } = useWorkspace();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { isPinned, togglePin } = usePins();
  const { addRecent } = useRecent();
  const { addActivity } = useActivity();
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
    addRecent(project.id, project.displayName);
    addActivity({
      type: 'open',
      entityType: 'project',
      entityId: project.id,
      entityName: project.displayName,
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

      addActivity({
        type: 'create',
        entityType: 'project',
        entityId: newProject.id,
        entityName: newProject.displayName,
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
      
      addActivity({
        type: 'update',
        entityType: 'project',
        entityId: activeTab.data.id,
        entityName: data.displayName as string,
      });

      toast.success('Saved', 'Project changes saved successfully.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save project';
      toast.error('Save Failed', message);
    }
  };

  // Sort projects: pinned first, then favorites, then by name
  const sortedProjects = useMemo(() => {
    return [...projects].sort((a, b) => {
      const aPinned = isPinned(a.id);
      const bPinned = isPinned(b.id);
      const aFav = isFavorite(a.id);
      const bFav = isFavorite(b.id);
      
      // Pinned first
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;
      
      // Then favorites
      if (aFav && !bFav) return -1;
      if (!aFav && bFav) return 1;
      
      // Then alphabetical
      return a.displayName.localeCompare(b.displayName);
    });
  }, [projects, isPinned, isFavorite]);

  // Separate pinned projects
  const pinnedProjects = sortedProjects.filter((p) => isPinned(p.id));
  const regularProjects = sortedProjects.filter((p) => !isPinned(p.id));

  // Command palette commands
  const commands = useCommandPaletteCommands(
    projects,
    handleOpenProjectById,
    () => setIsCreateModalOpen(true),
    navigate,
  );

  // Keyboard shortcuts
  useKeyboardShortcuts([
    { key: 'k', ctrl: true, handler: () => setIsCommandPaletteOpen(true), description: 'Open command palette' },
    { key: 'n', ctrl: true, handler: () => setIsCreateModalOpen(true), description: 'Create new project' },
    { key: 'Escape', handler: () => { setIsCommandPaletteOpen(false); setIsCreateModalOpen(false); }, description: 'Close modal' },
    ...Array.from({ length: 5 }, (_, i) => ({
      key: String(i + 1),
      alt: true,
      handler: () => { const tab = tabs[i]; if (tab) setActiveTab(tab.id); },
      description: `Switch to tab ${i + 1}`,
    })),
  ]);

  const activeTab = getActiveTab();

  // Project item renderer
  const renderProjectItem = (project: EntityType, showPinBadge = false) => {
    const isActive = activeTabId === `project-${project.id}`;
    const isFav = isFavorite(project.id);
    const isPinnedProject = isPinned(project.id);
    const commentCount = getCommentCount(project.id);
    
    const quickActions = useProjectQuickActions(project.id, {
      onPin: () => {
        togglePin(project.id);
        toast.info(isPinnedProject ? 'Unpinned' : 'Pinned', `${project.displayName} ${isPinnedProject ? 'removed from' : 'added to'} pins`);
      },
      onStar: () => {
        toggleFavorite(project.id);
      },
      isPinned: isPinnedProject,
      isStarred: isFav,
    });
    
    return (
      <div
        key={project.id}
        className={`projects-sidebar__item ${isActive ? 'projects-sidebar__item--active' : ''} ${isPinnedProject ? 'projects-sidebar__item--pinned' : ''}`}
        onClick={() => handleProjectClick(project)}
      >
        {/* Star button */}
        <button
          className={`projects-sidebar__star-btn ${isFav ? 'projects-sidebar__star-btn--active' : ''}`}
          onClick={(e) => { e.stopPropagation(); toggleFavorite(project.id); }}
        >
          <Star size={14} fill={isFav ? '#eab308' : 'none'} />
        </button>
        
        {/* Folder icon */}
        <span className="projects-sidebar__item-icon">
          {isActive ? <FolderOpen size={18} /> : <Folder size={18} />}
        </span>
        
        {/* Project content */}
        <div className="projects-sidebar__item-content">
          <span className="projects-sidebar__item-name">{project.displayName}</span>
          <span className="projects-sidebar__item-meta">
            {project.tableName}
            {commentCount > 0 && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <MessageSquare size={10} />
                {commentCount}
              </span>
            )}
          </span>
        </div>
        
        {/* Badges */}
        <div className="projects-sidebar__item-badges">
          {showPinBadge && isPinnedProject && (
            <Pin size={12} style={{ color: 'var(--color-accent)', transform: 'rotate(45deg)' }} />
          )}
          <PriorityBadge projectId={project.id} />
        </div>
        
        {/* Quick actions menu */}
        <QuickActionsMenu actions={quickActions} />
      </div>
    );
  };

  // Sidebar content
  const sidebarContent = (
    <div className="projects-sidebar">
      {/* Pinned Section */}
      {pinnedProjects.length > 0 && (
        <div className="projects-sidebar__section">
          <div className="projects-sidebar__title">
            <Pin size={12} style={{ transform: 'rotate(45deg)' }} />
            Pinned
          </div>
          {pinnedProjects.map((p) => renderProjectItem(p, true))}
        </div>
      )}
      
      {pinnedProjects.length > 0 && <div className="projects-sidebar__divider" />}
      
      {/* All Projects Section */}
      <div className="projects-sidebar__section">
        <div className="projects-sidebar__title">
          <Folder size={12} />
          Projects
        </div>
        
        {isLoading && (
          <div className="projects-sidebar__loading">
            <Loader size={20} className="animate-spin" />
            <span>Loading...</span>
          </div>
        )}
        
        {error && !isLoading && (
          <div className="projects-sidebar__error">
            <AlertCircle size={16} />
            {error}
          </div>
        )}
        
        {!isLoading && regularProjects.map((p) => renderProjectItem(p))}
      </div>
      
      {/* New Project Button */}
      <CyberButton 
        variant="ghost" 
        size="sm" 
        className="projects-sidebar__new-btn"
        onClick={() => setIsCreateModalOpen(true)}
      >
        <Plus size={16} style={{ marginRight: 'var(--spacing-xs)' }} />
        New Project
      </CyberButton>

      {/* Keyboard Hints */}
      <div className="projects-sidebar__hints">
        <div className="projects-sidebar__hint-row">
          <span>Search</span>
          <span className="projects-sidebar__hint-key">Ctrl+K</span>
        </div>
        <div className="projects-sidebar__hint-row">
          <span>New</span>
          <span className="projects-sidebar__hint-key">Ctrl+N</span>
        </div>
        <div className="projects-sidebar__hint-row">
          <span>Switch</span>
          <span className="projects-sidebar__hint-key">Alt+1-5</span>
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
              {/* Section Tabs */}
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

                <div style={{ marginLeft: 'auto', display: 'flex', gap: 'var(--spacing-sm)' }}>
                  {/* Pin toggle */}
                  {activeTab.data && (
                    <button
                      onClick={() => {
                        togglePin(activeTab.data!.id);
                        toast.info(isPinned(activeTab.data!.id) ? 'Unpinned' : 'Pinned to top', activeTab.data!.displayName);
                      }}
                      style={{
                        padding: 'var(--spacing-sm)',
                        background: isPinned(activeTab.data.id) ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                        border: `1px solid ${isPinned(activeTab.data.id) ? 'var(--color-accent)' : 'var(--glass-border)'}`,
                        borderRadius: 'var(--radius-md)',
                        color: isPinned(activeTab.data.id) ? 'var(--color-accent)' : 'var(--color-text-muted)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                      title={isPinned(activeTab.data.id) ? 'Unpin' : 'Pin to top'}
                    >
                      <Pin size={16} style={{ transform: 'rotate(45deg)' }} />
                    </button>
                  )}
                  
                  <PriorityPicker projectId={activeTab.data.id} />
                </div>
              </div>

              {activeSection === 'form' ? (
                <ProjectPanel project={activeTab.data} onSave={handleSaveProject} />
              ) : (
                <CommentsPanel projectId={activeTab.data.id} />
              )}
            </div>
          ) : (
            <div className="workspace-empty">
              <div className="workspace-empty__icon">
                <Zap size={64} style={{ color: 'var(--color-accent)' }} />
              </div>
              <h3 className="workspace-empty__title">Ready to Build</h3>
              <p className="workspace-empty__text">
                Select a project from the sidebar, or press{' '}
                <kbd style={{ padding: '2px 6px', background: 'var(--glass-bg)', borderRadius: 4, fontFamily: 'var(--font-mono)' }}>Ctrl+K</kbd>{' '}
                to search everything.
              </p>
              <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-lg)' }}>
                <CyberButton variant="primary" onClick={() => setIsCreateModalOpen(true)}>
                  <Plus size={18} style={{ marginRight: 'var(--spacing-xs)' }} />
                  Create Project
                </CyberButton>
                <CyberButton variant="ghost" onClick={() => setIsCommandPaletteOpen(true)}>
                  <Clock size={18} style={{ marginRight: 'var(--spacing-xs)' }} />
                  Quick Search
                </CyberButton>
              </div>
            </div>
          )}
        </div>
      </FluidShell>

      <CommandPalette isOpen={isCommandPaletteOpen} onClose={() => setIsCommandPaletteOpen(false)} commands={commands} />
      <CreateEntityModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} onSubmit={handleCreateProject} title="Create New Project" submitLabel="Create Project" isLoading={isCreating} />
    </>
  );
}
