import { Router } from "express";
import { store } from "../lib/store.js";
import { toProductResponse } from "../lib/serializers.js";
import { AppError } from "../middleware/errorHandler.js";
import { paginationSchema } from "../schemas/index.js";

export const productsRouter: Router = Router();

productsRouter.get("/", async (req, res, next) => {
  try {
    const { page, limit, category, q } = paginationSchema.parse(req.query);

    const result = store.listProducts({
      page,
      limit,
      categorySlug: category,
      query: q,
    });

    res.json({
      data: result.data.map(toProductResponse),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    });
  } catch (err) {
    next(err);
  }
});

productsRouter.get("/:id", async (req, res, next) => {
  try {
    const product = store.getProductWithCategory(req.params.id);

    if (!product) {
      throw new AppError(404, "Product not found");
    }

    res.json(toProductResponse(product));
  } catch (err) {
    next(err);
  }
});
