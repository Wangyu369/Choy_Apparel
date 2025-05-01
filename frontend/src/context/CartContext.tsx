import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { Product } from '../utils/products';
import { useAuth } from './AuthContext';
import { ordersService } from '../services/api';

type CartItem = {
  product: Product;
  quantity: number;
};

type CartContextType = {
  items: CartItem[];
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  setItems: React.Dispatch<React.SetStateAction<CartItem[]>>;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const { user, isAuthenticated, logout } = useAuth();
  const syncingRef = useRef(false);
  const initialLoadRef = useRef(true);
  const lastSyncedItemsRef = useRef<CartItem[]>([]);

  const mergeCarts = (cartA: CartItem[], cartB: CartItem[]): CartItem[] => {
    const mergedMap = new Map<string, CartItem>();
    cartA.forEach(item => mergedMap.set(item.product.id, { ...item }));
    cartB.forEach(item => {
      if (mergedMap.has(item.product.id)) {
        mergedMap.get(item.product.id)!.quantity += item.quantity;
      } else {
        mergedMap.set(item.product.id, { ...item });
      }
    });
    return Array.from(mergedMap.values());
  };

  useEffect(() => {
    const loadCart = async () => {
      const storedCart = localStorage.getItem('cart');
      let localCart: CartItem[] = [];
      if (storedCart) {
        try {
          localCart = JSON.parse(storedCart);
        } catch (error) {
          console.error('Failed to parse stored cart:', error);
          localStorage.removeItem('cart');
        }
      }

      if (isAuthenticated && user) {
        try {
          // Directly fetch backend cart without merging to avoid doubling
          const backendCart = await ordersService.getUserCart();
          console.log('Backend cart fetched on login:', backendCart);
          const mappedBackendCart = backendCart.map((item: any) => ({
            product: item.product_details,
            quantity: item.quantity,
          }));
          setItems(mappedBackendCart);
          lastSyncedItemsRef.current = mappedBackendCart; // Set last synced items on login
          // Clear localStorage cart after fetching backend cart
          localStorage.removeItem('cart');
          initialLoadRef.current = false; // Mark initial load done
        } catch (error) {
          console.error('Failed to load user cart:', error);
          setItems(localCart);
          lastSyncedItemsRef.current = localCart;
          initialLoadRef.current = false;
        }
      } else {
        setItems(localCart);
        lastSyncedItemsRef.current = localCart;
        initialLoadRef.current = false;
      }
    };
    loadCart();
  }, [isAuthenticated, user]);

  // Add logout handler to clear cart on logout
  useEffect(() => {
    if (!isAuthenticated) {
      setItems([]);
      localStorage.removeItem('cart');
      initialLoadRef.current = true;
      lastSyncedItemsRef.current = [];
    }
  }, [isAuthenticated]);

  // Save cart to localStorage on items change
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items));
  }, [items]);

  // Sync cart to backend with debounce and error handling
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    if (initialLoadRef.current) {
      // Skip syncing on initial load to avoid quantity increments
      return;
    }

    if (syncingRef.current) return;
    syncingRef.current = true;

    const syncCartToBackend = async () => {
      try {
        const lastSyncedItems = lastSyncedItemsRef.current;
        const currentItems = items;

        // Helper to create a map from productId to CartItem
        const mapByProductId = (arr: CartItem[]) => {
          const map = new Map<string, CartItem>();
          arr.forEach(item => map.set(item.product.id, item));
          return map;
        };

        const lastMap = mapByProductId(lastSyncedItems);
        const currentMap = mapByProductId(currentItems);

        // Detect removed items (in last but not in current)
        for (const [productId, lastItem] of lastMap.entries()) {
          if (!currentMap.has(productId)) {
            await ordersService.removeItemFromCart(productId);
          }
        }

        // Detect added or updated items
        for (const [productId, currentItem] of currentMap.entries()) {
          const lastItem = lastMap.get(productId);
          if (!lastItem) {
            // Added item
            await ordersService.addItemToCart(productId, currentItem.quantity);
          } else if (lastItem.quantity !== currentItem.quantity) {
            // Updated quantity
            await ordersService.updateItemQuantity(productId, currentItem.quantity);
          }
        }

        // Update last synced items
        lastSyncedItemsRef.current = currentItems;
      } catch (error: any) {
        console.error('Failed to sync cart to backend:', error);
        if (error.message.includes('Unauthorized')) {
          // Force logout on unauthorized error
          logout();
          toast.error('Session expired. Please log in again.');
        }
      } finally {
        syncingRef.current = false;
      }
    };

    // Debounce sync by 500ms
    const debounceTimeout = setTimeout(syncCartToBackend, 500);

    return () => clearTimeout(debounceTimeout);
  }, [items, isAuthenticated, user, logout]);

  const addItem = (product: Product, quantity = 1) => {
    setItems(currentItems => {
      const existingItem = currentItems.find(item => item.product.id === product.id);
      if (existingItem) {
        const updatedItems = currentItems.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
        toast.success(`Updated ${product.name} quantity in cart`);
        return updatedItems;
      } else {
        toast.success(`Added ${product.name} to cart`);
        return [...currentItems, { product, quantity }];
      }
    });
  };

  const removeItem = (productId: string) => {
    setItems(currentItems => {
      const item = currentItems.find(item => item.product.id === productId);
      if (item) {
        toast.success(`Removed ${item.product.name} from cart`);
      }
      return currentItems.filter(item => item.product.id !== productId);
    });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    setItems(currentItems =>
      currentItems.map(item =>
        item.product.id === productId
          ? { ...item, quantity }
          : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
    toast.success('Cart cleared');
  };

  const totalItems = items.reduce((total, item) => total + item.quantity, 0);

  const totalPrice = items.reduce(
    (total, item) => total + item.product.price * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
        setItems,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
