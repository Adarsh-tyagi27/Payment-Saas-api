// frontend/js/api.js
const API_BASE = 'http://localhost:3000/api/v1';

async function fetchAPI(endpoint, options = {}) {
  const token = localStorage.getItem('accessToken');
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  let response = await fetch(`${API_BASE}${endpoint}`, config);

  // If unauthorized (access token expired), try token rotation
  if (response.status === 401 && localStorage.getItem('refreshToken')) {
    console.log('🔄 Access token expired. Attempting token rotation...');
    const refreshSuccess = await refreshTokens();

    if (refreshSuccess) {
      // Retry original request with new token
      headers['Authorization'] = `Bearer ${localStorage.getItem('accessToken')}`;
      response = await fetch(`${API_BASE}${endpoint}`, config);
    } else {
      // Force logout if refresh token is invalid/expired
      localStorage.clear();
      window.location.href = 'login.html';
      return null;
    }
  }

  if (response.status === 204) return null;
  const json = await response.json();

  if (!response.ok) {
    throw new Error(json.message || 'Something went wrong');
  }

  return json.data;
}

async function refreshTokens() {
  try {
    const refreshToken = localStorage.getItem('refreshToken');
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) return false;
    const { data } = await res.json();
    
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    return true;
  } catch (err) {
    console.error('Failed to rotate refresh token:', err);
    return false;
  }
}
