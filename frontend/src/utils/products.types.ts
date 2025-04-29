
export type Product = {
  id: string;
  name: string;
  price: number;
  category: 'men' | 'women' | 'essentials';
  image: string;
  isBestSeller?: boolean;
  description?: string;
  stock?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'canceled';

export type PaymentMethod = 'paypal' | 'cod';

export type OrderItem = {
  id: string;
  product: Product;
  quantity: number;
  price: number;
};

export type Order = {
  id: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  shippingAddress: Address;
  createdAt: string;
  updatedAt: string;
};

export type Address = {
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
};

// New types for Django backend
export type DjangoAddress = {
  id: string;
  first_name: string;
  last_name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  is_default: boolean;
};

export type DjangoOrderItem = {
  product_id: string;
  quantity: number;
  price: number;
};

export type DjangoOrderCreate = {
  items: DjangoOrderItem[];
  total_amount: number;
  payment_method: PaymentMethod;
  shipping_first_name: string;
  shipping_last_name: string;
  shipping_address: string;
  shipping_city: string;
  shipping_state: string;
  shipping_zip: string;
  shipping_phone: string;
};