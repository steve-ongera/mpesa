// services/api.js - M-PESA API Service Layer

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws';

// ===== HTTP CLIENT =====
class ApiClient {
  constructor() {
    this.baseURL = BASE_URL;
  }

  getHeaders(isAuth = true) {
    const headers = { 'Content-Type': 'application/json' };
    if (isAuth) {
      const token = localStorage.getItem('access_token');
      if (token) headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: this.getHeaders(!options.public),
      ...options,
    };

    try {
      const response = await fetch(url, config);

      // Token refresh on 401
      if (response.status === 401 && !options._retry) {
        const refreshed = await this.refreshToken();
        if (refreshed) {
          return this.request(endpoint, { ...options, _retry: true });
        }
        this.logout();
        return null;
      }

      const data = await response.json();

      if (!response.ok) {
        throw { ...data, status: response.status };
      }

      return data;
    } catch (error) {
      if (error.status) throw error;
      throw { error: 'Network error. Please check your connection.', status: 0 };
    }
  }

  async refreshToken() {
    const refresh = localStorage.getItem('refresh_token');
    if (!refresh) return false;

    try {
      const response = await fetch(`${this.baseURL}/auth/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('access_token', data.access);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  }

  get(endpoint, options = {}) {
    return this.request(endpoint, { method: 'GET', ...options });
  }

  post(endpoint, body, options = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
      ...options,
    });
  }

  put(endpoint, body, options = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
      ...options,
    });
  }

  patch(endpoint, body, options = {}) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body),
      ...options,
    });
  }

  delete(endpoint, options = {}) {
    return this.request(endpoint, { method: 'DELETE', ...options });
  }
}

const api = new ApiClient();

// ===== AUTH API =====
export const authAPI = {
  login: (phone_number, password) =>
    api.post('/auth/login/', { phone_number, password }, { public: true }),

  register: (userData) =>
    api.post('/auth/register/', userData, { public: true }),

  refreshToken: () => api.refreshToken(),
};

// ===== DASHBOARD =====
export const dashboardAPI = {
  getDashboard: () => api.get('/dashboard/'),
  getBalance: () => api.get('/balance/'),
};

// ===== TRANSACTIONS =====
export const transactionAPI = {
  sendMoney: (data) => api.post('/send-money/', data),
  withdraw: (data) => api.post('/withdraw/', data),
  buyAirtime: (data) => api.post('/buy-airtime/', data),
  paybill: (data) => api.post('/paybill/', data),
  buyGoods: (data) => api.post('/buy-goods/', data),
  getHistory: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return api.get(`/transactions/${query ? `?${query}` : ''}`);
  },
  getMiniStatement: (account = 'mpesa') =>
    api.get(`/mini-statement/?account=${account}`),
};

// ===== M-SHWARI =====
export const mshwariAPI = {
  deposit: (data) => api.post('/mshwari/deposit/', data),
  withdraw: (data) => api.post('/mshwari/withdraw/', data),
  lockSavings: (data) => api.post('/mshwari/lock/', data),
  applyLoan: (data) => api.post('/mshwari/loan/', data),
};

// ===== KCB M-PESA =====
export const kcbAPI = {
  deposit: (data) => api.post('/kcb/deposit/', data),
  withdraw: (data) => api.post('/kcb/withdraw/', data),
  applyLoan: (data) => api.post('/kcb/loan/', data),
};

// ===== ACCOUNT =====
export const accountAPI = {
  changePIN: (old_pin, new_pin) => api.post('/change-pin/', { old_pin, new_pin }),
  changeLanguage: (language) => api.post('/change-language/', { language }),
  getNotifications: () => api.get('/notifications/'),
  markNotificationsRead: () => api.post('/notifications/', {}),
};

// ===== ADMIN =====
export const adminAPI = {
  getUsers: () => api.get('/admin/users/'),
  createUser: (data) => api.post('/admin/users/', data),
  getTransactions: () => api.get('/admin/transactions/'),
  getStats: () => api.get('/admin/stats/'),
};

// ===== AGENT =====
export const agentAPI = {
  getDashboard: () => api.get('/agent/dashboard/'),
};

// ===== BILLERS =====
export const billersAPI = {
  getBillers: () => api.get('/billers/', { public: true }),
};

// ===== WEBSOCKET SERVICE =====
export class WebSocketService {
  constructor(userId, handlers = {}) {
    this.userId = userId;
    this.handlers = handlers;
    this.ws = null;
    this.reconnectTimeout = null;
    this.reconnectDelay = 3000;
    this.maxRetries = 10;
    this.retries = 0;
    this.isConnected = false;
    this.pingInterval = null;
  }

  connect() {
    if (this.ws?.readyState === WebSocket.OPEN) return;

    try {
      this.ws = new WebSocket(`${WS_URL}/notifications/${this.userId}/`);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.isConnected = true;
        this.retries = 0;
        this.handlers.onConnect?.();

        // Keep-alive ping every 30s
        this.pingInterval = setInterval(() => {
          if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, 30000);
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (e) {
          console.error('WS parse error:', e);
        }
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        clearInterval(this.pingInterval);
        this.handlers.onDisconnect?.();
        this.scheduleReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (e) {
      console.error('WebSocket connection failed:', e);
      this.scheduleReconnect();
    }
  }

  handleMessage(data) {
    switch (data.type) {
      case 'notification':
        this.handlers.onNotification?.(data.data);
        break;
      case 'transaction':
        this.handlers.onTransaction?.(data.data);
        break;
      case 'balance_update':
        this.handlers.onBalanceUpdate?.(data.data);
        break;
      case 'connection_established':
        console.log('WS:', data.message);
        break;
      default:
        break;
    }
  }

  scheduleReconnect() {
    if (this.retries < this.maxRetries) {
      this.retries++;
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = setTimeout(() => {
        console.log(`WebSocket reconnecting... (${this.retries}/${this.maxRetries})`);
        this.connect();
      }, this.reconnectDelay * Math.min(this.retries, 3));
    }
  }

  disconnect() {
    clearInterval(this.pingInterval);
    clearTimeout(this.reconnectTimeout);
    this.maxRetries = 0;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

// ===== LOCAL AUTH HELPERS =====
export const authHelpers = {
  saveAuth: (data) => {
    localStorage.setItem('access_token', data.access);
    localStorage.setItem('refresh_token', data.refresh);
    localStorage.setItem('user', JSON.stringify(data.user));
  },

  getUser: () => {
    try {
      return JSON.parse(localStorage.getItem('user') || 'null');
    } catch {
      return null;
    }
  },

  isLoggedIn: () => !!localStorage.getItem('access_token'),

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  },

  getRole: () => {
    const user = authHelpers.getUser();
    return user?.role || null;
  },
};

// ===== HELPERS =====
export const formatKES = (amount) => {
  const num = parseFloat(amount || 0);
  return `KES ${num.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-KE', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
};

export const formatPhone = (phone) => {
  if (!phone) return '';
  // Format 254XXXXXXXXX or 07XXXXXXXX
  const clean = phone.replace(/\D/g, '');
  if (clean.startsWith('254') && clean.length === 12) {
    return `+254 ${clean.slice(3, 6)} ${clean.slice(6, 9)} ${clean.slice(9)}`;
  }
  return phone;
};

export const getTxnIcon = (type) => {
  const icons = {
    send_money: 'bi-arrow-up-right',
    receive_money: 'bi-arrow-down-left',
    withdraw_agent: 'bi-cash',
    withdraw_atm: 'bi-bank',
    buy_airtime: 'bi-phone',
    paybill: 'bi-receipt',
    buy_goods: 'bi-bag',
    pochi: 'bi-shop',
    mshwari_deposit: 'bi-piggy-bank',
    mshwari_withdraw: 'bi-piggy-bank',
    mshwari_loan: 'bi-credit-card',
    kcb_deposit: 'bi-building',
    kcb_withdraw: 'bi-building',
    kcb_loan: 'bi-building',
  };
  return icons[type] || 'bi-arrow-left-right';
};

export const getTxnClass = (type, userId, senderId) => {
  if (['receive_money', 'mshwari_withdraw', 'kcb_withdraw'].includes(type)) return 'receive';
  if (senderId !== userId) return 'receive';
  return 'send';
};

export default api;