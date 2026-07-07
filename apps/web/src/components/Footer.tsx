export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-sm">
          <div>
            <h4 className="text-white font-semibold mb-3">ThaiMark</h4>
            <p className="text-xs leading-relaxed">
              Your favorite Thai snacks delivered with flash-sale deals every day.
            </p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-3">Shop</h4>
            <ul className="space-y-1.5 text-xs">
              <li>Candy & Sweets</li>
              <li>Snacks</li>
              <li>Condiments</li>
              <li>Flash Sale</li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-3">Support</h4>
            <ul className="space-y-1.5 text-xs">
              <li>Help Center</li>
              <li>Shipping Info</li>
              <li>Returns</li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-3">Contact</h4>
            <ul className="space-y-1.5 text-xs">
              <li>support@thaimark.co.th</li>
              <li>+66 2 123 4567</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-6 pt-4 text-xs text-center">
          © {new Date().getFullYear()} ThaiMark. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
