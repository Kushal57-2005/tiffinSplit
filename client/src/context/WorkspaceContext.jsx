import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const WorkspaceContext = createContext();

export function WorkspaceProvider({ children }) {
  const { workspaces, activeWorkspaceId, switchWorkspace } = useAuth();
  const [currentWorkspace, setCurrentWorkspace] = useState(null);

  useEffect(() => {
    if (workspaces && activeWorkspaceId) {
      const found = workspaces.find((w) => w.id === activeWorkspaceId);
      setCurrentWorkspace(found || null);
    } else {
      setCurrentWorkspace(null);
    }
  }, [workspaces, activeWorkspaceId]);

  return (
    <WorkspaceContext.Provider
      value={{
        workspaces,
        activeWorkspaceId,
        currentWorkspace,
        switchWorkspace
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  return useContext(WorkspaceContext);
}
