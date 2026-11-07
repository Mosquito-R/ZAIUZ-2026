/**
 * Moduł API klienta IoT Dashboard
 * Obsługuje komunikację z backendem REST zgodnym z RFC 9457 Problem Details
 */

const API_BASE = '/api';

class ApiError extends Error {
  constructor(status, title, detail, raw) {
    super(detail || title || `Błąd serwera (${status})`);
    this.name = 'ApiError';
    this.status = status;
    this.title = title;
    this.detail = detail;
    this.raw = raw;
  }
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Accept': 'application/json',
    ...options.headers,
  };

  const token = localStorage.getItem('jwt_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let body = options.body;
  if (body !== undefined && typeof body !== 'string') {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, {
      method: options.method || 'GET',
      headers,
      body,
    });

    if (response.status === 204) {
      return null;
    }

    const contentType = response.headers.get('content-type') || '';
    let data = null;
    if (contentType.includes('application/json') || contentType.includes('application/problem+json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      try { data = JSON.parse(text); } catch { data = { detail: text }; }
    }

    if (!response.ok) {
      const detail = data?.detail || data?.error || data?.title || 'Nieznany błąd';
      const title = data?.title || `Błąd ${response.status}`;
      throw new ApiError(response.status, title, detail, data);
    }

    return data;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(0, 'Błąd sieci', err.message || 'Nie można połączyć się z serwerem');
  }
}

const api = {
  // === Uwierzytelnianie (F8) ===
  async login(username, password) {
    const res = await request('/auth/login', {
      method: 'POST',
      body: { username, password },
    });
    if (res?.accessToken) {
      localStorage.setItem('jwt_token', res.accessToken);
      localStorage.setItem('auth_user', username);
    }
    return res;
  },

  async logout() {
    try {
      await request('/auth/logout', { method: 'POST' });
    } finally {
      localStorage.removeItem('jwt_token');
      localStorage.removeItem('auth_user');
    }
  },

  async changePassword(currentPassword, newPassword) {
    return request('/auth/password', {
      method: 'PUT',
      body: { currentPassword, newPassword },
    });
  },

  // === Serie pomiarowe (F2, F3) ===
  async getSeries() {
    return request('/series');
  },

  async getSeriesById(id) {
    return request(`/series/${id}`);
  },

  async createSeries(seriesData) {
    return request('/series', {
      method: 'POST',
      body: seriesData,
    });
  },

  async updateSeries(id, seriesData) {
    return request(`/series/${id}`, {
      method: 'PUT',
      body: seriesData,
    });
  },

  async deleteSeries(id) {
    return request(`/series/${id}`, {
      method: 'DELETE',
    });
  },

  // === Czujniki (F12) ===
  async getSensors() {
    return request('/sensors');
  },

  async createSensor(sensorData) {
    return request('/sensors', {
      method: 'POST',
      body: sensorData,
    });
  },

  async deleteSensor(id) {
    return request(`/sensors/${id}`, {
      method: 'DELETE',
    });
  },

  // === Pomiary (F1, F5) ===
  async getMeasurements({ series = [], from, to, sort = 'timestamp', limit = 1000 } = {}) {
    const params = new URLSearchParams();
    if (Array.isArray(series) && series.length > 0) {
      params.append('series', series.join(','));
    }
    if (from && from.trim() !== '') {
      params.append('from', new Date(from).toISOString());
    }
    if (to && to.trim() !== '') {
      params.append('to', new Date(to).toISOString());
    }
    if (sort) {
      params.append('sort', sort);
    }
    if (limit) {
      params.append('limit', limit);
    }

    const qs = params.toString();
    return request(`/measurements${qs ? '?' + qs : ''}`);
  },
};

