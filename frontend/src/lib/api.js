/**
 * API Client for communicating with Django REST Framework backend.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// Store CSRF token
let csrfToken = null;

/**
 * Get CSRF token from backend
 */
async function fetchCSRFToken() {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/csrf/`, {
      credentials: 'include',
    });
    const data = await response.json();
    csrfToken = data.csrf_token;
    return csrfToken;
  } catch (error) {
    console.error('Error fetching CSRF token:', error);
    return null;
  }
}

/**
 * Make API request with authentication
 */
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Ensure CSRF token for mutations
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(options.method) && !csrfToken) {
    await fetchCSRFToken();
  }
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  if (csrfToken) {
    headers['X-CSRFToken'] = csrfToken;
  }
  
  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });
  
  // Handle non-JSON responses (like PDF)
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/pdf')) {
    if (!response.ok) {
      throw new Error('Error downloading PDF');
    }
    return response.blob();
  }
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.detail || data.error || 'Error en la solicitud');
  }
  
  return data;
}

// ============ AUTH API ============

export const authAPI = {
  async login(username, password) {
    await fetchCSRFToken();
    const data = await apiRequest('/auth/login/', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    csrfToken = data.csrf_token;
    return data;
  },
  
  async logout() {
    const data = await apiRequest('/auth/logout/', {
      method: 'POST',
    });
    csrfToken = null;
    return data;
  },
  
  async getCurrentUser() {
    return apiRequest('/auth/me/');
  },
};

// ============ PRODUCTS API ============

export const productsAPI = {
  async list(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/products/?${queryString}` : '/products/';
    return apiRequest(endpoint);
  },
  
  async get(id) {
    return apiRequest(`/products/${id}/`);
  },
  
  async create(productData) {
    return apiRequest('/products/', {
      method: 'POST',
      body: JSON.stringify(productData),
    });
  },
  
  async update(id, productData) {
    return apiRequest(`/products/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(productData),
    });
  },
  
  async delete(id) {
    return apiRequest(`/products/${id}/`, {
      method: 'DELETE',
    });
  },
};

// ============ ORDERS API ============

export const ordersAPI = {
  async list(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/orders/?${queryString}` : '/orders/';
    return apiRequest(endpoint);
  },
  
  async get(id) {
    return apiRequest(`/orders/${id}/`);
  },
  
  async create(orderData) {
    return apiRequest('/orders/', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  },
  
  async update(id, orderData) {
    return apiRequest(`/orders/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(orderData),
    });
  },
  
  async changeStatus(id, status) {
    return apiRequest(`/orders/${id}/change_status/`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },
  
  async cancel(id) {
    return apiRequest(`/orders/${id}/`, {
      method: 'DELETE',
    });
  },
  
  async getPending() {
    return apiRequest('/orders/pending/');
  },
  
  async getDelivered() {
    return apiRequest('/orders/delivered/');
  },
  
  async downloadPDF(id) {
    const blob = await apiRequest(`/orders/${id}/pdf/`);
    // Create download link
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pedido_${id}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },
  
  async printPDF(id) {
    const blob = await apiRequest(`/orders/${id}/pdf/`);
    const url = window.URL.createObjectURL(blob);
    const printWindow = window.open(url);
    printWindow.onload = () => {
      printWindow.print();
    };
  },
};

// ============ REPORTS API ============

export const reportsAPI = {
  async getSummary() {
    return apiRequest('/reports/summary/');
  },
  
  async getDaily(date = null) {
    const params = date ? `?date=${date}` : '';
    return apiRequest(`/reports/daily/${params}`);
  },
  
  async getWeekly(date = null) {
    const params = date ? `?date=${date}` : '';
    return apiRequest(`/reports/weekly/${params}`);
  },
  
  async getMonthly(year = null, month = null) {
    const params = new URLSearchParams();
    if (year) params.append('year', year);
    if (month) params.append('month', month);
    const queryString = params.toString();
    return apiRequest(`/reports/monthly/${queryString ? `?${queryString}` : ''}`);
  },
  
  async getCustom(startDate, endDate) {
    return apiRequest(`/reports/custom/?start_date=${startDate}&end_date=${endDate}`);
  },
};

// Initialize CSRF token on load
if (typeof window !== 'undefined') {
  fetchCSRFToken();
}
