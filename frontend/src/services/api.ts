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

// Define DjangoAddress type based on backend users.models.Address
export type DjangoAddress = {
  id: string;
  user: string; // user id
  first_name: string;
  last_name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
};

// Define OrderItem type for order items
export type OrderItem = {
  id: string;
  product: {
    id: string;
    name: string;
    price: number;
  };
  quantity: number;
  price: number;
};

// Define DjangoOrderCreate type based on backend orders.serializers.OrderCreateSerializer
export type DjangoOrderCreate = {
  items: {
    product_id: string;
    quantity: number;
    price: number;
  }[];
  total_amount: number;
  payment_method: 'paypal' | 'cod';
  shipping_first_name: string;
  shipping_last_name: string;
  shipping_address: string;
  shipping_city: string;
  shipping_state: string;
  shipping_zip: string;
  shipping_phone: string;
};

// Define Order type based on backend orders.serializers.OrderSerializer
export type Order = {
  id: string;
  total_amount: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'canceled';
  payment_method: 'paypal' | 'cod';
  shipping_first_name: string;
  shipping_last_name: string;
  shipping_address: string;
  shipping_city: string;
  shipping_state: string;
  shipping_zip: string;
  shipping_phone: string;
  items: OrderItem[];
  created_at: string;
  updated_at: string;
};

// Base API URL - you'll need to change this to your Django backend URL
export const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

// Helper to get the access token from localStorage
export const getToken = () => {
  const tokens = JSON.parse(localStorage.getItem('authTokens') || 'null');
  console.log('Retrieved token:', tokens?.access); // Debug log
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
      console.log('Added auth token to request headers:', headers['Authorization']); // Debug log
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
  const headers = getHeaders(requireAuth);
  console.log('Request headers:', headers); // Debug log
  
  const options: RequestInit = {
    method,
    headers,
    // Removed credentials: 'include' because JWT is sent via Authorization header, not cookies
  };
  
  if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    options.body = JSON.stringify(data);
  }
  
  const url = `${API_URL}/${endpoint}`;
  console.log('Making API request to:', url); // Debug log
  
  const response = await fetch(url, options);
  console.log('Response status:', response.status); // Debug log
  
  if (response.status === 401) {
    console.error('Unauthorized: Token may be missing or invalid');
  }
  
  return response.json();
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
    return apiRequest<{ token: string; refresh: string; user: any }>('auth/login/', 'POST', { email, password });
  },

  signUp: (first_name: string, last_name: string, email: string, password: string) => {
    return apiRequest<{ token: string; refresh: string; user: any }>('auth/register/', 'POST', {
      first_name,
      last_name,
      email,
      password,
      password_confirm: password,
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
  clearCart: () => apiRequest('orders/cart/clear/', 'POST'),
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
    apiRequest<CartItem[]>('orders/cart/', 'GET',undefined, true ),

  addItemToCart: (productId: string, quantity: number) =>
    apiRequest('orders/cart/add/', 'POST', { product_id: productId, quantity }),

  removeItemFromCart: (productId: string) =>
    apiRequest('orders/cart/remove/', 'POST', { product_id: productId }),

  updateItemQuantity: (productId: string, quantity: number) =>
    apiRequest('orders/cart/update-quantity/', 'POST', { product_id: productId, quantity }),

  mergeCart: (guestCart: CartItem[]) =>
    apiRequest('orders/cart/merge/', 'POST', { items: guestCart }),
};
