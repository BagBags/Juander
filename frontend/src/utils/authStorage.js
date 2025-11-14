/**
 * Secure Authentication Storage Utility for PWA
 * Handles token and user data persistence with fallback mechanisms
 */

const TOKEN_KEY = 'token';
const USER_KEY = 'user';
const TOKEN_EXPIRY_KEY = 'tokenExpiry';

// Set token expiry to 30 days by default
const TOKEN_EXPIRY_DAYS = 30;

/**
 * Save authentication data with expiry
 */
export const saveAuth = (token, user) => {
  try {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + TOKEN_EXPIRY_DAYS);
    
    // Save to localStorage
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    localStorage.setItem(TOKEN_EXPIRY_KEY, expiryDate.toISOString());
    
    // Also save to sessionStorage as backup
    sessionStorage.setItem(TOKEN_KEY, token);
    sessionStorage.setItem(USER_KEY, JSON.stringify(user));
    
    return true;
  } catch (error) {
    console.error('Error saving auth data:', error);
    return false;
  }
};

/**
 * Get token with fallback to sessionStorage
 */
export const getToken = () => {
  try {
    // Check if token is expired
    const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
    if (expiry && new Date(expiry) < new Date()) {
      console.log('Token expired, clearing auth');
      clearAuth();
      return null;
    }
    
    // Try localStorage first
    let token = localStorage.getItem(TOKEN_KEY);
    
    // Fallback to sessionStorage
    if (!token) {
      token = sessionStorage.getItem(TOKEN_KEY);
      // If found in session, restore to localStorage
      if (token) {
        localStorage.setItem(TOKEN_KEY, token);
      }
    }
    
    return token;
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
};

/**
 * Get user data with fallback to sessionStorage
 */
export const getUser = () => {
  try {
    // Try localStorage first
    let userStr = localStorage.getItem(USER_KEY);
    
    // Fallback to sessionStorage
    if (!userStr) {
      userStr = sessionStorage.getItem(USER_KEY);
      // If found in session, restore to localStorage
      if (userStr) {
        localStorage.setItem(USER_KEY, userStr);
      }
    }
    
    return userStr ? JSON.parse(userStr) : null;
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
};

/**
 * Update user data
 */
export const updateUser = (user) => {
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    sessionStorage.setItem(USER_KEY, JSON.stringify(user));
    return true;
  } catch (error) {
    console.error('Error updating user:', error);
    return false;
  }
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = () => {
  const token = getToken();
  const user = getUser();
  return !!(token && user);
};

/**
 * Clear all authentication data
 */
export const clearAuth = () => {
  try {
    // Clear from localStorage
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
    
    // Clear from sessionStorage
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
    
    return true;
  } catch (error) {
    console.error('Error clearing auth:', error);
    return false;
  }
};

/**
 * Extend token expiry (call this on user activity)
 */
export const extendTokenExpiry = () => {
  try {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + TOKEN_EXPIRY_DAYS);
    localStorage.setItem(TOKEN_EXPIRY_KEY, expiryDate.toISOString());
    return true;
  } catch (error) {
    console.error('Error extending token expiry:', error);
    return false;
  }
};

/**
 * Get token expiry date
 */
export const getTokenExpiry = () => {
  try {
    const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
    return expiry ? new Date(expiry) : null;
  } catch (error) {
    console.error('Error getting token expiry:', error);
    return null;
  }
};
