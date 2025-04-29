import { toast } from 'sonner';
import axios from 'axios';

// Always set the latest access token from localStorage on every request
axios.interceptors.request.use((config) => {
  const tokens = JSON.parse(localStorage.getItem('authTokens') || 'null');
  if (tokens?.access && config.headers) {
    config.headers['Authorization'] = `Bearer ${tokens.access}`;
  }
  return config;
}, (error) => Promise.reject(error));

// Define CartItem type for cart API calls
export type CartItem = {
  product: {
    id: string;
    name: string;
    price: number;
  };
  quantity: number;
};

// Base API URL - you'll need to change this to your Django backend URL
export const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

// Helper to get the access token from localStorage
export const getToken = () => {
  const tokens = JSON.parse(localStorage.getItem('authTokens') || 'null');
  return tokens?.access || null;
};

// Default headers for API requests
export const getHeaders = (includeAuth = true) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (includeAuth) {
    const token = getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      console.log('Added auth token to request headers');
    } else {
      console.log('No auth token available for request');
    }
  }
  
  return headers;
};

// Helper function to stringify objects for better debugging
export const deepStringify = (obj: any): string => {
  try {
    return JSON.stringify(obj, null, 2);
  } catch (error) {
    return String(obj);
  }
};

// Check if the application is running in a Lovable preview environment
export const isPreviewEnvironment = () => {
  return window.location.hostname.includes('lovableproject.com') || 
         window.location.hostname.includes('lovable.app');
};

// Handle token refresh when it's invalid
export const refreshAuthToken = async (): Promise<boolean> => {
  try {
    const tokens = JSON.parse(localStorage.getItem('authTokens') || 'null');
    const refreshToken = tokens?.refresh;
    if (!refreshToken) {
      console.log('No refresh token available');
      return false;
    }
    
    console.log('Attempting to refresh token using refresh token');
    const response = await fetch(`${API_URL}/auth/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh: refreshToken }),
    });
    if (response.ok) {
      const data = await response.json();
      localStorage.setItem('authTokens', JSON.stringify({ access: data.access, refresh: tokens.refresh }));
      console.log('Token refreshed successfully');
      return true;
    }
    return false;
  } catch (error) {
    console.error('Failed to refresh token:', error);
    // Clear invalid tokens
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    return false;
  }
};

// Enhanced fetch wrapper with improved error handling and token refresh
export async function apiRequest<T>(
  endpoint: string, 
  method: string = 'GET', 
  data?: any, 
  requireAuth: boolean = true
): Promise<T> {
  let retryWithNewToken = false;
  
  try {
    if (isPreviewEnvironment() && !requireAuth) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    const formattedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${API_URL}${formattedEndpoint}`;
    console.log('Making API request to:', url, 'with method:', method, 'requireAuth:', requireAuth);
    
    if (requireAuth) {
      const token = getToken();
      if (!token) {
        console.error('Authentication required but no token available');
        const refreshed = await refreshAuthToken();
        if (!refreshed) {
          throw new Error('Unauthorized: Please sign in again');
        }
      }
    }
    
    const headers = getHeaders(requireAuth);
    
    if (requireAuth) {
      console.log('Auth header value:', headers['Authorization']);
    }
    console.log('Request headers:', headers);
    
    const options: RequestInit = {
      method,
      headers,
      credentials: 'include',
    };
    
    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      console.log('Request payload:', deepStringify(data));
      options.body = JSON.stringify(data);
    }
    
    console.log('Request options:', {
      method: options.method,
      headers: options.headers,
      hasBody: !!options.body,
    });
    
    const response = await fetch(url, options).catch(error => {
      console.error('Network error during fetch:', error);
      throw new Error(`Network error: ${error.message || 'Failed to connect to the server'}`);
    });
    
    console.log('API response status:', response.status);
    
    if (response.status === 401) {
      console.error('Unauthorized response (401). Token may be invalid or expired.');
      
      if (!retryWithNewToken && requireAuth) {
        const refreshed = await refreshAuthToken();
        if (refreshed) {
          console.log('Token refreshed, retrying request with new token');
          retryWithNewToken = true;
          return apiRequest(endpoint, method, data, requireAuth);
        } else {
          localStorage.removeItem('authToken');
          localStorage.removeItem('refreshToken');
          throw new Error('Unauthorized: Please sign in again');
        }
      } else {
        throw new Error('Unauthorized: Please sign in again');
      }
    }
    
    if (response.status === 204) {
      return {} as T;
    }
    
    let responseData;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      try {
        responseData = await response.json();
        console.log('API response data:', deepStringify(responseData));
      } catch (e) {
        console.error('Failed to parse JSON response:', e);
        throw new Error(`Invalid JSON response from server: ${e.message}`);
      }
    } else {
      const textResponse = await response.text();
      console.log('Non-JSON response:', textResponse);
      
      if (response.ok) {
        return {} as T;
      }
      
      throw new Error(`Server returned non-JSON response: ${textResponse}`);
    }
    
    if (!response.ok) {
      let errorMessage = 'An unknown error occurred';
      
      if (responseData) {
        if (typeof responseData === 'string') {
          errorMessage = responseData;
        } else if (responseData.detail) {
          errorMessage = responseData.detail;
        } else if (responseData.message) {
          errorMessage = responseData.message;
        } else if (responseData.error) {
          errorMessage = responseData.error;
        } else if (typeof responseData === 'object') {
          const fieldErrors = Object.entries(responseData)
            .map(([field, errors]) => {
              if (Array.isArray(errors)) {
                return `${field}: ${errors.join(', ')}`;
              } else if (typeof errors === 'object' && errors !== null) {
                return `${field}: ${deepStringify(errors)}`;
              }
              return `${field}: ${errors}`;
            })
            .join('; ');
          
          errorMessage = fieldErrors || 'Validation error';
          console.error('API validation errors:', deepStringify(responseData));
        }
      }
      
      console.error('API request failed with error:', errorMessage, deepStringify(responseData));
      throw new Error(errorMessage);
    }
    
    return responseData as T;
  } catch (error) {
    console.error('API request failed:', error);     
    if (error instanceof Error && 
      (error.message.includes('token_not_valid') || 
       error.message.includes('Token is invalid') || 
       error.message.includes('Unauthorized'))) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
    }
    throw error;
  }
}

// Auth API endpoints
export const authService = {
  refreshToken: (refreshToken: string) => {
    return fetch(`${API_URL}/auth/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh: refreshToken }),
    }).then(res => {
      if (!res.ok) throw new Error('Failed to refresh token');
      return res.json();
    });
  },
  signIn: (email: string, password: string) => {
    console.log('Attempting to sign in with email:', email);
    return apiRequest<{ token: string; refresh: string; user: any }>('auth/login/', 'POST', { email, password }, false);
  },
  
  signUp: (first_name: string, last_name: string, email: string, password: string) => {
    console.log('Signing up with:', { first_name, last_name, email, password });
    return apiRequest<{ token: string; refresh: string; user: any }>('auth/register/', 'POST', { 
      first_name, 
      last_name, 
      email, 
      password,
      password_confirm: password
    }, false);
  },
  
  getUserProfile: () => 
    apiRequest<any>('auth/profile/'),
    
  getUserAddresses: () =>
    apiRequest<DjangoAddress[]>('auth/addresses/'),
    
  createAddress: (addressData: Omit<DjangoAddress, 'id'>) =>
    apiRequest<DjangoAddress>('auth/addresses/', 'POST', addressData),
    
  updateAddress: (id: string, addressData: Partial<DjangoAddress>) =>
    apiRequest<DjangoAddress>(`auth/addresses/${id}/`, 'PATCH', addressData),
    
  deleteAddress: (id: string) =>
    apiRequest<void>(`auth/addresses/${id}/`, 'DELETE'),
};

// Product API endpoints

export const productsService = {
  updateProductStock: (productId: string, newStock: number) =>
    apiRequest(`products/${productId}/`, 'PATCH', { stock: newStock }),
  getProducts: () => 
  apiRequest<any[]>('products/', 'GET', undefined, false).then(products => {
    console.log('[API] Raw products fetched:', products);
    return products;
  }),
  
  getProductsByCategory: (category: string) => 
    apiRequest<any[]>(`products/?category=${category}`, 'GET', undefined, false),
  
  getProductById: (id: string) => 
    apiRequest<any>(`products/${id}/`, 'GET', undefined, false),
  
  getBestSellers: () => 
    apiRequest<any[]>('products/bestsellers/', 'GET', undefined, false),
};

export const ordersService = {
  cancelOrder: (orderId: string) => apiRequest(`orders/${orderId}/cancel/`, 'POST'),
  updateOrderStatus: (orderId: string, status: string) =>
    apiRequest(`orders/${orderId}/`, 'PATCH', { status }),
  createOrder: (orderData: DjangoOrderCreate) => 
    apiRequest<Order>('orders/', 'POST', orderData),
  
  getOrders: () => 
  apiRequest<Order[]>('orders/').then(orders => {
    console.log('[API] Raw orders fetched:', orders);
    return orders;
  }),
  
  getOrderById: (id: string) => 
    apiRequest<Order>(`orders/${id}/`),

  getUserCart: () =>
    apiRequest<CartItem[]>('cart/', 'GET'),

  addItemToCart: (productId: string, quantity: number) =>
    apiRequest('cart/add/', 'POST', { product_id: productId, quantity }),

  removeItemFromCart: (productId: string) =>
    apiRequest('cart/remove/', 'POST', { product_id: productId }),

  updateItemQuantity: (productId: string, quantity: number) =>
    apiRequest('cart/update/', 'POST', { product_id: productId, quantity }),

  mergeCart: (guestCart: CartItem[]) =>
    apiRequest('cart/merge/', 'POST', { items: guestCart }),
};
