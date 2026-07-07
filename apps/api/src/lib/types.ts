export interface Category {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
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
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductWithCategory extends Product {
  category: Category;
}

export interface Cart {
  id: string;
  sessionId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CartItem {
  id: string;
  cartId: string;
  productId: string;
  quantity: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CartItemWithProduct extends CartItem {
  product: ProductWithCategory;
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
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  price: number;
  createdAt: Date;
}

export interface OrderItemWithProduct extends OrderItem {
  product: Product;
}

export interface OrderWithItems extends Order {
  items: OrderItemWithProduct[];
}

export interface CartWithItems extends Cart {
  items: CartItemWithProduct[];
}
