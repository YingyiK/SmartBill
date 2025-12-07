/**
 * Authentication Service
 * Handles login, registration, and authentication state
 */
import { authAPI } from './api';

class AuthService {
  constructor() {
    this.currentUser = null;
    this.loadUserFromStorage();
  }

  /**
   * Load user info from localStorage
   */
  loadUserFromStorage() {
    const userStr = localStorage.getItem('current_user');
    if (userStr) {
      try {
        this.currentUser = JSON.parse(userStr);
      } catch (e) {
        console.error('Failed to parse user from storage:', e);
      }
    }
  }

  /**
   * Save user info to localStorage
   */
  saveUserToStorage(user) {
    this.currentUser = user;
    localStorage.setItem('current_user', JSON.stringify(user));
  }

  /**
   * Clear user info from localStorage
   */
  clearUserFromStorage() {
    this.currentUser = null;
    localStorage.removeItem('current_user');
  }

  /**
   * Register new user
   */
  async register(email, password, verificationCode) {
    try {
      const response = await authAPI.register(email, password, verificationCode);
      if (response.access_token) {
        // Fetch user info (with retry)
        try {
          const user = await authAPI.getCurrentUser();
          this.saveUserToStorage(user);
          return { success: true, user };
        } catch (userError) {
          // If getCurrentUser fails, still consider registration successful if we have token
          console.warn('Failed to fetch user info, but registration succeeded:', userError);
          // Save basic user info from token response
          const basicUser = {
            id: response.user_id,
            email: response.email,
            email_verified: true,
          };
          this.saveUserToStorage(basicUser);
          return { success: true, user: basicUser };
        }
      }
      return { success: false, error: 'Registration failed' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Login
   */
  async login(email, password) {
    try {
      const response = await authAPI.login(email, password);
      if (response.access_token) {
        // Fetch user info (with retry)
        try {
          const user = await authAPI.getCurrentUser();
          this.saveUserToStorage(user);
          return { success: true, user };
        } catch (userError) {
          // If getCurrentUser fails, still consider login successful if we have token
          console.warn('Failed to fetch user info, but login succeeded:', userError);
          // Save basic user info from token response
          const basicUser = {
            id: response.user_id,
            email: response.email,
            email_verified: true,
          };
          this.saveUserToStorage(basicUser);
          return { success: true, user: basicUser };
        }
      }
      return { success: false, error: 'Login failed' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Logout
   */
  logout() {
    authAPI.logout();
    this.clearUserFromStorage();
    window.location.href = '/login';
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return authAPI.isAuthenticated() && this.currentUser !== null;
  }

  /**
   * Get current user
   */
  getCurrentUser() {
    return this.currentUser;
  }

  /**
   * Send verification code
   */
  async sendVerificationCode(email) {
    try {
      await authAPI.sendVerificationCode(email);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Send password reset code
   */
  async sendPasswordResetCode(email) {
    try {
      await authAPI.sendPasswordResetCode(email);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Reset password
   */
  async resetPassword(email, verificationCode, newPassword) {
    try {
      await authAPI.resetPassword(email, verificationCode, newPassword);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

// Export singleton instance
export default new AuthService();

