import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api, { setUnauthorizedCallback } from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  // Clear auth state
  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  }, []);

  // Set up 401 callback in axios
  useEffect(() => {
    setUnauthorizedCallback(() => {
      logout();
    });
  }, [logout]);

  // Restore user session on mount if token exists
  useEffect(() => {
    const restoreSession = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          const response = await api.get('/users/profile');
          setUser(response.data);
          setToken(storedToken);
        } catch (err) {
          // Token invalid or expired
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
        }
      } else {
        setUser(null);
        setToken(null);
      }
      setLoading(false);
    };

    restoreSession();
  }, []);

  // Signup
  const signup = async ({ name, email, password, role }) => {
    const payload = { name, email, password };
    if (role) payload.role = role;

    try {
      const response = await api.post('/auth/signup', payload);
      const { token: newToken, user: userData } = response.data;
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(userData);
      return { success: true, user: userData };
    } catch (err) {
      const message = err.response?.data?.message || 'Signup failed. Please try again.';
      throw new Error(message);
    }
  };

  // Login
  const login = async ({ email, password }) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token: newToken, user: userData } = response.data;
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(userData);
      return { success: true, user: userData };
    } catch (err) {
      const message = err.response?.data?.message || 'Invalid email or password';
      throw new Error(message);
    }
  };

  // Update profile
  const updateUserProfile = async ({ name, email }) => {
    try {
      const response = await api.put('/users/profile', { name, email });
      setUser(response.data);
      return { success: true, user: response.data };
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to update profile';
      throw new Error(message);
    }
  };

  // Delete user (admin or self)
  const deleteUser = async (userId) => {
    try {
      const isSelf = user && user._id === userId;
      await api.delete(`/users/${userId}`);
      if (isSelf) {
        logout();
      }
      return { success: true, isSelf };
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to delete user';
      throw new Error(message);
    }
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!user,
    signup,
    login,
    logout,
    updateUserProfile,
    deleteUser,
    setUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
