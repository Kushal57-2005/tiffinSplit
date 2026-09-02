const rawBaseUrl = (import.meta.env.VITE_API_URL || '/api').trim();

let BASE_URL = rawBaseUrl;
if (BASE_URL.startsWith('http')) {
  try {
    const urlObj = new URL(BASE_URL);
    if (!urlObj.pathname.endsWith('/api') && !urlObj.pathname.endsWith('/api/')) {
      BASE_URL = `${urlObj.origin}/api`;
    } else {
      BASE_URL = BASE_URL.replace(/\/+$/, '');
    }
  } catch (e) {
    BASE_URL = rawBaseUrl;
  }
}

export async function apiRequest(path, options = {}) {
  const token = localStorage.getItem('tiffinsplit_token');
  const activeWorkspaceId = localStorage.getItem('tiffinsplit_workspace_id');

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (activeWorkspaceId) {
    headers['x-workspace-id'] = activeWorkspaceId;
  }

  let cleanPath = path.startsWith('/') ? path : '/' + path;
  if (BASE_URL.endsWith('/api') && cleanPath.startsWith('/api/')) {
    cleanPath = cleanPath.substring(4);
  }

  const url = path.startsWith('http') ? path : `${BASE_URL}${cleanPath}`;

  const response = await fetch(url, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `HTTP ${response.status}: Request failed`);
  }

  return data;
}
