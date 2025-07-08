// src/contexts/AuthContext.jsx
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useRouter } from 'next/router';
import Cookies from 'js-cookie';
import { useAuth } from '@/hooks/useApi';
import toast from 'react-hot-toast';

// Initial state
const initialState = {
  user: null,
  isAuthenticated: false,
  loading: true,
  error: null,
};

// Action types
const AUTH_ACTIONS = {
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  SET_USER: 'SET_USER',
  SET_LOADING: 'SET_LOADING',
  CLEAR_ERROR: 'CLEAR_ERROR',
};

// Reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.LOGIN_START:
      return {
        ...state,
        loading: true,
        error: null,
      };
    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        loading: false,
        error: null,
      };
    case AUTH_ACTIONS.LOGIN_FAILURE:
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        loading: false,
        error: action.payload,
      };
    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        loading: false,
        error: null,
      };
    case AUTH_ACTIONS.SET_USER:
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
        loading: false,
      };
    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: action.payload,
      };
    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };
    default:
      return state;
  }
};

// Create context
const AuthContext = createContext();

// Provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const router = useRouter();
  const { login: apiLogin, logout: apiLogout, getCurrentUser } = useAuth();

  // Check if user is authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = Cookies.get('accessToken');
      
      if (!token) {
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
        return;
      }

      try {
        const response = await getCurrentUser();
        if (response.success) {
          dispatch({ type: AUTH_ACTIONS.SET_USER, payload: response.data });
        } else {
          // Invalid token, remove it
          Cookies.remove('accessToken');
          Cookies.remove('refreshToken');
          dispatch({ type: AUTH_ACTIONS.LOGOUT });
        }
      } catch (error) {
        // Token is invalid or expired
        Cookies.remove('accessToken');
        Cookies.remove('refreshToken');
        dispatch({ type: AUTH_ACTIONS.LOGOUT });
      }
    };

    checkAuth();
  }, [getCurrentUser]);

  // Login function
  const login = async (credentials) => {
    try {
      dispatch({ type: AUTH_ACTIONS.LOGIN_START });
      
      const userData = await apiLogin(credentials);
      dispatch({ type: AUTH_ACTIONS.LOGIN_SUCCESS, payload: userData.user });
      
      // Redirect based on user role
      const redirectTo = userData.user.role === 'admin' ? '/admin/dashboard' : '/dashboard';
      router.push(redirectTo);
      
      return userData;
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Erro ao fazer login';
      dispatch({ type: AUTH_ACTIONS.LOGIN_FAILURE, payload: errorMessage });
      throw error;
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await apiLogout();
    } catch (error) {
      // Continue with logout even if API call fails
      console.error('Logout error:', error);
    }
    
    dispatch({ type: AUTH_ACTIONS.LOGOUT });
    router.push('/login');
  };

  // Update user function
  const updateUser = (userData) => {
    dispatch({ type: AUTH_ACTIONS.SET_USER, payload: userData });
  };

  // Clear error function
  const clearError = () => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  };

  // Check if user has permission
  const hasPermission = (requiredRole) => {
    if (!state.user) return false;
    
    const roleHierarchy = {
      client: 1,
      user: 2,
      admin: 3,
    };
    
    const userLevel = roleHierarchy[state.user.role] || 0;
    const requiredLevel = roleHierarchy[requiredRole] || 0;
    
    return userLevel >= requiredLevel;
  };

  // Check if user is admin
  const isAdmin = () => {
    return state.user?.role === 'admin';
  };

  // Check if user is client
  const isClient = () => {
    return state.user?.role === 'client';
  };

  const value = {
    ...state,
    login,
    logout,
    updateUser,
    clearError,
    hasPermission,
    isAdmin,
    isClient,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook to use auth context
export const useAuthContext = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  
  return context;
};

// Higher-order component for protecting routes
export const withAuth = (WrappedComponent, requiredRole = null) => {
  return function AuthenticatedComponent(props) {
    const { isAuthenticated, loading, hasPermission } = useAuthContext();
    const router = useRouter();

    useEffect(() => {
      if (!loading) {
        if (!isAuthenticated) {
          router.push('/login');
          return;
        }

        if (requiredRole && !hasPermission(requiredRole)) {
          toast.error('Você não tem permissão para acessar esta página');
          router.push('/dashboard');
          return;
        }
      }
    }, [isAuthenticated, loading, hasPermission, router]);

    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      );
    }

    if (!isAuthenticated) {
      return null;
    }

    if (requiredRole && !hasPermission(requiredRole)) {
      return null;
    }

    return <WrappedComponent {...props} />;
  };
};

export default AuthContext;
