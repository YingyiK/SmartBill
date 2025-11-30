/**
 * API Client for SmartBill Backend
 * Base URL: http://localhost:5001 (api_service)
 */
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

/**
 * Get auth token from localStorage
 */
const getToken = () => {
  return localStorage.getItem('auth_token');
};

/**
 * Set auth token in localStorage
 */
const setToken = (token) => {
  localStorage.setItem('auth_token', token);
};

/**
 * Remove auth token from localStorage
 */
const removeToken = () => {
  localStorage.removeItem('auth_token');
};

/**
 * Base fetch function with authentication
 */
const apiRequest = async (endpoint, options = {}) => {
  const token = getToken();
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    
    // Handle 401 Unauthorized
    if (response.status === 401) {
      removeToken();
      window.location.href = '/login';
      throw new Error('Unauthorized');
    }
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.detail || data.message || 'Request failed');
    }
    
    return data;
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
};

/**
 * Authentication API
 */
export const authAPI = {
  /**
   * Send verification code to email
   */
  sendVerificationCode: async (email) => {
    return apiRequest('/api/auth/send-verification-code', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  /**
   * Register new user
   */
  register: async (email, password, verificationCode) => {
    const response = await apiRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email,
        password,
        verification_code: verificationCode,
      }),
    });
    
    if (response.access_token) {
      setToken(response.access_token);
    }
    
    return response;
  },

  /**
   * Login
   */
  login: async (email, password) => {
    const response = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    if (response.access_token) {
      setToken(response.access_token);
    }
    
    return response;
  },

  /**
   * Send password reset code
   */
  sendPasswordResetCode: async (email) => {
    return apiRequest('/api/auth/send-password-reset-code', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  /**
   * Reset password
   */
  resetPassword: async (email, verificationCode, newPassword) => {
    return apiRequest('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({
        email,
        verification_code: verificationCode,
        new_password: newPassword,
      }),
    });
  },

  /**
   * Get current user info
   */
  getCurrentUser: async () => {
    const token = getToken();
    if (!token) {
      throw new Error('Not authenticated');
    }
    
    // Use fetch directly to ensure token is in header
    const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (response.status === 401) {
      removeToken();
      window.location.href = '/login';
      throw new Error('Unauthorized');
    }
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.detail || data.message || 'Failed to get user info');
    }
    
    return data;
  },

  /**
   * Logout
   */
  logout: () => {
    removeToken();
  },

  /**
   * Check if user is logged in
   */
  isAuthenticated: () => {
    return !!getToken();
  },
};

/**
 * OCR API
 */
export const ocrAPI = {
  /**
   * Upload receipt image for OCR
   */
  uploadReceipt: async (imageFile) => {
    const formData = new FormData();
    formData.append('image', imageFile);
    
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/api/ocr/upload`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });
    
    if (response.status === 401) {
      removeToken();
      window.location.href = '/login';
      throw new Error('Unauthorized');
    }
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.detail || data.message || 'OCR failed');
    }
    
    return data;
  },

  /**
   * Test OCR parser with raw text
   */
  testParser: async (text) => {
    return apiRequest('/api/ocr/test', {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  },
};

/**
 * STT API
 */
export const sttAPI = {
  /**
   * Process voice input for expense
   */
  processVoice: async (audioFile) => {
    const formData = new FormData();
    formData.append('audio', audioFile);
    
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/api/stt/process-voice`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });
    
    if (response.status === 401) {
      removeToken();
      window.location.href = '/login';
      throw new Error('Unauthorized');
    }
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.detail || data.message || 'STT failed');
    }
    
    return data;
  },
};

/**
 * AI API
 */
export const aiAPI = {
  /**
   * Analyze expense using AI
   */
  analyzeExpense: async (expenseData) => {
    return apiRequest('/api/ai/analyze-expense', {
      method: 'POST',
      body: JSON.stringify(expenseData),
    });
  },
};

/**
 * Expense API
 */
export const expenseAPI = {
  /**
   * Create a new expense
   */
  createExpense: async (expenseData) => {
    return apiRequest('/api/expenses', {
      method: 'POST',
      body: JSON.stringify(expenseData),
    });
  },

  /**
   * Get user's expenses
   */
  getExpenses: async (limit = 50, offset = 0) => {
    return apiRequest(`/api/expenses?limit=${limit}&offset=${offset}`, {
      method: 'GET',
    });
  },

  /**
   * Delete an expense
   */
  deleteExpense: async (expenseId) => {
    return apiRequest(`/api/expenses/${expenseId}`, {
      method: 'DELETE',
    });
  },
};

export default {
  auth: authAPI,
  ocr: ocrAPI,
  stt: sttAPI,
  ai: aiAPI,
  expense: expenseAPI,
};

