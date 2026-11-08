export const getToken = () => localStorage.getItem('token');
export const setToken = (token) => localStorage.setItem('token', token);
export const removeToken = () => localStorage.removeItem('token');

export async function fetchApi(endpoint, options = {}) {
  const token = getToken();

  const headers = {
    'Accept': 'application/json',
    ...options.headers,
  };

  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }


  const config = {
    ...options,
    credentials: 'include',
    headers,
  };

  const response = await fetch(endpoint, config);

  if (response.status === 204) {
    return null;
  }

  let data;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    if (response.status === 401) {
      removeToken();
    }
    const problemDetail = data && typeof data === 'object' ? (data.detail || data.title) : null;
    const errorMessage = problemDetail || (response.status === 500
      ? 'Wystąpił nieoczekiwany błąd komunikacji z serwerem.'
      : response.status === 401
       ?'Błędny login lub hasło / sesja wygasła'
       : `Wystąpił błąd podczas operacji (kod ${response.status})`);
      
    const error = new Error(errorMessage);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const authApi = {
  login: async (username, password) => {
    const data = await fetchApi('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    if (data.accessToken) {
      setToken(data.accessToken);
    }
    return data;
  },
  logout: async () => {
    try {
      await fetchApi('/api/auth/logout', { method: 'POST' });
    } finally {
      removeToken();
    }
  },
  changePassword: (currentPassword, newPassword) =>
    fetchApi('/api/auth/password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),
};

export const seriesApi = {
  getAll: () => fetchApi('/api/series'),
  getById: (id) => fetchApi(`/api/series/${id}`),
  create: (seriesData) =>
    fetchApi('/api/series', {
      method: 'POST',
      body: JSON.stringify(seriesData),
    }),
  update: (id, seriesData) =>
    fetchApi(`/api/series/${id}`, {
      method: 'PUT',
      body: JSON.stringify(seriesData),
    }),
  delete: (id) =>
    fetchApi(`/api/series/${id}`, {
      method: 'DELETE',
    }),
};

export const measurementsApi = {
  get: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.series) params.append('series', filters.series);
    if (filters.from) params.append('from', filters.from);
    if (filters.to) params.append('to', filters.to);
    if (filters.sort) params.append('sort', filters.sort);
    if (filters.limit) params.append('limit', filters.limit);

    const queryString = params.toString();
    return fetchApi(`/api/measurements${queryString ? `?${queryString}` : ''}`);
  },
  getById: (id) => fetchApi(`/api/measurements/${id}`),
};

export const sensorsApi = {
  getAll: () => fetchApi('/api/sensors'),
  getById: (id) => fetchApi(`/api/sensors/${id}`),
  create: (name, seriesId) =>
    fetchApi('/api/sensors', {
      method: 'POST',
      body: JSON.stringify({ name, seriesId }),
    }),
  delete: (id) =>
    fetchApi(`/api/sensors/${id}`, {
      method: 'DELETE',
    }),
};