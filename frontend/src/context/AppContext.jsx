import React, { createContext, useContext, useState } from "react";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [activeMode, setActiveMode] = useState("online"); // 'online' | 'offline'
  const [selectedProducts, setSelectedProducts] = useState([]);

  const toggleProductSelection = (product) => {
    setSelectedProducts((prev) => {
      const exists = prev.some((p) => p.id === product.id);
      if (exists) {
        return prev.filter((p) => p.id !== product.id);
      }
      // Add product
      return [...prev, product];
    });
  };

  const removeProductFromCompare = (productId) => {
    setSelectedProducts((prev) => prev.filter((p) => p.id !== productId));
  };

  const clearSelectedProducts = () => {
    setSelectedProducts([]);
  };

  const isProductSelected = (productId) => {
    return selectedProducts.some((p) => p.id === productId);
  };

  return (
    <AppContext.Provider
      value={{
        activeMode,
        setActiveMode,
        selectedProducts,
        setSelectedProducts,
        toggleProductSelection,
        removeProductFromCompare,
        clearSelectedProducts,
        isProductSelected,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    return {
      activeMode: "online",
      setActiveMode: () => {},
      selectedProducts: [],
      setSelectedProducts: () => {},
      toggleProductSelection: () => {},
      removeProductFromCompare: () => {},
      clearSelectedProducts: () => {},
      isProductSelected: () => false,
    };
  }
  return context;
}
