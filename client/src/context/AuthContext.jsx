import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest } from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('tiffinsplit_token') || null);
  const [user, setUser] = useState(() => {
    const u = localStorage.getItem('tiffinsplit_user');
    return u ? JSON.parse(u) : null;
  });
  const [workspaces, setWorkspaces] = useState([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState(() => {
    return localStorage.getItem('tiffinsplit_workspace_id') || null;
  });
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const data = await apiRequest('/auth/me');
      setUser(data.user);
      localStorage.setItem('tiffinsplit_user', JSON.stringify(data.user));

      setWorkspaces(data.workspaces || []);

      if (data.workspaces && data.workspaces.length > 0) {
        if (!activeWorkspaceId || !data.workspaces.some((w) => w.id === activeWorkspaceId)) {
          const firstId = data.workspaces[0].id;
          setActiveWorkspaceId(firstId);
          localStorage.setItem('tiffinsplit_workspace_id', firstId);
        }
      }
    } catch (err) {
      console.error('Failed to restore session:', err);
      logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, [token]);

  const login = async (email, password) => {
    const data = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });

    setToken(data.token);
    setUser(data.user);
    setWorkspaces(data.workspaces);

    localStorage.setItem('tiffinsplit_token', data.token);
    localStorage.setItem('tiffinsplit_user', JSON.stringify(data.user));

    if (data.workspaces && data.workspaces.length > 0) {
      setActiveWorkspaceId(data.workspaces[0].id);
      localStorage.setItem('tiffinsplit_workspace_id', data.workspaces[0].id);
    }

    return data;
  };

  const register = async (registerData) => {
    const data = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(registerData)
    });

    setToken(data.token);
    setUser(data.user);
    setWorkspaces(data.workspaces);

    localStorage.setItem('tiffinsplit_token', data.token);
    localStorage.setItem('tiffinsplit_user', JSON.stringify(data.user));

    if (data.workspaces && data.workspaces.length > 0) {
      setActiveWorkspaceId(data.workspaces[0].id);
      localStorage.setItem('tiffinsplit_workspace_id', data.workspaces[0].id);
    }

    return data;
  };

  const loginWithGoogle = async ({ credential, access_token, invitationToken, workspaceName }) => {
    if (!credential && !access_token) {
      throw new Error('Google credential or access token is required');
    }

    const payload = {};
    if (credential) payload.credential = credential;
    if (access_token) payload.access_token = access_token;
    if (invitationToken) payload.invitationToken = invitationToken;
    if (workspaceName) payload.workspaceName = workspaceName;

    const data = await apiRequest('/auth/google', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    setToken(data.token);
    setUser(data.user);
    setWorkspaces(data.workspaces);

    localStorage.setItem('tiffinsplit_token', data.token);
    localStorage.setItem('tiffinsplit_user', JSON.stringify(data.user));

    if (data.workspaces && data.workspaces.length > 0) {
      setActiveWorkspaceId(data.workspaces[0].id);
      localStorage.setItem('tiffinsplit_workspace_id', data.workspaces[0].id);
    }

    return data;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setWorkspaces([]);
    setActiveWorkspaceId(null);
    localStorage.removeItem('tiffinsplit_token');
    localStorage.removeItem('tiffinsplit_user');
    localStorage.removeItem('tiffinsplit_workspace_id');
  };

  const switchWorkspace = (workspaceId) => {
    setActiveWorkspaceId(workspaceId);
    localStorage.setItem('tiffinsplit_workspace_id', workspaceId);
  };

  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId) || null;

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        workspaces,
        activeWorkspaceId,
        activeWorkspace,
        loading,
        login,
        register,
        loginWithGoogle,
        logout,
        switchWorkspace,
        apiFetch: apiRequest,
        refreshUserData: fetchCurrentUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
