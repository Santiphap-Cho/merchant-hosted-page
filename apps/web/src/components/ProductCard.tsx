import { Link } from "react-router-dom";
import type { Product } from "@thaimark/shared-types";
import { formatPrice } from "@thaimark/ui";
import { ProductImage } from "./ProductImage";
import { useCartStore } from "../store/cartStore";

interface ProductCardProps {
  product: Product;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5 text-amber-400">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          className={`w-3 h-3 ${i < Math.round(rating) ? "fill-current" : "fill-gray-200"}`}
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      <span className="text-xs text-gray-500 ml-1">{rating.toFixed(1)}</span>
    </div>
  );
}

export function ProductCard({ product }: ProductCardProps) {
  const addToCart = useCartStore((s) => s.addToCart);
  const isLoading = useCartStore((s) => s.isLoading);

  return (
    <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden group">
      <Link to={`/products/${product.id}`} className="block relative">
        <div className="aspect-square overflow-hidden bg-gray-100">
          <ProductImage
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
        <span className="absolute top-2 left-2 bg-flash-red text-white text-xs font-bold px-1.5 py-0.5 rounded">
          -{product.discountPercent}%
        </span>
      </Link>

      <div className="p-2.5 sm:p-3">
        <Link to={`/products/${product.id}`}>
          <h3 className="text-sm text-gray-800 line-clamp-2 min-h-[2.5rem] hover:text-primary">
            {product.name}
          </h3>
        </Link>

        <div className="mt-1.5 flex items-baseline gap-1.5">
          <span className="text-primary font-bold text-base sm:text-lg">
            {formatPrice(product.price)}
          </span>
          <span className="text-gray-400 text-xs line-through">
            {formatPrice(product.originalPrice)}
          </span>
        </div>

        <div className="mt-1.5 flex items-center justify-between">
          <StarRating rating={product.rating} />
          <span className="text-xs text-gray-400">{product.soldCount} sold</span>
        </div>

        <button
          onClick={() => addToCart(product)}
          disabled={isLoading}
          className="mt-2.5 w-full bg-primary hover:bg-primary-dark text-white text-sm font-semibold py-2 rounded transition-colors disabled:opacity-50"
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
}
