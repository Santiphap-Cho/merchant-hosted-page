import type {
  CartItemWithProduct,
  OrderItemWithProduct,
  OrderWithItems,
  ProductWithCategory,
} from "./types.js";
import type { ChargeSummary } from "@thaimark/shared-types";

export function toProductResponse(product: ProductWithCategory) {
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    price: product.price,
    originalPrice: product.originalPrice,
    discountPercent: product.discountPercent,
    imageUrl: product.imageUrl,
    rating: product.rating,
    soldCount: product.soldCount,
    categoryId: product.categoryId,
    category: {
      id: product.category.id,
      name: product.category.name,
      slug: product.category.slug,
    },
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  };
}

export function toCartItemResponse(item: CartItemWithProduct) {
  return {
    id: item.id,
    productId: item.productId,
    quantity: item.quantity,
    product: toProductResponse(item.product),
  };
}

export function toChargeSummary(charge: {
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
  card?: { brand?: string; last_digits?: string; name?: string };
  paid_at?: string | null;
}): ChargeSummary {
  return {
    id: charge.id,
    status: charge.status,
    sub_status: charge.sub_status,
    amount: charge.amount,
    captured_amount: charge.captured_amount,
    refunded_amount: charge.refunded_amount,
    refundable: charge.refundable,
    reversible: charge.reversible,
    capturable: charge.capturable,
    capture: charge.capture,
    card: charge.card,
    paid_at: charge.paid_at,
  };
}

export function toOrderResponse(order: OrderWithItems, charge?: ChargeSummary | null) {
  return {
    id: order.id,
    sessionId: order.sessionId,
    customerName: order.customerName,
    address: order.address,
    phone: order.phone,
    total: order.total,
    status: order.status,
    chargeId: order.chargeId ?? null,
    checkoutToken: order.checkoutToken ?? null,
    chargeStatus: order.chargeStatus ?? null,
    chargeSubStatus: order.chargeSubStatus ?? null,
    refundable: order.refundable ?? false,
    reversible: order.reversible ?? false,
    capturable: order.capturable ?? false,
    capture: order.capture ?? true,
    items: order.items.map(toOrderItemResponse),
    charge: charge ?? null,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  };
}

export function toOrderItemResponse(item: OrderItemWithProduct) {
  return {
    id: item.id,
    productId: item.productId,
    quantity: item.quantity,
    price: item.price,
    product: {
      id: item.product.id,
      name: item.product.name,
      description: item.product.description,
      price: item.product.price,
      originalPrice: item.product.originalPrice,
      discountPercent: item.product.discountPercent,
      imageUrl: item.product.imageUrl,
      rating: item.product.rating,
      soldCount: item.product.soldCount,
      categoryId: item.product.categoryId,
      createdAt: item.product.createdAt.toISOString(),
      updatedAt: item.product.updatedAt.toISOString(),
    },
  };
}
