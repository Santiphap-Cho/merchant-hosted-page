import { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { CartDrawer } from "./components/CartDrawer";
import { HomePage } from "./pages/HomePage";
import { ProductDetailPage } from "./pages/ProductDetailPage";
import { CartPage } from "./pages/CartPage";
import { CheckoutPage } from "./pages/CheckoutPage";
import { OrderConfirmationPage } from "./pages/OrderConfirmationPage";
import { OrderHistoryPage } from "./pages/OrderHistoryPage";
import { useCartStore } from "./store/cartStore";

export default function App() {
  const fetchCart = useCartStore((s) => s.fetchCart);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <CartDrawer />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/products/:id" element={<ProductDetailPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/orders" element={<OrderHistoryPage />} />
          <Route path="/orders/:id" element={<OrderConfirmationPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
