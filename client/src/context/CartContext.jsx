import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';

const CartContext = createContext(null);
const STORAGE_KEY = 'bnan_cart';

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const keyOf = (productId, variant) => `${productId}::${variant || ''}`;

  const add = useCallback((product, quantity = 1, variant = '') => {
    setItems((prev) => {
      const key = keyOf(product.id, variant);
      const existing = prev.find((it) => it.key === key);
      if (existing) {
        return prev.map((it) =>
          it.key === key ? { ...it, quantity: it.quantity + quantity } : it
        );
      }
      return [
        ...prev,
        {
          key,
          product_id: product.id,
          name: product.name,
          image: product.image,
          price: product.has_discount ? product.discount_price : product.price,
          original_price: product.price,
          has_discount: product.has_discount,
          stock: product.stock,
          variant,
          quantity,
        },
      ];
    });
  }, []);

  const remove = useCallback((key) => {
    setItems((prev) => prev.filter((it) => it.key !== key));
  }, []);

  const updateQuantity = useCallback((key, quantity) => {
    const q = Math.max(1, Number(quantity) || 1);
    setItems((prev) => prev.map((it) => (it.key === key ? { ...it, quantity: q } : it)));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, it) => sum + it.price * it.quantity, 0);
    const count = items.reduce((sum, it) => sum + it.quantity, 0);
    return { subtotal, count };
  }, [items]);

  const value = { items, add, remove, updateQuantity, clear, ...totals };
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
