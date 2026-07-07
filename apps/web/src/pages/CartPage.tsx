import { useEffect } from "react";
import { Link } from "react-router-dom";
import { formatPrice } from "@thaimark/ui";
import { ProductImage } from "../components/ProductImage";
import { useCartStore } from "../store/cartStore";

export function CartPage() {
  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.subtotal());
  const fetchCart = useCartStore((s) => s.fetchCart);
  const isLoading = useCartStore((s) => s.isLoading);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8">
      <h1 className="text-2xl font-bold mb-6">Shopping Cart</h1>

      {isLoading && items.length === 0 ? (
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="bg-white rounded-lg p-4 animate-pulse flex gap-4">
              <div className="w-20 h-20 bg-gray-200 rounded" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-4 bg-gray-200 rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl">
          <p className="text-gray-500 mb-4">Your cart is empty</p>
          <Link
            to="/"
            className="inline-block bg-primary text-white font-semibold px-6 py-2.5 rounded hover:bg-primary-dark"
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <>
          <ul className="space-y-3">
            {items.map((item) => (
              <li
                key={item.id}
                className="bg-white rounded-lg p-4 flex gap-4 shadow-sm"
              >
                <ProductImage
                  src={item.product?.imageUrl}
                  alt={item.product?.name ?? "Product"}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded object-cover"
                />
                <div className="flex-1">
                  <Link
                    to={`/products/${item.productId}`}
                    className="font-medium hover:text-primary line-clamp-2"
                  >
                    {item.product?.name}
                  </Link>
                  <p className="text-primary font-bold mt-1">
                    {formatPrice(item.product?.price ?? 0)}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Quantity: {item.quantity}
                  </p>
                </div>
                <div className="text-right font-semibold">
                  {formatPrice((item.product?.price ?? 0) * item.quantity)}
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-6 bg-white rounded-xl p-4 sm:p-6 shadow-sm">
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span className="text-primary">{formatPrice(subtotal)}</span>
            </div>
            <Link
              to="/checkout"
              className="mt-4 block w-full bg-primary hover:bg-primary-dark text-white text-center font-semibold py-3 rounded transition-colors"
            >
              Proceed to Checkout
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
