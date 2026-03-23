import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { cartService } from "@/services/cartService";
import { TokenManager } from "@/utils/tokenManager";

interface CartContextType {
  cartCount: number;
  fetchCartCount: () => Promise<void>;
  incrementCartCount: (qty?: number) => void;
  clearCartCount: () => void;
}

const CartContext = createContext<CartContextType>({
  cartCount: 0,
  fetchCartCount: async () => {},
  incrementCartCount: () => {},
  clearCartCount: () => {},
});

export const useCartContext = () => useContext(CartContext);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cartCount, setCartCount] = useState(0);

  const fetchCartCount = useCallback(async () => {
    try {
      const isLoggedIn = await TokenManager.isLoggedIn();
      if (!isLoggedIn) {
        setCartCount(0);
        return;
      }
      
      const res = await cartService.getCart();
      if (res.success && res.data && res.data.items) {
        const totalQty = res.data.items.reduce((sum, item) => sum + item.quantity, 0);
        setCartCount(totalQty);
      } else {
        setCartCount(0);
      }
    } catch (error) {
      setCartCount(0);
    }
  }, []);

  const incrementCartCount = useCallback((qty: number = 1) => {
    setCartCount(prev => prev + qty);
  }, []);

  const clearCartCount = useCallback(() => {
    setCartCount(0);
  }, []);

  // Fetch count when provider mounts
  useEffect(() => {
    fetchCartCount();
  }, [fetchCartCount]);

  return (
    <CartContext.Provider value={{ cartCount, fetchCartCount, incrementCartCount, clearCartCount }}>
      {children}
    </CartContext.Provider>
  );
};
