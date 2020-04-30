import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Product): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const productsSaved = await AsyncStorage.getItem(
        'GoMarketplace::products',
      );

      if (productsSaved) {
        setProducts(JSON.parse(productsSaved));
      }
    }

    loadProducts();
  }, []);

  const addToCart = useCallback(
    async product => {
      await setProducts(prevState => {
        const [productExists] = prevState.filter(
          prevProduct => prevProduct.id === product.id,
        );

        if (!productExists) {
          return [...prevState, { ...product, quantity: 1 }];
        }

        return prevState.map(prevProduct => {
          if (prevProduct.id === productExists.id) {
            return {
              ...prevProduct,
              quantity: prevProduct.quantity + 1,
            };
          }

          return prevProduct;
        });
      });

      await AsyncStorage.setItem(
        'GoMarketplace::products',
        JSON.stringify(products),
      );
    },
    [products],
  );

  const increment = useCallback(
    async id => {
      setProducts(prevState => {
        return prevState.map(prevProduct => {
          if (prevProduct.id === id) {
            return {
              ...prevProduct,
              quantity: prevProduct.quantity + 1,
            };
          }

          return prevProduct;
        });
      });

      await AsyncStorage.setItem(
        'GoMarketplace::products',
        JSON.stringify(products),
      );
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      setProducts(prevState => {
        const items = prevState.map(prevProduct => {
          if (prevProduct.id === id) {
            return {
              ...prevProduct,
              quantity: prevProduct.quantity - 1,
            };
          }

          return prevProduct;
        });

        return items.filter(item => item.quantity > 0);
      });

      await AsyncStorage.setItem(
        'GoMarketplace::products',
        JSON.stringify(products),
      );
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
