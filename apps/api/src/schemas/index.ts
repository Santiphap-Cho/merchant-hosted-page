import { z } from "zod";

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
  category: z.string().optional(),
  q: z.string().optional(),
});

export const addToCartSchema = z.object({
  sessionId: z.string().min(1),
  productId: z.string().min(1),
  quantity: z.coerce.number().int().min(1).default(1),
});

export const createOrderSchema = z.object({
  sessionId: z.string().min(1),
  customerName: z.string().min(2, "Name is required"),
  address: z.string().min(5, "Address is required"),
  phone: z.string().min(9, "Valid phone number is required"),
  capture: z.boolean().optional().default(true),
});

export const syncChargeSchema = z.object({
  chargeId: z.string().optional(),
});
