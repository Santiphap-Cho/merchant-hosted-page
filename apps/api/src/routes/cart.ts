import { Router } from "express";
import { store } from "../lib/store.js";
import { toCartItemResponse } from "../lib/serializers.js";
import { AppError } from "../middleware/errorHandler.js";
import { addToCartSchema } from "../schemas/index.js";

export const cartRouter: Router = Router();

cartRouter.post("/", async (req, res, next) => {
  try {
    const input = addToCartSchema.parse(req.body);

    try {
      const cart = await store.addToCart(
        input.sessionId,
        input.productId,
        input.quantity,
      );

      res.status(201).json({
        id: cart.id,
        sessionId: cart.sessionId,
        items: cart.items.map(toCartItemResponse),
        createdAt: cart.createdAt.toISOString(),
        updatedAt: cart.updatedAt.toISOString(),
      });
    } catch (err) {
      if (err instanceof Error && err.message === "PRODUCT_NOT_FOUND") {
        throw new AppError(404, "Product not found");
      }
      throw err;
    }
  } catch (err) {
    next(err);
  }
});

cartRouter.get("/:sessionId", async (req, res, next) => {
  try {
    const cart = await store.getCartWithItems(req.params.sessionId);

    if (!cart) {
      res.json({
        id: null,
        sessionId: req.params.sessionId,
        items: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      return;
    }

    res.json({
      id: cart.id,
      sessionId: cart.sessionId,
      items: cart.items.map(toCartItemResponse),
      createdAt: cart.createdAt.toISOString(),
      updatedAt: cart.updatedAt.toISOString(),
    });
  } catch (err) {
    next(err);
  }
});
