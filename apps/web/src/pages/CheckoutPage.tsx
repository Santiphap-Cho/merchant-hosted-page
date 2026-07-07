import { useState } from "react";
import { Link } from "react-router-dom";
import type { CreateOrderResponse } from "@thaimark/shared-types";
import { formatPrice } from "@thaimark/ui";
import { apiFetch } from "../lib/api";
import { MOCK_SHIPPING } from "../lib/mockShipping";
import { useCartStore } from "../store/cartStore";

export function CheckoutPage() {
  const sessionId = useCartStore((s) => s.sessionId);
  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.subtotal());
  const clearLocal = useCartStore((s) => s.clearLocal);
  const fetchCart = useCartStore((s) => s.fetchCart);

  const [form, setForm] = useState({
    customerName: "",
    address: "",
    phone: "",
  });
  const [captureImmediately, setCaptureImmediately] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const order = await apiFetch<CreateOrderResponse>("/api/orders", {
        method: "POST",
        body: JSON.stringify({
          sessionId,
          ...form,
          capture: captureImmediately,
        }),
      });
      clearLocal();
      window.location.href = order.checkoutUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed");
      fetchCart();
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <p className="text-gray-500 mb-4">No items to checkout</p>
        <Link to="/" className="text-primary hover:underline">
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 sm:py-8">
      <h1 className="text-2xl font-bold mb-6">Checkout</h1>

      <div className="grid sm:grid-cols-5 gap-6">
        <form onSubmit={handleSubmit} className="sm:col-span-3 space-y-4">
          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-800">Shipping Details</h2>
              <button
                type="button"
                onClick={() => setForm(MOCK_SHIPPING)}
                className="text-xs text-primary font-medium hover:underline"
              >
                Use sample address
              </button>
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                id="name"
                required
                value={form.customerName}
                onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Somchai Jaidee"
              />
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <textarea
                id="address"
                required
                rows={3}
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                placeholder="123 Sukhumvit Rd, Bangkok 10110"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <input
                id="phone"
                required
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="0812345678"
              />
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm">
            <h2 className="font-semibold text-gray-800 mb-3">Payment Mode (testing)</h2>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-gray-800">
                  {captureImmediately ? "Capture immediately" : "Authorize only (auth hold)"}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {captureImmediately
                    ? "Funds are captured at payment — use Refund in order history."
                    : "Funds are held only — use Void (reverse) or Capture in order history."}
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={captureImmediately}
                onClick={() => setCaptureImmediately((v) => !v)}
                className={`relative inline-flex h-7 w-12 flex-shrink-0 rounded-full transition-colors ${
                  captureImmediately ? "bg-primary" : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform mt-1 ${
                    captureImmediately ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>

          {error && (
            <p className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50"
          >
            {submitting ? "Redirecting to payment..." : `Place Order — ${formatPrice(subtotal)}`}
          </button>
        </form>

        <div className="sm:col-span-2">
          <div className="bg-white rounded-xl p-4 shadow-sm sticky top-24">
            <h2 className="font-semibold mb-3">Order Summary</h2>
            <ul className="space-y-2 text-sm">
              {items.map((item) => (
                <li key={item.id} className="flex justify-between">
                  <span className="line-clamp-1 flex-1 mr-2">
                    {item.product?.name} × {item.quantity}
                  </span>
                  <span className="font-medium">
                    {formatPrice((item.product?.price ?? 0) * item.quantity)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="border-t mt-3 pt-3 flex justify-between font-bold">
              <span>Total</span>
              <span className="text-primary">{formatPrice(subtotal)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
