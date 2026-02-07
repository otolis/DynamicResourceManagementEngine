import { useState, useEffect } from 'react';
import { Folder, Plus, FolderOpen, AlertCircle, Loader } from 'lucide-react';
import { FluidShell } from '../components/layout/fluidShell';
import { ProjectTabs, ProjectPanel } from '../components/workspace';
import { CyberButton } from '../components/ui/cyberButton';
import { CreateEntityModal } from '../components/ui/modal';
import { useWorkspace } from '../context';
import { entityTypesApi, type EntityType } from '../api';
import '../styles/workspace.css';

export function DashboardPage() {
  const { activeTabId, openTab, getActiveTab } = useWorkspace();
  const [projects, setProjects] = useState<EntityType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

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
      // Use demo projects on error
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

  const handleCreateProject = async (data: { name: string; displayName: string; description: string }) => {
    setIsCreating(true);
    try {
      // Create new entity type via API
      const newProject = await entityTypesApi.create({
        name: data.name,
        displayName: data.displayName,
        description: data.description,
      });
      
      // Refresh projects list
      await fetchProjects();
      
      // Open the new project in a tab
      openTab({
        id: `project-${newProject.id}`,
        title: newProject.displayName,
        type: 'project',
        data: newProject,
      });
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
      // Refresh projects list
      await fetchProjects();
    } catch (err) {
      console.error('Failed to save project:', err);
    }
  };

  const activeTab = getActiveTab();

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
      
      {!isLoading && projects.map((project) => (
        <div
          key={project.id}
          className={`projects-sidebar__item ${
            activeTabId === `project-${project.id}` ? 'projects-sidebar__item--active' : ''
          }`}
          onClick={() => handleProjectClick(project)}
        >
          <span className="projects-sidebar__item-icon">
            {activeTabId === `project-${project.id}` ? <FolderOpen size={18} /> : <Folder size={18} />}
          </span>
          {project.displayName}
        </div>
      ))}
      
      <CyberButton 
        variant="ghost" 
        size="sm" 
        style={{ marginTop: 'var(--spacing-md)' }}
        onClick={() => setIsCreateModalOpen(true)}
      >
        <Plus size={16} style={{ marginRight: 'var(--spacing-xs)' }} />
        New Project
      </CyberButton>
    </div>
  );

  return (
    <>
      <FluidShell sidebarContent={sidebarContent}>
        {/* Tab Bar */}
        <ProjectTabs />
        
        {/* Tab Content */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          {activeTab && activeTab.data ? (
            <ProjectPanel
              project={activeTab.data}
              onSave={handleSaveProject}
            />
          ) : (
            <div className="workspace-empty">
              <div className="workspace-empty__icon">📂</div>
              <h3 className="workspace-empty__title">No Project Open</h3>
              <p className="workspace-empty__text">
                Select a project from the sidebar to open it in a new tab, or create a new project to get started.
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
