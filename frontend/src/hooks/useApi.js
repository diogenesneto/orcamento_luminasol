// src/hooks/useApi.js
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';

// Create axios instance
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = Cookies.get('refreshToken');
        if (refreshToken) {
          const response = await api.post('/api/auth/refresh', {
            refreshToken,
          });
          
          const { accessToken } = response.data.data;
          Cookies.set('accessToken', accessToken, { expires: 7 });
          
          // Retry original request
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        Cookies.remove('accessToken');
        Cookies.remove('refreshToken');
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

// Custom hook for API calls
export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const request = useCallback(async (config) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api(config);
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Erro desconhecido';
      setError(errorMessage);
      
      // Show error toast
      toast.error(errorMessage);
      
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const get = useCallback((url, config = {}) => {
    return request({ method: 'GET', url, ...config });
  }, [request]);

  const post = useCallback((url, data, config = {}) => {
    return request({ method: 'POST', url, data, ...config });
  }, [request]);

  const put = useCallback((url, data, config = {}) => {
    return request({ method: 'PUT', url, data, ...config });
  }, [request]);

  const del = useCallback((url, config = {}) => {
    return request({ method: 'DELETE', url, ...config });
  }, [request]);

  return {
    loading,
    error,
    get,
    post,
    put,
    delete: del,
    request,
  };
};

// Hook for fetching data with caching
export const useFetch = (url, options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const { dependencies = [], enabled = true } = options;

  const fetchData = useCallback(async () => {
    if (!enabled) return;

    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get(url);
      setData(response.data);
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message;
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [url, enabled, ...dependencies]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch,
  };
};

// Specific API hooks
export const useAuth = () => {
  const { post, get } = useApi();

  const login = useCallback(async (credentials) => {
    const response = await post('/api/auth/login', credentials);
    
    if (response.success) {
      const { accessToken, refreshToken } = response.data;
      
      // Store tokens
      Cookies.set('accessToken', accessToken, { expires: 7 });
      Cookies.set('refreshToken', refreshToken, { expires: 30 });
      
      toast.success('Login realizado com sucesso!');
      return response.data;
    }
    
    throw new Error(response.error);
  }, [post]);

  const logout = useCallback(async () => {
    try {
      await post('/api/auth/logout');
    } catch (error) {
      // Continue with logout even if server request fails
    }
    
    Cookies.remove('accessToken');
    Cookies.remove('refreshToken');
    
    toast.success('Logout realizado com sucesso!');
    window.location.href = '/login';
  }, [post]);

  const getCurrentUser = useCallback(async () => {
    return await get('/api/auth/me');
  }, [get]);

  return {
    login,
    logout,
    getCurrentUser,
  };
};

export const useClients = () => {
  const { get, post, put, delete: del } = useApi();

  const getClients = useCallback((params = {}) => {
    return get('/api/clients', { params });
  }, [get]);

  const getClient = useCallback((id) => {
    return get(`/api/clients/${id}`);
  }, [get]);

  const createClient = useCallback((data) => {
    return post('/api/clients', data);
  }, [post]);

  const updateClient = useCallback((id, data) => {
    return put(`/api/clients/${id}`, data);
  }, [put]);

  const deleteClient = useCallback((id) => {
    return del(`/api/clients/${id}`);
  }, [del]);

  return {
    getClients,
    getClient,
    createClient,
    updateClient,
    deleteClient,
  };
};

export const useBudgets = () => {
  const { get, post, put, delete: del } = useApi();

  const getBudgets = useCallback((params = {}) => {
    return get('/api/budgets', { params });
  }, [get]);

  const getBudget = useCallback((id) => {
    return get(`/api/budgets/${id}`);
  }, [get]);

  const createSolarBudget = useCallback((data) => {
    return post('/api/budgets/solar', data);
  }, [post]);

  const createServiceBudget = useCallback((data) => {
    return post('/api/budgets/service', data);
  }, [post]);

  const updateBudget = useCallback((id, data) => {
    return put(`/api/budgets/${id}`, data);
  }, [put]);

  const deleteBudget = useCallback((id) => {
    return del(`/api/budgets/${id}`);
  }, [del]);

  const generateDocuments = useCallback((id, data) => {
    return post(`/api/budgets/${id}/generate`, data);
  }, [post]);

  const sendBudget = useCallback((id, data) => {
    return post(`/api/budgets/${id}/send`, data);
  }, [post]);

  return {
    getBudgets,
    getBudget,
    createSolarBudget,
    createServiceBudget,
    updateBudget,
    deleteBudget,
    generateDocuments,
    sendBudget,
  };
};

export const useDashboard = () => {
  const { get } = useApi();

  const getSummary = useCallback(() => {
    return get('/api/dashboard/summary');
  }, [get]);

  const getMetrics = useCallback((params = {}) => {
    return get('/api/dashboard/metrics', { params });
  }, [get]);

  const getRevenueChart = useCallback((params = {}) => {
    return get('/api/dashboard/charts/revenue', { params });
  }, [get]);

  const getActivities = useCallback((params = {}) => {
    return get('/api/dashboard/activities', { params });
  }, [get]);

  return {
    getSummary,
    getMetrics,
    getRevenueChart,
    getActivities,
  };
};

export default api;
