import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useCartStore } from "../store/cartStore";

export function Header() {
  const itemCount = useCartStore((s) => s.itemCount());
  const toggleCart = useCartStore((s) => s.toggleCart);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");

  useEffect(() => {
    setQuery(searchParams.get("q") ?? "");
  }, [searchParams]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    const params = new URLSearchParams();
    if (trimmed) params.set("q", trimmed);
    navigate(params.toString() ? `/?${params}` : "/");
  };

  return (
    <header className="sticky top-0 z-40 bg-primary shadow-md">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3">
        <div className="flex items-center gap-3 sm:gap-4">
          <Link to="/" className="flex-shrink-0">
            <span className="text-white text-xl sm:text-2xl font-extrabold tracking-tight">
              Thai<span className="text-yellow-300">Mark</span>
            </span>
          </Link>

          <form onSubmit={handleSearch} className="flex-1 max-w-xl">
            <div className="relative">
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search Thai snacks..."
                className="w-full rounded-full py-2 pl-4 pr-10 text-sm bg-white/95 focus:outline-none focus:ring-2 focus:ring-yellow-300"
              />
              <button
                type="submit"
                className="absolute right-1 top-1/2 -translate-y-1/2 bg-primary text-white rounded-full p-1.5 hover:bg-primary-dark"
                aria-label="Search"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
          </form>

          <Link
            to="/orders"
            className="flex-shrink-0 text-white hover:text-yellow-300 transition-colors p-1"
            aria-label="Order history"
            title="Order history"
          >
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </Link>

          <button
            onClick={toggleCart}
            className="relative flex-shrink-0 text-white hover:text-yellow-300 transition-colors p-1"
            aria-label="Open cart"
          >
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
            </svg>
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-flash-red text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {itemCount > 99 ? "99+" : itemCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
