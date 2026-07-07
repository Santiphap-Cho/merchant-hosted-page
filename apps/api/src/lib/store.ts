import { randomUUID } from "crypto";
import type {
  Cart,
  CartItem,
  CartItemWithProduct,
  CartWithItems,
  Category,
  Order,
  OrderItem,
  OrderItemWithProduct,
  OrderWithItems,
  Product,
  ProductWithCategory,
} from "./types.js";

const categoriesSeed = [
  { name: "Candy & Sweets", slug: "candy-sweets" },
  { name: "Snacks", slug: "snacks" },
  { name: "Condiments", slug: "condiments" },
];

const productsSeed = [
  {
    name: "Tamarind Candy (Thai style)",
    description:
      "Sweet and tangy tamarind candy wrapped in traditional Thai style. A beloved snack enjoyed by locals and visitors alike.",
    price: 45,
    originalPrice: 60,
    discountPercent: 25,
    imageUrl:
      "https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=400&h=400&fit=crop",
    rating: 4.7,
    soldCount: 1284,
    categorySlug: "candy-sweets",
  },
  {
    name: "Mango Sticky Rice Snack Pack",
    description:
      "Crispy dried mango with coconut sticky rice flavor. Captures the essence of Thailand's famous dessert in a portable snack.",
    price: 89,
    originalPrice: 120,
    discountPercent: 26,
    imageUrl:
      "https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38?w=400&h=400&fit=crop",
    rating: 4.9,
    soldCount: 892,
    categorySlug: "snacks",
  },
  {
    name: "Crispy Seaweed Crackers",
    description:
      "Light and crispy roasted seaweed crackers seasoned with sesame. Perfect for snacking anytime.",
    price: 55,
    originalPrice: 70,
    discountPercent: 21,
    imageUrl:
      "https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=400&h=400&fit=crop",
    rating: 4.5,
    soldCount: 2156,
    categorySlug: "snacks",
  },
  {
    name: "Coconut Chips",
    description:
      "Thinly sliced and oven-baked coconut chips with a hint of salt. Naturally sweet and crunchy.",
    price: 65,
    originalPrice: 85,
    discountPercent: 24,
    imageUrl:
      "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400&h=400&fit=crop",
    rating: 4.6,
    soldCount: 1673,
    categorySlug: "snacks",
  },
  {
    name: "Thai Chili Paste (Nam Prik) Jar",
    description:
      "Authentic Thai chili paste made with fresh chilies, garlic, and lime. A staple condiment for every Thai meal.",
    price: 99,
    originalPrice: 130,
    discountPercent: 24,
    imageUrl:
      "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&h=400&fit=crop",
    rating: 4.8,
    soldCount: 543,
    categorySlug: "condiments",
  },
];

class InMemoryStore {
  categories = new Map<string, Category>();
  products = new Map<string, Product>();
  carts = new Map<string, Cart>();
  cartsBySession = new Map<string, string>();
  cartItems = new Map<string, CartItem>();
  orders = new Map<string, Order>();
  orderItems = new Map<string, OrderItem>();

  constructor() {
    this.seed();
  }

  private seed() {
    const now = new Date();

    for (const cat of categoriesSeed) {
      const id = randomUUID();
      this.categories.set(id, {
        id,
        name: cat.name,
        slug: cat.slug,
        createdAt: now,
        updatedAt: now,
      });
    }

    const categoryBySlug = new Map(
      [...this.categories.values()].map((c) => [c.slug, c.id]),
    );

    for (const product of productsSeed) {
      const categoryId = categoryBySlug.get(product.categorySlug);
      if (!categoryId) continue;

      const id = randomUUID();
      this.products.set(id, {
        id,
        name: product.name,
        description: product.description,
        price: product.price,
        originalPrice: product.originalPrice,
        discountPercent: product.discountPercent,
        imageUrl: product.imageUrl,
        rating: product.rating,
        soldCount: product.soldCount,
        categoryId,
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  private getCategory(id: string): Category | undefined {
    return this.categories.get(id);
  }

  getProductWithCategory(id: string): ProductWithCategory | undefined {
    const product = this.products.get(id);
    if (!product) return undefined;

    const category = this.getCategory(product.categoryId);
    if (!category) return undefined;

    return { ...product, category };
  }

  listProducts(options: {
    page: number;
    limit: number;
    categorySlug?: string;
    query?: string;
  }) {
    let items = [...this.products.values()];

    if (options.categorySlug) {
      const category = [...this.categories.values()].find(
        (c) => c.slug === options.categorySlug,
      );
      items = category
        ? items.filter((p) => p.categoryId === category.id)
        : [];
    }

    if (options.query) {
      const q = options.query.toLowerCase();
      items = items.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q),
      );
    }

    items.sort((a, b) => b.soldCount - a.soldCount);

    const total = items.length;
    const skip = (options.page - 1) * options.limit;
    const pageItems = items.slice(skip, skip + options.limit);

    return {
      data: pageItems
        .map((p) => this.getProductWithCategory(p.id))
        .filter((p): p is ProductWithCategory => p !== undefined),
      total,
      page: options.page,
      limit: options.limit,
      totalPages: Math.ceil(total / options.limit),
    };
  }

  getOrCreateCart(sessionId: string): Cart {
    const existingId = this.cartsBySession.get(sessionId);
    if (existingId) {
      const cart = this.carts.get(existingId);
      if (cart) return cart;
    }

    const now = new Date();
    const cart: Cart = {
      id: randomUUID(),
      sessionId,
      createdAt: now,
      updatedAt: now,
    };

    this.carts.set(cart.id, cart);
    this.cartsBySession.set(sessionId, cart.id);
    return cart;
  }

  getCartWithItems(sessionId: string): CartWithItems | null {
    const cartId = this.cartsBySession.get(sessionId);
    if (!cartId) return null;

    const cart = this.carts.get(cartId);
    if (!cart) return null;

    const items = [...this.cartItems.values()]
      .filter((item) => item.cartId === cart.id)
      .map((item) => {
        const product = this.getProductWithCategory(item.productId);
        if (!product) return null;
        return { ...item, product };
      })
      .filter((item): item is CartItemWithProduct => item !== null);

    return { ...cart, items };
  }

  addToCart(sessionId: string, productId: string, quantity: number): CartWithItems {
    const product = this.getProductWithCategory(productId);
    if (!product) {
      throw new Error("PRODUCT_NOT_FOUND");
    }

    const cart = this.getOrCreateCart(sessionId);
    const now = new Date();

    const existing = [...this.cartItems.values()].find(
      (item) => item.cartId === cart.id && item.productId === productId,
    );

    if (existing) {
      existing.quantity += quantity;
      existing.updatedAt = now;
      this.cartItems.set(existing.id, existing);
    } else {
      const item: CartItem = {
        id: randomUUID(),
        cartId: cart.id,
        productId,
        quantity,
        createdAt: now,
        updatedAt: now,
      };
      this.cartItems.set(item.id, item);
    }

    cart.updatedAt = now;
    this.carts.set(cart.id, cart);

    return this.getCartWithItems(sessionId)!;
  }

  clearCart(cartId: string) {
    for (const [id, item] of this.cartItems) {
      if (item.cartId === cartId) {
        this.cartItems.delete(id);
      }
    }
  }

  createOrder(input: {
    sessionId: string;
    customerName: string;
    address: string;
    phone: string;
    capture?: boolean;
  }): OrderWithItems {
    const cart = this.getCartWithItems(input.sessionId);
    if (!cart || cart.items.length === 0) {
      throw new Error("CART_EMPTY");
    }

    const now = new Date();
    const total = cart.items.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0,
    );

    const order: Order = {
      id: randomUUID(),
      sessionId: input.sessionId,
      customerName: input.customerName,
      address: input.address,
      phone: input.phone,
      total,
      status: "pending",
      capture: input.capture ?? true,
      createdAt: now,
      updatedAt: now,
    };

    this.orders.set(order.id, order);

    const items: OrderItemWithProduct[] = cart.items.map((cartItem) => {
      const item: OrderItem = {
        id: randomUUID(),
        orderId: order.id,
        productId: cartItem.productId,
        quantity: cartItem.quantity,
        price: cartItem.product.price,
        createdAt: now,
      };
      this.orderItems.set(item.id, item);
      return { ...item, product: cartItem.product };
    });

    this.clearCart(cart.id);

    return { ...order, items };
  }

  getOrder(id: string): OrderWithItems | undefined {
    const order = this.orders.get(id);
    if (!order) return undefined;

    const items = [...this.orderItems.values()]
      .filter((item) => item.orderId === order.id)
      .map((item) => {
        const product = this.products.get(item.productId);
        if (!product) return null;
        return { ...item, product };
      })
      .filter((item): item is OrderItemWithProduct => item !== null);

    return { ...order, items };
  }

  setCheckoutToken(orderId: string, checkoutToken: string) {
    const order = this.orders.get(orderId);
    if (!order) return;
    order.checkoutToken = checkoutToken;
    order.updatedAt = new Date();
    this.orders.set(orderId, order);
  }

  updateOrderCharge(
    orderId: string,
    charge: {
      id: string;
      status: string;
      sub_status: string;
      refundable: boolean;
      reversible: boolean;
      capturable: boolean;
    },
  ) {
    const order = this.orders.get(orderId);
    if (!order) return undefined;

    order.chargeId = charge.id;
    order.chargeStatus = charge.status;
    order.chargeSubStatus = charge.sub_status;
    order.refundable = charge.refundable;
    order.reversible = charge.reversible;
    order.capturable = charge.capturable;
    order.status =
      charge.status === "successful"
        ? "paid"
        : charge.status === "failed"
          ? "failed"
          : order.status;
    order.updatedAt = new Date();
    this.orders.set(orderId, order);
    return this.getOrder(orderId);
  }

  listOrdersBySession(sessionId: string): OrderWithItems[] {
    return [...this.orders.values()]
      .filter((o) => o.sessionId === sessionId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .map((o) => this.getOrder(o.id)!)
      .filter(Boolean);
  }
}

export const store = new InMemoryStore();
