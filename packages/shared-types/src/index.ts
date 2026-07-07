export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice: number;
  discountPercent: number;
  imageUrl: string;
  rating: number;
  soldCount: number;
  categoryId: string;
  category?: Category;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  product?: Product;
}

export interface Cart {
  id: string;
  sessionId: string;
  items: CartItem[];
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  product?: Product;
}

export interface Order {
  id: string;
  sessionId: string;
  customerName: string;
  address: string;
  phone: string;
  total: number;
  status: string;
  chargeId?: string | null;
  checkoutToken?: string | null;
  chargeStatus?: string | null;
  chargeSubStatus?: string | null;
  refundable?: boolean;
  reversible?: boolean;
  capturable?: boolean;
  capture?: boolean;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface ChargeSummary {
  id: string;
  status: string;
  sub_status: string;
  amount: number;
  captured_amount: number;
  refunded_amount: number;
  refundable: boolean;
  reversible: boolean;
  capturable: boolean;
  capture: boolean;
  card?: {
    brand?: string;
    last_digits?: string;
    name?: string;
  };
  paid_at?: string | null;
}

export interface OrderHistoryItem extends Order {
  charge?: ChargeSummary | null;
}

export interface PaginatedProducts {
  data: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiError {
  error: string;
  details?: unknown;
}

export interface AddToCartInput {
  sessionId: string;
  productId: string;
  quantity?: number;
}

export interface CreateOrderInput {
  sessionId: string;
  customerName: string;
  address: string;
  phone: string;
  /** true = capture immediately (default), false = authorize only */
  capture?: boolean;
}

export interface CreateOrderResponse extends Order {
  checkoutUrl: string;
  checkoutToken: string;
  checkoutExpiresAt: string;
}
