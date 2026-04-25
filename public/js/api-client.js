/**
 * SnapTo AI — API Client
 * Fetch wrapper for all backend API calls
 */

const API = (() => {
  const BASE = '/api';

  function getToken() {
    return localStorage.getItem('snapto_token');
  }

  async function request(endpoint, options = {}) {
    const token = getToken();
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
      const res = await fetch(`${BASE}${endpoint}`, { ...options, headers });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      return data;
    } catch (err) {
      console.error(`[API] ${endpoint} failed:`, err.message);
      throw err;
    }
  }

  return {
    // Auth
    login: (username, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
    register: (username, password, name) => request('/auth/register', { method: 'POST', body: JSON.stringify({ username, password, name }) }),
    getMe: () => request('/auth/me'),

    // Employees
    getEmployees: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/employees${qs ? '?' + qs : ''}`);
    },
    getEmployee: (id) => request(`/employees/${id}`),

    // Alerts
    getAlerts: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/alerts${qs ? '?' + qs : ''}`);
    },
    getAlertStats: () => request('/alerts/stats'),
    resolveAlert: (id) => request(`/alerts/${id}/resolve`, { method: 'POST' }),

    // Analytics
    getSnapshot: () => request('/analytics/snapshot'),
    getProductivity: () => request('/analytics/productivity'),
    getHourly: () => request('/analytics/hourly'),
    getDepartments: () => request('/analytics/departments'),

    // Cameras
    getCameras: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/cameras${qs ? '?' + qs : ''}`);
    },
    getCamera: (id) => request(`/cameras/${id}`),
    scanCamera: (id) => request(`/cameras/${id}/scan`, { method: 'POST' }),

    // Reports
    getReports: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/reports${qs ? '?' + qs : ''}`);
    },
    generateReport: (alertId) => request('/reports/generate', { method: 'POST', body: JSON.stringify({ alertId }) }),
    generateDailyReport: () => request('/reports/daily', { method: 'POST' }),

    // Admin (Customers/Leads)
    getLeads: () => request('/admin/leads'),
    getMeetings: () => request('/admin/meetings'),

    // Health
    health: () => request('/health'),
  };
})();
