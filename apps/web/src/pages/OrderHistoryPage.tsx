import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { OrderHistoryItem } from "@thaimark/shared-types";
import { formatPrice } from "@thaimark/ui";
import { apiFetch } from "../lib/api";
import { useCartStore } from "../store/cartStore";

function statusBadge(status: string) {
  const styles: Record<string, string> = {
    paid: "bg-green-100 text-green-700",
    pending: "bg-amber-100 text-amber-700",
    failed: "bg-red-100 text-red-700",
    refunded: "bg-gray-100 text-gray-700",
  };
  return (
    <span
      className={`text-xs font-semibold px-2 py-0.5 rounded capitalize ${
        styles[status] ?? "bg-gray-100 text-gray-600"
      }`}
    >
      {status}
    </span>
  );
}

export function OrderHistoryPage() {
  const sessionId = useCartStore((s) => s.sessionId);
  const [orders, setOrders] = useState<OrderHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [chargeLoadingId, setChargeLoadingId] = useState<string | null>(null);
  const [linkChargeId, setLinkChargeId] = useState("");
  const [linkingId, setLinkingId] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<{ data: OrderHistoryItem[] }>(
        `/api/orders?sessionId=${encodeURIComponent(sessionId)}`,
      );
      setOrders(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const loadChargeDetail = async (orderId: string) => {
    setChargeLoadingId(orderId);
    setMessage(null);
    try {
      const updated = await apiFetch<OrderHistoryItem>(
        `/api/orders/${orderId}/sync-charge`,
        { method: "POST", body: JSON.stringify({}) },
      );
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
    } catch {
      try {
        const updated = await apiFetch<OrderHistoryItem>(`/api/orders/${orderId}`);
        setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
      } catch (err) {
        setMessage(err instanceof Error ? err.message : "Failed to load charge details");
        setSelectedId(null);
      }
    } finally {
      setChargeLoadingId(null);
    }
  };

  const handleLinkCharge = async (orderId: string) => {
    const chargeId = linkChargeId.trim();
    if (!chargeId.startsWith("chrg_")) {
      setMessage("Enter the Transaction ID from PayGenix (starts with chrg_)");
      return;
    }

    setLinkingId(orderId);
    setMessage(null);
    try {
      const updated = await apiFetch<OrderHistoryItem>(
        `/api/orders/${orderId}/sync-charge`,
        { method: "POST", body: JSON.stringify({ chargeId }) },
      );
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
      setLinkChargeId("");
      setMessage("Payment linked");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to link payment");
    } finally {
      setLinkingId(null);
    }
  };

  const handleOrderClick = (orderId: string) => {
    if (selectedId === orderId) {
      setSelectedId(null);
      return;
    }
    setSelectedId(orderId);
    setLinkChargeId("");
    loadChargeDetail(orderId);
  };

  const handleRefund = async (orderId: string) => {
    if (!confirm("Refund this charge?")) return;

    setActionId(orderId);
    setMessage(null);
    try {
      const res = await apiFetch<{ order: OrderHistoryItem | null }>(
        `/api/orders/${orderId}/refund`,
        { method: "POST" },
      );
      if (res.order) {
        setOrders((prev) => prev.map((o) => (o.id === orderId ? res.order! : o)));
      }
      setMessage("Refund submitted");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Refund failed");
    } finally {
      setActionId(null);
    }
  };

  const handleReverse = async (orderId: string) => {
    if (!confirm("Void this charge?")) return;

    setActionId(orderId);
    setMessage(null);
    try {
      const res = await apiFetch<{ order: OrderHistoryItem | null }>(
        `/api/orders/${orderId}/reverse`,
        { method: "POST" },
      );
      if (res.order) {
        setOrders((prev) => prev.map((o) => (o.id === orderId ? res.order! : o)));
      }
      setMessage("Charge voided");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Void failed");
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Order History</h1>
        <Link to="/" className="text-primary text-sm font-medium hover:underline">
          Continue Shopping
        </Link>
      </div>

      <p className="mb-4 text-sm text-gray-500">Tap an order to load charge status.</p>

      {message && (
        <p className="mb-4 text-sm bg-blue-50 text-primary p-3 rounded-lg">{message}</p>
      )}

      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-4 animate-pulse h-32" />
          ))}
        </div>
      )}

      {error && <p className="text-red-500 text-center py-8">{error}</p>}

      {!loading && !error && orders.length === 0 && (
        <div className="text-center py-16 bg-white rounded-xl">
          <p className="text-gray-500 mb-4">No orders yet</p>
          <Link
            to="/"
            className="inline-block bg-primary text-white font-semibold px-6 py-2.5 rounded hover:bg-primary-dark"
          >
            Start Shopping
          </Link>
        </div>
      )}

      <ul className="space-y-4">
        {orders.map((order) => {
          const isSelected = selectedId === order.id;
          const isLoadingCharge = chargeLoadingId === order.id;

          return (
            <li key={order.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
              <button
                type="button"
                onClick={() => handleOrderClick(order.id)}
                className={`w-full text-left p-4 sm:p-5 transition-colors ${
                  isSelected ? "bg-primary-light/40" : "hover:bg-gray-50"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-gray-900">
                      {formatPrice(order.total)}
                      <span className="ml-2">{statusBadge(order.status)}</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(order.createdAt).toLocaleString("th-TH")}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">{order.customerName}</p>
                  </div>
                  <span className="text-xs text-gray-400">
                    {isSelected ? "▲" : "▼"}
                  </span>
                </div>

                <ul className="text-sm text-gray-600 mt-3 space-y-1">
                  {order.items.map((item) => (
                    <li key={item.id}>
                      {item.product?.name} × {item.quantity}
                    </li>
                  ))}
                </ul>
              </button>

              {isSelected && (
                <div className="border-t px-4 sm:px-5 py-4 bg-gray-50">
                  {isLoadingCharge && (
                    <p className="text-sm text-gray-500 animate-pulse">Loading charge...</p>
                  )}

                  {!isLoadingCharge && !order.chargeId && (
                    <div className="text-sm space-y-3">
                      <p className="text-gray-500">
                        No charge linked yet. After paying on PayGenix, you should
                        return here automatically. If not, paste the Transaction ID
                        from the PayGenix success page.
                      </p>
                      <form
                        className="flex flex-wrap gap-2"
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleLinkCharge(order.id);
                        }}
                      >
                        <input
                          type="text"
                          value={linkChargeId}
                          onChange={(e) => setLinkChargeId(e.target.value)}
                          placeholder="chrg_..."
                          className="flex-1 min-w-[12rem] rounded-lg border border-gray-300 px-3 py-2 text-xs font-mono"
                        />
                        <button
                          type="submit"
                          disabled={linkingId === order.id}
                          className="px-4 py-2 text-sm font-semibold bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50"
                        >
                          Link payment
                        </button>
                      </form>
                    </div>
                  )}

                  {!isLoadingCharge && order.charge && (
                    <div className="text-sm space-y-3">
                      <div className="bg-white rounded-lg p-3 space-y-1 text-xs">
                        <p>
                          <span className="text-gray-500">Charge:</span>{" "}
                          <span className="font-mono">{order.charge.id}</span>
                        </p>
                        <p>
                          <span className="text-gray-500">Status:</span>{" "}
                          {order.charge.status} / {order.charge.sub_status}
                        </p>
                        {order.charge.card?.last_digits && (
                          <p>
                            Card: {order.charge.card.brand} •••• {order.charge.card.last_digits}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {order.refundable && (
                          <button
                            onClick={() => handleRefund(order.id)}
                            disabled={actionId === order.id}
                            className="px-4 py-2 text-sm font-semibold bg-flash-red text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
                          >
                            Refund
                          </button>
                        )}
                        {order.reversible && (
                          <button
                            onClick={() => handleReverse(order.id)}
                            disabled={actionId === order.id}
                            className="px-4 py-2 text-sm font-semibold bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50"
                          >
                            Void
                          </button>
                        )}
                        {!order.refundable && !order.reversible && (
                          <p className="text-xs text-gray-500">
                            No refund or void actions available for this charge.
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
