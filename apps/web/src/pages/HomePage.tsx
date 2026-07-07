import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { PaginatedProducts } from "@thaimark/shared-types";
import { apiFetch } from "../lib/api";
import { CountdownTimer } from "../components/CountdownTimer";
import { ProductCard } from "../components/ProductCard";

const CATEGORIES = [
  { label: "All", slug: "" },
  { label: "Candy & Sweets", slug: "candy-sweets" },
  { label: "Snacks", slug: "snacks" },
  { label: "Condiments", slug: "condiments" },
];

export function HomePage() {
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get("q")?.trim() ?? "";
  const [products, setProducts] = useState<PaginatedProducts | null>(null);
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ limit: "12" });
    if (category) params.set("category", category);
    if (searchQuery) params.set("q", searchQuery);

    apiFetch<PaginatedProducts>(`/api/products?${params}`)
      .then(setProducts)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [category, searchQuery]);

  return (
    <div>
      {/* Flash Sale Banner */}
      <section className="flash-gradient text-white">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-flash-orange text-white text-xs font-bold px-2 py-0.5 rounded animate-pulse">
                  FLASH SALE
                </span>
                <span className="text-yellow-300 text-sm font-medium">
                  Up to 26% OFF
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold">
                Thai Snacks Mega Deal
              </h1>
              <p className="text-white/80 text-sm mt-1">
                Authentic flavors from Thailand — limited time only!
              </p>
            </div>
            <div className="flex flex-col items-start sm:items-end">
              <span className="text-xs uppercase tracking-wider mb-1 opacity-80">
                Ends in
              </span>
              <CountdownTimer />
            </div>
          </div>
        </div>
      </section>

      {/* Category Chips */}
      <section className="bg-white border-b sticky top-[52px] sm:top-[60px] z-30">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.slug}
                onClick={() => setCategory(cat.slug)}
                className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  category === cat.slug
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Product Grid */}
      <section className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-800">
            {searchQuery
              ? `Results for "${searchQuery}"`
              : category
                ? CATEGORIES.find((c) => c.slug === category)?.label
                : "All Products"}
          </h2>
          {products && (
            <span className="text-sm text-gray-500">{products.total} items</span>
          )}
        </div>

        {loading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-white rounded-lg animate-pulse">
                <div className="aspect-square bg-gray-200 rounded-t-lg" />
                <div className="p-3 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-full" />
                  <div className="h-4 bg-gray-200 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="text-center py-12 text-red-500">
            <p>{error}</p>
            <p className="text-sm text-gray-500 mt-2">
              Make sure the API server is running on port 3001
            </p>
          </div>
        )}

        {products && !loading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
            {products.data.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {products?.data.length === 0 && !loading && (
          <p className="text-center py-12 text-gray-500">
            {searchQuery
              ? `No products found for "${searchQuery}".`
              : "No products found."}
          </p>
        )}
      </section>
    </div>
  );
}
