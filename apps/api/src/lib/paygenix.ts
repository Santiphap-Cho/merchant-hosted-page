import { randomUUID } from "crypto";
import { AppError } from "../middleware/errorHandler.js";

const PAYGENIX_API_URL =
  process.env.PAYGENIX_API_URL ?? "https://dev-api.paygenix.co";

function getSecretKey(): string {
  const secretKey = process.env.PAYGENIX_SECRET_KEY;
  if (!secretKey) {
    throw new AppError(500, "PayGenix secret key is not configured");
  }
  return secretKey;
}

function basicAuthHeader(secretKey: string): string {
  return `Basic ${Buffer.from(`${secretKey}:`).toString("base64")}`;
}

async function paygenixJson<T>(
  path: string,
  options: {
    method?: string;
    body?: unknown;
    idempotencyKey?: string;
  } = {},
): Promise<T> {
  const secretKey = getSecretKey();
  const headers: Record<string, string> = {
    Authorization: basicAuthHeader(secretKey),
  };

  if (options.idempotencyKey) {
    headers["Idempotency-Key"] = options.idempotencyKey;
  }

  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${PAYGENIX_API_URL}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  const body = (await response.json().catch(() => ({}))) as T & {
    message?: string;
    code?: string;
  };

  if (!response.ok) {
    throw new AppError(
      response.status,
      body.message ?? `PayGenix request failed (${response.status})`,
      body,
    );
  }

  return body;
}

export interface PayGenixCharge {
  object: string;
  id: string;
  amount: number;
  currency: string;
  captured_amount: number;
  refunded_amount: number;
  status: string;
  sub_status: string;
  capture: boolean;
  capturable: boolean;
  reversible: boolean;
  refundable: boolean;
  merchant_reference_id?: string;
  merchant_customer_id?: string;
  card?: {
    brand?: string;
    last_digits?: string;
    name?: string;
  };
  refunds?: {
    object: string;
    data: unknown[];
    total: number;
  };
  created_at?: string;
  paid_at?: string | null;
}

export interface PayGenixRefund {
  object: string;
  id: string;
  amount: number;
  currency: string;
  charge: string;
  voided: boolean;
  status: string;
  created_at: string;
}

export interface PayGenixCheckoutSession {
  token: string;
  redirect_url: string;
  expires_at: string;
}

interface CreateCheckoutSessionParams {
  amount: number;
  referenceId: string;
  merchantCustomerId: string;
  callbackUrl: string;
  idempotencyKey: string;
  capture?: boolean;
}

export async function createPayGenixCheckoutSession(
  params: CreateCheckoutSessionParams,
): Promise<PayGenixCheckoutSession> {
  const secretKey = getSecretKey();
  const serviceId = Number(process.env.PAYGENIX_SERVICE_ID) || 1001;

  const response = await fetch(
    `${PAYGENIX_API_URL}/v2/external/checkout/session`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${secretKey}`,
        "Idempotency-Key": params.idempotencyKey,
      },
      body: JSON.stringify({
        amount: params.amount,
        currency: "THB",
        callback_url: params.callbackUrl,
        reference_id: params.referenceId,
        service_id: serviceId,
        merchant_customer_id: params.merchantCustomerId,
        capture: params.capture ?? true,
      }),
    },
  );

  const body = (await response.json().catch(() => ({}))) as {
    message?: string;
    redirect_url?: string;
    token?: string;
    expires_at?: string;
  };

  if (!response.ok) {
    throw new AppError(
      response.status,
      body.message ?? "Failed to create PayGenix checkout session",
      body,
    );
  }

  if (!body.redirect_url || !body.token) {
    throw new AppError(502, "Invalid PayGenix checkout session response", body);
  }

  return {
    token: body.token,
    redirect_url: body.redirect_url,
    expires_at: body.expires_at ?? "",
  };
}

export function getMerchantBaseUrl(): string {
  return (
    process.env.MERCHANT_URL ??
    process.env.CORS_ORIGIN ??
    `http://localhost:${process.env.WEB_PORT ?? "5173"}`
  );
}

export function getPayGenixCallbackUrl(orderId: string): string {
  const base =
    process.env.PAYGENIX_CALLBACK_URL ??
    toHttpsOrigin(getMerchantBaseUrl());

  return `${base.replace(/\/$/, "")}/orders/${orderId}`;
}

export function toSatang(baht: number): number {
  return Math.round(baht * 100);
}

export async function getCharge(chargeId: string): Promise<PayGenixCharge> {
  return paygenixJson<PayGenixCharge>(`/v2/charges/${chargeId}`);
}

interface OrderChargeLookup {
  id: string;
  chargeId?: string | null;
}

/** Try to find a charge id for an order when PayGenix did not pass charge_id on return. */
export async function resolveChargeIdForOrder(
  order: OrderChargeLookup,
): Promise<string | null> {
  if (order.chargeId) {
    return order.chargeId;
  }

  const lookupPaths = [
    `/v2/charges?merchant_reference_id=${encodeURIComponent(order.id)}`,
    `/v2/charges?reference_id=${encodeURIComponent(order.id)}`,
  ];

  for (const path of lookupPaths) {
    try {
      const result = await paygenixJson<
        PayGenixCharge | { data?: PayGenixCharge[] }
      >(path);

      if ("id" in result && typeof result.id === "string" && result.id) {
        return result.id;
      }

      if (
        "data" in result &&
        Array.isArray(result.data) &&
        result.data[0]?.id
      ) {
        return result.data[0].id;
      }
    } catch (err) {
      if (err instanceof AppError && [400, 404, 405].includes(err.statusCode)) {
        continue;
      }
      throw err;
    }
  }

  return null;
}

export async function refundCharge(
  chargeId: string,
  amountSatang: number,
): Promise<PayGenixRefund> {
  return paygenixJson<PayGenixRefund>(`/v2/charges/${chargeId}/refunds`, {
    method: "POST",
    idempotencyKey: `refund_${chargeId}_${randomUUID()}`,
    body: { amount: amountSatang },
  });
}

export async function reverseCharge(chargeId: string): Promise<PayGenixCharge> {
  return paygenixJson<PayGenixCharge>(`/v2/charges/${chargeId}/reverse`, {
    method: "POST",
    idempotencyKey: `reverse_${chargeId}_${randomUUID()}`,
  });
}

export async function captureCharge(chargeId: string): Promise<PayGenixCharge> {
  return paygenixJson<PayGenixCharge>(`/v2/charges/${chargeId}/capture`, {
    method: "POST",
    idempotencyKey: `capture_${chargeId}_${randomUUID()}`,
  });
}

function toHttpsOrigin(url: string): string {
  const parsed = new URL(url);

  if (parsed.protocol !== "https:") {
    parsed.protocol = "https:";
  }

  return parsed.origin;
}
