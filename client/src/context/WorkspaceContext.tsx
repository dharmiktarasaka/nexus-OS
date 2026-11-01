import React, { createContext, useContext, useState, useEffect } from 'react';

export interface Workspace {
  id: string;
  name: string;
  role: string;
  plan: string;
  initials: string;
}

interface WorkspaceContextType {
  currentWorkspace: Workspace;
  workspaces: Workspace[];
  switchWorkspace: (id: string) => void;
  favorites: string[];
  toggleFavorite: (appId: string) => void;
  isFavorite: (appId: string) => boolean;
  recentApps: Array<{ id: string; accessedAt: string }>;
  recordAppAccess: (appId: string) => void;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  mobileSidebarOpen: boolean;
  setMobileSidebarOpen: (open: boolean) => void;
  toggleMobileSidebar: () => void;
}

const DEFAULT_WORKSPACES: Workspace[] = [
  { id: 'ws_1', name: 'Tarasaka Enterprise HQ', role: 'Owner', plan: 'Enterprise OS', initials: 'TE' },
  { id: 'ws_2', name: 'Digital Growth Ventures', role: 'Admin', plan: 'Scale Tier', initials: 'DG' },
  { id: 'ws_3', name: 'Client Advisory Lab', role: 'Strategist', plan: 'Pro Suite', initials: 'CA' }
];

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [workspaces] = useState<Workspace[]>(DEFAULT_WORKSPACES);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace>(DEFAULT_WORKSPACES[0]);
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('nexus_favorites');
    return saved ? JSON.parse(saved) : ['crm', 'analytics'];
  });
  const [recentApps, setRecentApps] = useState<Array<{ id: string; accessedAt: string }>>(() => {
    const saved = localStorage.getItem('nexus_recent_apps');
    return saved ? JSON.parse(saved) : [
      { id: 'crm', accessedAt: new Date(Date.now() - 3600000).toISOString() },
      { id: 'website-builder', accessedAt: new Date(Date.now() - 7200000).toISOString() },
      { id: 'analytics', accessedAt: new Date(Date.now() - 14400000).toISOString() },
      { id: 'social', accessedAt: new Date(Date.now() - 86400000).toISOString() }
    ];
  });
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    const saved = localStorage.getItem('nexus_sidebar_collapsed');
    return saved === 'true';
  });
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);

  const toggleMobileSidebar = () => {
    setMobileSidebarOpen(prev => !prev);
  };

  const switchWorkspace = (id: string) => {
    const found = workspaces.find(w => w.id === id);
    if (found) setCurrentWorkspace(found);
  };

  const toggleFavorite = (appId: string) => {
    setFavorites(prev => {
      const next = prev.includes(appId) ? prev.filter(id => id !== appId) : [...prev, appId];
      localStorage.setItem('nexus_favorites', JSON.stringify(next));
      return next;
    });
  };

  const isFavorite = (appId: string) => favorites.includes(appId);

  const recordAppAccess = (appId: string) => {
    setRecentApps(prev => {
      const filtered = prev.filter(item => item.id !== appId);
      const next = [{ id: appId, accessedAt: new Date().toISOString() }, ...filtered].slice(0, 8);
      localStorage.setItem('nexus_recent_apps', JSON.stringify(next));
      return next;
    });
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('nexus_sidebar_collapsed', String(next));
      return next;
    });
  };

  return (
    <WorkspaceContext.Provider
      value={{
        currentWorkspace,
        workspaces,
        switchWorkspace,
        favorites,
        toggleFavorite,
        isFavorite,
        recentApps,
        recordAppAccess,
        sidebarCollapsed,
        toggleSidebar,
        setSidebarCollapsed,
        mobileSidebarOpen,
        setMobileSidebarOpen,
        toggleMobileSidebar
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (!context) throw new Error('useWorkspace must be used within a WorkspaceProvider');
  return context;
};

