import { randomUUID } from "crypto";
import type {
  CartItemWithProduct,
  CartWithItems,
  Category,
  Order,
  OrderItemWithProduct,
  OrderWithItems,
  Product,
  ProductWithCategory,
} from "./types.js";
import { kv } from "./kv.js";

// Deterministic (fixed) IDs so the catalog is identical across every
// serverless instance. Do NOT randomize these.
const CATEGORY_IDS = {
  candySweets: "00000000-0000-4000-8000-000000000001",
  snacks: "00000000-0000-4000-8000-000000000002",
  condiments: "00000000-0000-4000-8000-000000000003",
} as const;

const categoriesSeed: Array<{ id: string; name: string; slug: string }> = [
  { id: CATEGORY_IDS.candySweets, name: "Candy & Sweets", slug: "candy-sweets" },
  { id: CATEGORY_IDS.snacks, name: "Snacks", slug: "snacks" },
  { id: CATEGORY_IDS.condiments, name: "Condiments", slug: "condiments" },
];

const productsSeed: Array<{
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
}> = [
  {
    id: "00000000-0000-4000-8000-000000000101",
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
    categoryId: CATEGORY_IDS.candySweets,
  },
  {
    id: "00000000-0000-4000-8000-000000000102",
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
    categoryId: CATEGORY_IDS.snacks,
  },
  {
    id: "00000000-0000-4000-8000-000000000103",
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
    categoryId: CATEGORY_IDS.snacks,
  },
  {
    id: "00000000-0000-4000-8000-000000000104",
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
    categoryId: CATEGORY_IDS.snacks,
  },
  {
    id: "00000000-0000-4000-8000-000000000105",
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
    categoryId: CATEGORY_IDS.condiments,
  },
];

// ---- Redis-persisted shapes (dates stored as ISO strings) ----

interface StoredCartItem {
  id: string;
  productId: string;
  quantity: number;
  createdAt: string;
  updatedAt: string;
}

interface StoredCart {
  id: string;
  sessionId: string;
  createdAt: string;
  updatedAt: string;
  items: StoredCartItem[];
}

interface StoredOrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  price: number;
  createdAt: string;
}

interface StoredOrder {
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
  createdAt: string;
  updatedAt: string;
  items: StoredOrderItem[];
}

const cartKey = (sessionId: string) => `cart:${sessionId}`;
const orderKey = (orderId: string) => `order:${orderId}`;
const sessionOrdersKey = (sessionId: string) => `orders:session:${sessionId}`;

class Store {
  private readonly categories = new Map<string, Category>();
  private readonly products = new Map<string, Product>();

  constructor() {
    this.seedCatalog();
  }

  private seedCatalog() {
    const now = new Date();

    for (const cat of categoriesSeed) {
      this.categories.set(cat.id, {
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        createdAt: now,
        updatedAt: now,
      });
    }

    for (const product of productsSeed) {
      this.products.set(product.id, {
        ...product,
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  // ---- Catalog (in-memory, deterministic) ----

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

  // ---- Carts (Redis-persisted) ----

  private hydrateCart(stored: StoredCart): CartWithItems {
    const items: CartItemWithProduct[] = stored.items
      .map((item) => {
        const product = this.getProductWithCategory(item.productId);
        if (!product) return null;
        return {
          id: item.id,
          cartId: stored.id,
          productId: item.productId,
          quantity: item.quantity,
          createdAt: new Date(item.createdAt),
          updatedAt: new Date(item.updatedAt),
          product,
        } satisfies CartItemWithProduct;
      })
      .filter((item): item is CartItemWithProduct => item !== null);

    return {
      id: stored.id,
      sessionId: stored.sessionId,
      createdAt: new Date(stored.createdAt),
      updatedAt: new Date(stored.updatedAt),
      items,
    };
  }

  async getCartWithItems(sessionId: string): Promise<CartWithItems | null> {
    const stored = await kv.getJSON<StoredCart>(cartKey(sessionId));
    if (!stored) return null;
    return this.hydrateCart(stored);
  }

  async addToCart(
    sessionId: string,
    productId: string,
    quantity: number,
  ): Promise<CartWithItems> {
    const product = this.getProductWithCategory(productId);
    if (!product) {
      throw new Error("PRODUCT_NOT_FOUND");
    }

    const nowIso = new Date().toISOString();
    const stored =
      (await kv.getJSON<StoredCart>(cartKey(sessionId))) ??
      ({
        id: randomUUID(),
        sessionId,
        createdAt: nowIso,
        updatedAt: nowIso,
        items: [],
      } satisfies StoredCart);

    const existing = stored.items.find((item) => item.productId === productId);
    if (existing) {
      existing.quantity += quantity;
      existing.updatedAt = nowIso;
    } else {
      stored.items.push({
        id: randomUUID(),
        productId,
        quantity,
        createdAt: nowIso,
        updatedAt: nowIso,
      });
    }

    stored.updatedAt = nowIso;
    await kv.setJSON(cartKey(sessionId), stored);

    return this.hydrateCart(stored);
  }

  async clearCart(sessionId: string): Promise<void> {
    await kv.del(cartKey(sessionId));
  }

  // ---- Orders (Redis-persisted) ----

  private hydrateOrder(stored: StoredOrder): OrderWithItems {
    const order: Order = {
      id: stored.id,
      sessionId: stored.sessionId,
      customerName: stored.customerName,
      address: stored.address,
      phone: stored.phone,
      total: stored.total,
      status: stored.status,
      chargeId: stored.chargeId ?? null,
      checkoutToken: stored.checkoutToken ?? null,
      chargeStatus: stored.chargeStatus ?? null,
      chargeSubStatus: stored.chargeSubStatus ?? null,
      refundable: stored.refundable ?? false,
      reversible: stored.reversible ?? false,
      capturable: stored.capturable ?? false,
      capture: stored.capture ?? true,
      createdAt: new Date(stored.createdAt),
      updatedAt: new Date(stored.updatedAt),
    };

    const items: OrderItemWithProduct[] = stored.items
      .map((item) => {
        const product = this.products.get(item.productId);
        if (!product) return null;
        return {
          id: item.id,
          orderId: item.orderId,
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          createdAt: new Date(item.createdAt),
          product,
        } satisfies OrderItemWithProduct;
      })
      .filter((item): item is OrderItemWithProduct => item !== null);

    return { ...order, items };
  }

  private async saveOrder(stored: StoredOrder): Promise<void> {
    await kv.setJSON(orderKey(stored.id), stored);
    await kv.sadd(sessionOrdersKey(stored.sessionId), stored.id);
  }

  async createOrder(input: {
    sessionId: string;
    customerName: string;
    address: string;
    phone: string;
    capture?: boolean;
  }): Promise<OrderWithItems> {
    const cart = await this.getCartWithItems(input.sessionId);
    if (!cart || cart.items.length === 0) {
      throw new Error("CART_EMPTY");
    }

    const nowIso = new Date().toISOString();
    const total = cart.items.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0,
    );

    const orderId = randomUUID();
    const stored: StoredOrder = {
      id: orderId,
      sessionId: input.sessionId,
      customerName: input.customerName,
      address: input.address,
      phone: input.phone,
      total,
      status: "pending",
      capture: input.capture ?? true,
      createdAt: nowIso,
      updatedAt: nowIso,
      items: cart.items.map((cartItem) => ({
        id: randomUUID(),
        orderId,
        productId: cartItem.productId,
        quantity: cartItem.quantity,
        price: cartItem.product.price,
        createdAt: nowIso,
      })),
    };

    await this.saveOrder(stored);
    await this.clearCart(input.sessionId);

    return this.hydrateOrder(stored);
  }

  async getOrder(id: string): Promise<OrderWithItems | undefined> {
    const stored = await kv.getJSON<StoredOrder>(orderKey(id));
    if (!stored) return undefined;
    return this.hydrateOrder(stored);
  }

  async setCheckoutToken(orderId: string, checkoutToken: string): Promise<void> {
    const stored = await kv.getJSON<StoredOrder>(orderKey(orderId));
    if (!stored) return;
    stored.checkoutToken = checkoutToken;
    stored.updatedAt = new Date().toISOString();
    await this.saveOrder(stored);
  }

  async updateOrderCharge(
    orderId: string,
    charge: {
      id: string;
      status: string;
      sub_status: string;
      refundable: boolean;
      reversible: boolean;
      capturable: boolean;
    },
  ): Promise<OrderWithItems | undefined> {
    const stored = await kv.getJSON<StoredOrder>(orderKey(orderId));
    if (!stored) return undefined;

    stored.chargeId = charge.id;
    stored.chargeStatus = charge.status;
    stored.chargeSubStatus = charge.sub_status;
    stored.refundable = charge.refundable;
    stored.reversible = charge.reversible;
    stored.capturable = charge.capturable;
    stored.status =
      charge.status === "successful"
        ? "paid"
        : charge.status === "failed"
          ? "failed"
          : stored.status;
    stored.updatedAt = new Date().toISOString();

    await this.saveOrder(stored);
    return this.hydrateOrder(stored);
  }

  async listOrdersBySession(sessionId: string): Promise<OrderWithItems[]> {
    const ids = await kv.smembers(sessionOrdersKey(sessionId));
    if (ids.length === 0) return [];

    const orders = await Promise.all(
      ids.map((id) => kv.getJSON<StoredOrder>(orderKey(id))),
    );

    return orders
      .filter((o): o is StoredOrder => o !== null)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .map((o) => this.hydrateOrder(o));
  }

  /**
   * Rebuild a minimal order record from a PayGenix charge when the original
   * order is not in storage (e.g. created before persistence, or a returning
   * shopper on a fresh session).
   */
  async recoverOrderFromCharge(
    orderId: string,
    charge: {
      id: string;
      amount: number;
      status: string;
      sub_status: string;
      refundable: boolean;
      reversible: boolean;
      capturable: boolean;
      capture: boolean;
      merchant_customer_id?: string;
      card?: { name?: string };
    },
  ): Promise<OrderWithItems> {
    const nowIso = new Date().toISOString();
    const stored: StoredOrder = {
      id: orderId,
      sessionId: charge.merchant_customer_id ?? "recovered",
      customerName: charge.card?.name ?? "Customer",
      address: "—",
      phone: "—",
      total: charge.amount / 100,
      status:
        charge.status === "successful"
          ? "paid"
          : charge.status === "failed"
            ? "failed"
            : "pending",
      chargeId: charge.id,
      chargeStatus: charge.status,
      chargeSubStatus: charge.sub_status,
      refundable: charge.refundable,
      reversible: charge.reversible,
      capturable: charge.capturable,
      capture: charge.capture,
      createdAt: nowIso,
      updatedAt: nowIso,
      items: [],
    };

    await this.saveOrder(stored);
    return this.hydrateOrder(stored);
  }
}

export const store = new Store();
