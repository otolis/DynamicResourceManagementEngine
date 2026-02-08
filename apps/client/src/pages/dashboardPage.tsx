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

  const sortedProjects = useMemo(() => {
    return [...projects].sort((a, b) => {
      const aPinned = isPinned(a.id);
      const bPinned = isPinned(b.id);
      const aFav = isFavorite(a.id);
      const bFav = isFavorite(b.id);

      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;
      if (aFav && !bFav) return -1;
      if (!aFav && bFav) return 1;

      return a.displayName.localeCompare(b.displayName);
    });
  }, [projects, isPinned, isFavorite]);

  const pinnedProjects = sortedProjects.filter((p) => isPinned(p.id));
  const regularProjects = sortedProjects.filter((p) => !isPinned(p.id));

  const commands = useCommandPaletteCommands(
    projects,
    handleOpenProjectById,
    () => setIsCreateModalOpen(true),
    navigate,
  );

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
        <button
          className={`projects-sidebar__star-btn ${isFav ? 'projects-sidebar__star-btn--active' : ''}`}
          onClick={(e) => { e.stopPropagation(); toggleFavorite(project.id); }}
        >
          <Star size={14} fill={isFav ? 'currentColor' : 'none'} />
        </button>

        <span className="projects-sidebar__item-icon">
          {isActive ? <FolderOpen size={16} /> : <Folder size={16} />}
        </span>

        <div className="projects-sidebar__item-content">
          <span className="projects-sidebar__item-name">{project.displayName}</span>
          <span className="projects-sidebar__item-meta">
            {project.tableName}
            {commentCount > 0 && (
              <span className="flex items-center gap-xs">
                <MessageSquare size={10} />
                {commentCount}
              </span>
            )}
          </span>
        </div>

        <div className="projects-sidebar__item-badges">
          {showPinBadge && isPinnedProject && (
            <Pin size={12} className="text-accent" />
          )}
          <PriorityBadge projectId={project.id} />
        </div>

        <QuickActionsMenu actions={quickActions} />
      </div>
    );
  };

  const sidebarContent = (
    <div className="projects-sidebar">
      {pinnedProjects.length > 0 && (
        <div className="projects-sidebar__section">
          <div className="projects-sidebar__title">
            <Pin size={12} />
            Pinned
          </div>
          {pinnedProjects.map((p) => renderProjectItem(p, true))}
        </div>
      )}

      {pinnedProjects.length > 0 && <div className="projects-sidebar__divider" />}

      <div className="projects-sidebar__section">
        <div className="projects-sidebar__title">
          <Folder size={12} />
          Projects
        </div>

        {isLoading && (
          <div className="projects-sidebar__loading">
            <Loader size={18} className="animate-spin" />
            <span>Loading...</span>
          </div>
        )}

        {error && !isLoading && (
          <div className="projects-sidebar__error">
            <AlertCircle size={14} />
            {error}
          </div>
        )}

        {!isLoading && regularProjects.map((p) => renderProjectItem(p))}
      </div>

      <CyberButton
        variant="ghost"
        size="sm"
        className="projects-sidebar__new-btn"
        onClick={() => setIsCreateModalOpen(true)}
      >
        <Plus size={14} />
        New Project
      </CyberButton>

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

        <div className="flex-col" style={{ flex: 1, overflow: 'auto' }}>
          {activeTab && activeTab.data ? (
            <div className="project-panel">
              {/* Section Tabs */}
              <div className="section-tabs">
                <button
                  onClick={() => setActiveSection('form')}
                  className={`section-tab ${activeSection === 'form' ? 'section-tab--active' : ''}`}
                >
                  <Folder size={14} />
                  Details
                </button>
                <button
                  onClick={() => setActiveSection('comments')}
                  className={`section-tab ${activeSection === 'comments' ? 'section-tab--active' : ''}`}
                >
                  <MessageSquare size={14} />
                  Comments
                  {getCommentCount(activeTab.data.id) > 0 && (
                    <span className="section-tab__badge">
                      {getCommentCount(activeTab.data.id)}
                    </span>
                  )}
                </button>

                <div className="content-toolbar">
                  {activeTab.data && (
                    <button
                      onClick={() => {
                        togglePin(activeTab.data!.id);
                        toast.info(isPinned(activeTab.data!.id) ? 'Unpinned' : 'Pinned to top', activeTab.data!.displayName);
                      }}
                      className={`toolbar-btn ${isPinned(activeTab.data.id) ? 'toolbar-btn--active' : ''}`}
                      title={isPinned(activeTab.data.id) ? 'Unpin' : 'Pin to top'}
                    >
                      <Pin size={14} />
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
                <Zap size={48} />
              </div>
              <h3 className="workspace-empty__title">Ready to Build</h3>
              <p className="workspace-empty__text">
                Select a project from the sidebar, or press{' '}
                <kbd className="kbd">Ctrl+K</kbd>{' '}
                to search everything.
              </p>
              <div className="flex gap-md" style={{ marginTop: 'var(--spacing-lg)' }}>
                <CyberButton variant="primary" onClick={() => setIsCreateModalOpen(true)}>
                  <Plus size={16} />
                  Create Project
                </CyberButton>
                <CyberButton variant="glass" onClick={() => setIsCommandPaletteOpen(true)}>
                  <Clock size={16} />
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
