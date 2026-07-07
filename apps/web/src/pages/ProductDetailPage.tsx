import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { Product } from "@thaimark/shared-types";
import { formatPrice } from "@thaimark/ui";
import { ProductImage } from "../components/ProductImage";
import { apiFetch } from "../lib/api";
import { useCartStore } from "../store/cartStore";

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const addToCart = useCartStore((s) => s.addToCart);
  const isLoading = useCartStore((s) => s.isLoading);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    apiFetch<Product>(`/api/products/${id}`)
      .then(setProduct)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 animate-pulse">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="aspect-square bg-gray-200 rounded-lg" />
          <div className="space-y-4">
            <div className="h-8 bg-gray-200 rounded w-3/4" />
            <div className="h-6 bg-gray-200 rounded w-1/2" />
            <div className="h-20 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center">
        <p className="text-red-500">{error || "Product not found"}</p>
        <Link to="/" className="text-primary mt-4 inline-block hover:underline">
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 sm:py-8">
      <nav className="text-sm text-gray-500 mb-4">
        <Link to="/" className="hover:text-primary">Home</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-800">{product.name}</span>
      </nav>

      <div className="grid md:grid-cols-2 gap-6 sm:gap-8 bg-white rounded-xl shadow-sm p-4 sm:p-6">
        <div className="relative">
          <ProductImage
            src={product.imageUrl}
            alt={product.name}
            className="w-full aspect-square object-cover rounded-lg"
          />
          <span className="absolute top-3 left-3 bg-flash-red text-white font-bold px-2 py-1 rounded">
            -{product.discountPercent}%
          </span>
        </div>

        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            {product.name}
          </h1>

          <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
            <span className="text-amber-500 font-medium">
              ★ {product.rating.toFixed(1)}
            </span>
            <span>|</span>
            <span>{product.soldCount} sold</span>
            {product.category && (
              <>
                <span>|</span>
                <span>{product.category.name}</span>
              </>
            )}
          </div>

          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-3xl font-bold text-primary">
              {formatPrice(product.price)}
            </span>
            <span className="text-lg text-gray-400 line-through">
              {formatPrice(product.originalPrice)}
            </span>
          </div>

          <p className="mt-4 text-gray-600 leading-relaxed">
            {product.description}
          </p>

          <div className="mt-6 flex items-center gap-4">
            <div className="flex items-center border rounded">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="px-3 py-2 hover:bg-gray-50"
              >
                −
              </button>
              <span className="px-4 py-2 font-medium">{qty}</span>
              <button
                onClick={() => setQty((q) => q + 1)}
                className="px-3 py-2 hover:bg-gray-50"
              >
                +
              </button>
            </div>

            <button
              onClick={() => addToCart(product, qty)}
              disabled={isLoading}
              className="flex-1 bg-primary hover:bg-primary-dark text-white font-semibold py-2.5 px-6 rounded transition-colors disabled:opacity-50"
            >
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
