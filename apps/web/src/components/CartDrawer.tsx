import { Link } from "react-router-dom";
import { formatPrice } from "@thaimark/ui";
import { ProductImage } from "./ProductImage";
import { useCartStore } from "../store/cartStore";

export function CartDrawer() {
  const isOpen = useCartStore((s) => s.isOpen);
  const closeCart = useCartStore((s) => s.closeCart);
  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.subtotal());

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/40 z-50"
        onClick={closeCart}
        aria-hidden
      />
      <aside className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-50 shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h2 className="text-lg font-bold">Shopping Cart</h2>
          <button
            onClick={closeCart}
            className="p-1 hover:bg-gray-100 rounded"
            aria-label="Close cart"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {items.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
              </svg>
              <p>Your cart is empty</p>
              <button
                onClick={closeCart}
                className="mt-4 text-primary font-semibold hover:underline"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            <ul className="space-y-4">
              {items.map((item) => (
                <li key={item.id} className="flex gap-3">
                  <ProductImage
                    src={item.product?.imageUrl}
                    alt={item.product?.name ?? "Product"}
                    className="w-16 h-16 rounded object-cover bg-gray-100"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium line-clamp-2">
                      {item.product?.name}
                    </p>
                    <p className="text-primary font-bold text-sm mt-0.5">
                      {formatPrice(item.product?.price ?? 0)}
                    </p>
                    <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t p-4 space-y-3">
            <div className="flex justify-between font-semibold">
              <span>Subtotal</span>
              <span className="text-primary">{formatPrice(subtotal)}</span>
            </div>
            <Link
              to="/checkout"
              onClick={closeCart}
              className="block w-full bg-primary hover:bg-primary-dark text-white text-center font-semibold py-3 rounded transition-colors"
            >
              Checkout
            </Link>
            <Link
              to="/cart"
              onClick={closeCart}
              className="block w-full text-center text-primary font-medium py-2 hover:underline"
            >
              View Full Cart
            </Link>
          </div>
        )}
      </aside>
    </>
  );
}
