import "./loadEnv.js";
import cors from "cors";
import express, { type Express } from "express";
import { errorHandler } from "./middleware/errorHandler.js";
import { productsRouter } from "./routes/products.js";
import { cartRouter } from "./routes/cart.js";
import { ordersRouter } from "./routes/orders.js";

export function createApp(): Express {
  const app = express();
  const webPort = process.env.WEB_PORT || "5173";
  const corsOrigin =
    process.env.CORS_ORIGIN || `http://localhost:${webPort}`;

  app.use(
    cors({
      origin:
        process.env.NODE_ENV === "production"
          ? corsOrigin
          : (origin, callback) => {
              if (!origin || /^https?:\/\/localhost:\d+$/.test(origin)) {
                callback(null, true);
              } else {
                callback(null, corsOrigin);
              }
            },
    }),
  );
  app.use(express.json());

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", name: "ThaiMark API" });
  });

  app.use("/api/products", productsRouter);
  app.use("/api/cart", cartRouter);
  app.use("/api/orders", ordersRouter);

  app.use(errorHandler);

  return app;
}

export const app: Express = createApp();
