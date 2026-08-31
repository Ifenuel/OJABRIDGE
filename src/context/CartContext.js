'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const CartContext = createContext(null);

const CART_KEY = 'ojabridge_cart';

function getStoredCart() {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(CART_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    return [];
  }
}

function saveCart(items) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  } catch (e) {}
}

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setItems(getStoredCart());
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!loading) saveCart(items);
  }, [items, loading]);

  const addItem = useCallback((product, quantity = 1, variant = null) => {
    setItems(prev => {
      const existingIndex = prev.findIndex(
        item => item.productId === product.id && item.variantId === (variant?.id || null)
      );

      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + quantity,
        };
        return updated;
      }

      return [...prev, {
        productId: product.id,
        name: product.name,
        price: product.price,
        vendor: product.vendor || product.store_name || 'Vendor',
        vendorId: product.vendor_id || null,
        image: product.images?.[0] || null,
        quantity,
        variantId: variant?.id || null,
        variantName: variant?.name || null,
        currency: product.currency || 'NGN',
        stock: product.stock_quantity ?? 99,
      }];
    });
  }, []);

  const removeItem = useCallback((productId, variantId = null) => {
    setItems(prev => prev.filter(
      item => !(item.productId === productId && item.variantId === variantId)
    ));
  }, []);

  const updateQuantity = useCallback((productId, quantity, variantId = null) => {
    if (quantity < 1) {
      removeItem(productId, variantId);
      return;
    }
    setItems(prev => prev.map(item => {
      if (item.productId === productId && item.variantId === variantId) {
        return { ...item, quantity: Math.min(quantity, item.stock || 99) };
      }
      return item;
    }));
  }, [removeItem]);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider value={{
      items,
      loading,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      itemCount,
      subtotal,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
