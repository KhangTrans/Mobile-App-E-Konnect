import type { Product } from "@/services/productService";
import { TokenManager } from "@/utils/tokenManager";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AppState, type AppStateStatus } from "react-native";

// Phai khop voi USER_DATA_KEY trong utils/tokenManager.ts
const USER_DATA_KEY = "userData";
const CART_KEY_PREFIX = "cart_";

export interface CartItem {
  product: Product;
  quantity: number;
}

interface CartContextType {
  cartItems: CartItem[];
  cartCount: number;
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => Promise<void>;
  getCartTotal: () => number;
  reloadCart: () => Promise<void>;
  isCartLoading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);
// Doc userId qua TokenManager de dong bo source of truth
const getCartKey = async (): Promise<string> => {
  try {
    const userData = await TokenManager.getUserData();
    if (!userData?.id) {
      console.warn(
        `[CartContext] ${USER_DATA_KEY} not found in storage, using guest key`,
      );
      return `${CART_KEY_PREFIX}guest`;
    }

    const key = `${CART_KEY_PREFIX}${userData.id}`;
    console.log("[CartContext] Cart key resolved:", key);
    return key;
  } catch {
    console.error("[CartContext] Error reading userData, using guest key");
    return `${CART_KEY_PREFIX}guest`;
  }
};

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartLoading, setIsCartLoading] = useState(true);

  // Dung ref de tranh stale closure trong useEffect
  const reloadCartRef = useRef<(() => Promise<void>) | null>(null);

  const reloadCart = async () => {
    setIsCartLoading(true);
    try {
      const key = await getCartKey();
      const stored = await AsyncStorage.getItem(key);
      setCartItems(stored ? (JSON.parse(stored) as CartItem[]) : []);
    } catch (error) {
      console.error("Failed to load cart:", error);
      setCartItems([]);
    } finally {
      setIsCartLoading(false);
    }
  };

  // Giu ref luon tro toi phien ban moi nhat cua reloadCart
  reloadCartRef.current = reloadCart;

  useEffect(() => {
    reloadCartRef.current?.();
  }, []);

  // Reload cart khi app chuyen tu background ve foreground
  useEffect(() => {
    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === "active") {
        reloadCartRef.current?.();
      }
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange,
    );

    return () => {
      subscription.remove();
    };
  }, []);

  // Helper ghi xuong AsyncStorage - luon goi getCartKey() fresh
  const saveToStorage = async (items: CartItem[]) => {
    try {
      const key = await getCartKey();
      await AsyncStorage.setItem(key, JSON.stringify(items));
    } catch (error) {
      console.error("Failed to save cart:", error);
    }
  };

  const addToCart = (product: Product, quantity: number = 1) => {
    if (product.stock <= 0) return;

    const safeQty = Math.max(1, quantity);

    setCartItems((prev) => {
      const existing = prev.find((item) => item.product._id === product._id);
      let updated: CartItem[];

      if (existing) {
        updated = prev.map((item) =>
          item.product._id === product._id
            ? {
                ...item,
                quantity: Math.min(item.quantity + safeQty, product.stock),
              }
            : item,
        );
      } else {
        updated = [
          ...prev,
          { product, quantity: Math.min(safeQty, product.stock) },
        ];
      }

      saveToStorage(updated);
      return updated;
    });
  };

  const removeFromCart = (productId: string) => {
    setCartItems((prev) => {
      const updated = prev.filter((item) => item.product._id !== productId);
      saveToStorage(updated);
      return updated;
    });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    setCartItems((prev) => {
      const updated = prev.map((item) => {
        if (item.product._id !== productId) return item;
        const clamped = Math.max(1, Math.min(quantity, item.product.stock));
        return { ...item, quantity: clamped };
      });

      saveToStorage(updated);
      return updated;
    });
  };

  const clearCart = async () => {
    try {
      const key = await getCartKey();
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error("Failed to clear cart:", error);
    } finally {
      setCartItems([]);
    }
  };

  const cartCount = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity, 0),
    [cartItems],
  );

  const getCartTotal = () => {
    return cartItems.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0,
    );
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        cartCount,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartTotal,
        reloadCart,
        isCartLoading,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
