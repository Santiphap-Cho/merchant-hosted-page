import { Router } from "express";
import {
  captureCharge,
  createPayGenixCheckoutSession,
  getCharge,
  getMerchantBaseUrl,
  getPayGenixCallbackUrl,
  refundCharge,
  resolveChargeIdForOrder,
  reverseCharge,
  toSatang,
} from "../lib/paygenix.js";
import {
  toChargeSummary,
  toOrderResponse,
} from "../lib/serializers.js";
import { store } from "../lib/store.js";
import { AppError } from "../middleware/errorHandler.js";
import { createOrderSchema, syncChargeSchema } from "../schemas/index.js";

export const ordersRouter: Router = Router();

async function syncOrderWithCharge(orderId: string, hintChargeId?: string) {
  let order = await store.getOrder(orderId);

  const chargeId =
    hintChargeId ??
    order?.chargeId ??
    (order ? await resolveChargeIdForOrder(order) : null) ??
    undefined;

  if (!chargeId) {
    if (!order) {
      throw new AppError(404, "Order not found");
    }
    throw new AppError(400, "No charge linked to this order yet");
  }

  const charge = await getCharge(chargeId);

  if (!order) {
    const ref = charge.merchant_reference_id;
    if (ref && ref !== orderId) {
      throw new AppError(404, "Order not found");
    }
    order = await store.recoverOrderFromCharge(orderId, charge);
  }

  const updated = await store.updateOrderCharge(order.id, {
    id: charge.id,
    status: charge.status,
    sub_status: charge.sub_status,
    refundable: charge.refundable,
    reversible: charge.reversible,
    capturable: charge.capturable,
  });

  if (!updated) {
    throw new AppError(404, "Order not found");
  }

  return { order: updated, charge };
}

ordersRouter.get("/", async (req, res, next) => {
  try {
    const sessionId = req.query.sessionId;
    if (typeof sessionId !== "string" || !sessionId) {
      throw new AppError(400, "sessionId query parameter is required");
    }

    const orders = await store.listOrdersBySession(sessionId);
    res.json({
      data: orders.map((order) => toOrderResponse(order)),
    });
  } catch (err) {
    next(err);
  }
});

ordersRouter.post("/", async (req, res, next) => {
  try {
    const input = createOrderSchema.parse(req.body);

    let order;
    try {
      order = await store.createOrder(input);
    } catch (err) {
      if (err instanceof Error && err.message === "CART_EMPTY") {
        throw new AppError(400, "Cart is empty");
      }
      throw err;
    }

    const checkoutSession = await createPayGenixCheckoutSession({
      amount: order.total,
      referenceId: order.id,
      merchantCustomerId: `cust_${input.sessionId.slice(0, 12)}`,
      callbackUrl: getPayGenixCallbackUrl(order.id),
      idempotencyKey: `order_${order.id}`,
      capture: input.capture,
    });

    await store.setCheckoutToken(order.id, checkoutSession.token);

    res.status(201).json({
      ...toOrderResponse(order),
      checkoutUrl: checkoutSession.redirect_url,
      checkoutToken: checkoutSession.token,
      checkoutExpiresAt: checkoutSession.expires_at,
    });
  } catch (err) {
    next(err);
  }
});

ordersRouter.post("/:id/sync-charge", async (req, res, next) => {
  try {
    const input = syncChargeSchema.parse(req.body ?? {});
    const { order, charge } = await syncOrderWithCharge(
      req.params.id,
      input.chargeId,
    );

    res.json(toOrderResponse(order, toChargeSummary(charge)));
  } catch (err) {
    next(err);
  }
});

ordersRouter.get("/:id/payment-return", async (req, res, next) => {
  try {
    const orderId = req.params.id;
    const order = await store.getOrder(orderId);
    if (!order) {
      throw new AppError(404, "Order not found");
    }

    const hintChargeId =
      (typeof req.query.charge_id === "string" && req.query.charge_id) ||
      (typeof req.query.chargeId === "string" && req.query.chargeId) ||
      undefined;

    const merchantBase = getMerchantBaseUrl().replace(/\/$/, "");
    const target = new URL(`${merchantBase}/orders/${orderId}`);

    if (hintChargeId) {
      target.searchParams.set("charge_id", hintChargeId);
    }

    try {
      await syncOrderWithCharge(orderId, hintChargeId);
    } catch {
      // Still send the shopper back to the merchant order page.
    }

    res.redirect(302, target.toString());
  } catch (err) {
    next(err);
  }
});

ordersRouter.post("/:id/refund", async (req, res, next) => {
  try {
    const order = await store.getOrder(req.params.id);

    if (!order) {
      throw new AppError(404, "Order not found");
    }

    if (!order.chargeId) {
      throw new AppError(400, "Order has no linked charge");
    }

    const charge = await getCharge(order.chargeId);
    if (!charge.refundable) {
      throw new AppError(400, "Charge is not refundable");
    }

    const refund = await refundCharge(
      order.chargeId,
      charge.captured_amount || toSatang(order.total),
    );

    const refreshed = await getCharge(order.chargeId);
    const updated = await store.updateOrderCharge(order.id, {
      id: refreshed.id,
      status: refreshed.status,
      sub_status: refreshed.sub_status,
      refundable: refreshed.refundable,
      reversible: refreshed.reversible,
      capturable: refreshed.capturable,
    });

    res.json({
      order: updated ? toOrderResponse(updated, toChargeSummary(refreshed)) : null,
      refund,
    });
  } catch (err) {
    next(err);
  }
});

ordersRouter.post("/:id/capture", async (req, res, next) => {
  try {
    const order = await store.getOrder(req.params.id);

    if (!order) {
      throw new AppError(404, "Order not found");
    }

    if (!order.chargeId) {
      throw new AppError(400, "Order has no linked charge");
    }

    const charge = await getCharge(order.chargeId);
    if (!charge.capturable) {
      throw new AppError(400, "Charge is not capturable");
    }

    const captured = await captureCharge(order.chargeId);
    const updated = await store.updateOrderCharge(order.id, {
      id: captured.id,
      status: captured.status,
      sub_status: captured.sub_status,
      refundable: captured.refundable,
      reversible: captured.reversible,
      capturable: captured.capturable,
    });

    res.json({
      order: updated ? toOrderResponse(updated, toChargeSummary(captured)) : null,
      charge: captured,
    });
  } catch (err) {
    next(err);
  }
});

ordersRouter.post("/:id/reverse", async (req, res, next) => {
  try {
    const order = await store.getOrder(req.params.id);

    if (!order) {
      throw new AppError(404, "Order not found");
    }

    if (!order.chargeId) {
      throw new AppError(400, "Order has no linked charge");
    }

    const charge = await getCharge(order.chargeId);
    if (!charge.reversible) {
      throw new AppError(400, "Charge is not reversible");
    }

    const reversed = await reverseCharge(order.chargeId);
    const updated = await store.updateOrderCharge(order.id, {
      id: reversed.id,
      status: reversed.status,
      sub_status: reversed.sub_status,
      refundable: reversed.refundable,
      reversible: reversed.reversible,
      capturable: reversed.capturable,
    });

    res.json({
      order: updated ? toOrderResponse(updated, toChargeSummary(reversed)) : null,
      charge: reversed,
    });
  } catch (err) {
    next(err);
  }
});

ordersRouter.get("/:id", async (req, res, next) => {
  try {
    const order = await store.getOrder(req.params.id);

    if (!order) {
      throw new AppError(404, "Order not found");
    }

    let chargeSummary = null;
    let current = order;

    if (!order.chargeId) {
      const resolvedId = await resolveChargeIdForOrder(order);
      if (resolvedId) {
        try {
          const charge = await getCharge(resolvedId);
          const updated = await store.updateOrderCharge(order.id, {
            id: charge.id,
            status: charge.status,
            sub_status: charge.sub_status,
            refundable: charge.refundable,
            reversible: charge.reversible,
            capturable: charge.capturable,
          });
          if (updated) {
            current = updated;
            chargeSummary = toChargeSummary(charge);
          }
        } catch {
          // charge fetch failed — return order without live charge data
        }
      }
    } else {
      try {
        const charge = await getCharge(order.chargeId);
        chargeSummary = toChargeSummary(charge);
        const updated = await store.updateOrderCharge(order.id, {
          id: charge.id,
          status: charge.status,
          sub_status: charge.sub_status,
          refundable: charge.refundable,
          reversible: charge.reversible,
          capturable: charge.capturable,
        });
        if (updated) {
          current = updated;
        }
      } catch {
        // charge fetch failed — return order without live charge data
      }
    }

    res.json(toOrderResponse(current, chargeSummary));
  } catch (err) {
    next(err);
  }
});
