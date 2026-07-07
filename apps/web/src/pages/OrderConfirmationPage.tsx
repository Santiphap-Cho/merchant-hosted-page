import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import type { OrderHistoryItem } from "@thaimark/shared-types";
import { formatPrice } from "@thaimark/ui";
import { ProductImage } from "../components/ProductImage";
import { apiFetch } from "../lib/api";

export function OrderConfirmationPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const [order, setOrder] = useState<OrderHistoryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const chargeId =
      searchParams.get("charge_id") ??
      searchParams.get("chargeId") ??
      searchParams.get("chrg") ??
      (searchParams.get("ref")?.startsWith("chrg_") ? searchParams.get("ref") : null);

    async function load() {
      try {
        const synced = await apiFetch<OrderHistoryItem>(
          `/api/orders/${id}/sync-charge`,
          {
            method: "POST",
            body: JSON.stringify(chargeId ? { chargeId } : {}),
          },
        );
        setOrder(synced);
      } catch (e) {
        if (!chargeId) {
          try {
            const data = await apiFetch<OrderHistoryItem>(`/api/orders/${id}`);
            setOrder(data);
            return;
          } catch {
            // fall through to error below
          }
        }
        setError(e instanceof Error ? e.message : "Failed to load order");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id, searchParams]);

  if (loading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center animate-pulse">
        <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4" />
        <div className="h-6 bg-gray-200 rounded w-1/2 mx-auto" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <p className="text-red-500">{error || "Order not found"}</p>
        <Link to="/" className="text-primary mt-4 inline-block hover:underline">
          Back to Home
        </Link>
      </div>
    );
  }

  const isPaid = order.status === "paid";

  return (
    <div className="max-w-lg mx-auto px-4 py-8 sm:py-12">
      <div className="bg-white rounded-xl shadow-sm p-6 sm:p-8 text-center">
        <div
          className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
            isPaid ? "bg-green-100" : "bg-amber-100"
          }`}
        >
          <svg
            className={`w-8 h-8 ${isPaid ? "text-green-500" : "text-amber-500"}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-gray-900">
          {isPaid ? "Order Confirmed!" : "Payment Pending"}
        </h1>
        <p className="text-gray-500 mt-2">
          {isPaid
            ? `Thank you, ${order.customerName}. Your Thai snacks are on the way!`
            : `Hi ${order.customerName}, your payment is still processing.`}
        </p>

        <div className="mt-6 text-left bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Order ID</span>
            <span className="font-mono text-xs">{order.id}</span>
          </div>
          {order.chargeId && (
            <div className="flex justify-between">
              <span className="text-gray-500">Charge ID</span>
              <span className="font-mono text-xs">{order.chargeId}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-500">Status</span>
            <span className="font-medium capitalize">{order.status}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Total</span>
            <span className="font-bold text-primary">{formatPrice(order.total)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Phone</span>
            <span>{order.phone}</span>
          </div>
          <div>
            <span className="text-gray-500">Address</span>
            <p className="mt-0.5">{order.address}</p>
          </div>
        </div>

        <ul className="mt-4 text-left space-y-2">
          {order.items.map((item) => (
            <li key={item.id} className="flex gap-3 text-sm border-t pt-2">
              <ProductImage
                src={item.product?.imageUrl}
                alt={item.product?.name ?? "Product"}
                className="w-12 h-12 rounded object-cover"
              />
              <div className="flex-1">
                <p className="font-medium line-clamp-1">{item.product?.name}</p>
                <p className="text-gray-500">Qty: {item.quantity}</p>
              </div>
              <span className="font-medium">{formatPrice(item.price * item.quantity)}</span>
            </li>
          ))}
        </ul>

        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/orders"
            className="inline-block border border-primary text-primary font-semibold px-6 py-2.5 rounded-lg hover:bg-primary-light"
          >
            Order History
          </Link>
          <Link
            to="/"
            className="inline-block bg-primary hover:bg-primary-dark text-white font-semibold px-8 py-2.5 rounded-lg transition-colors"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
