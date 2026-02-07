// ProjectTabs - Tab bar component for workspace

import { X } from 'lucide-react';
import { useWorkspace } from '../../context';
import clsx from 'clsx';

export function ProjectTabs() {
  const { tabs, activeTabId, setActiveTab, closeTab } = useWorkspace();

  if (tabs.length === 0) {
    return null;
  }

  return (
    <div className="project-tabs">
      {tabs.map((tab) => (
        <div
          key={tab.id}
          className={clsx('project-tabs__tab', {
            'project-tabs__tab--active': tab.id === activeTabId,
          })}
          onClick={() => setActiveTab(tab.id)}
        >
          <span className="project-tabs__tab-title">{tab.title}</span>
          <button
            className="project-tabs__tab-close"
            onClick={(e) => {
              e.stopPropagation();
              closeTab(tab.id);
            }}
            aria-label={`Close ${tab.title}`}
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
