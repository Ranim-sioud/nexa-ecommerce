import React, { createContext, useContext, useReducer, ReactNode } from 'react';

export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  description: string;
  rating: number;
  reviews: number;
  inStock: boolean;
  code?: string;
  supplier?: string;
  stock?: number;
  isInStock?: boolean;
  discount?: number;
  margin?: number;
}

export interface CartItem {
  id: string;
  quantity: number;
  product: Product;
}

interface ProductState {
  products: Product[];
  cart: CartItem[];
  selectedCategory: string;
  searchQuery: string;
}

interface ProductContextType {
  state: ProductState;
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  setCategory: (category: string) => void;
  setSearchQuery: (query: string) => void;
  getCartTotal: () => number;
  getCartItemCount: () => number;
}

type ProductAction =
  | { type: 'ADD_TO_CART'; product: Product }
  | { type: 'REMOVE_FROM_CART'; productId: string }
  | { type: 'UPDATE_QUANTITY'; productId: string; quantity: number }
  | { type: 'SET_CATEGORY'; category: string }
  | { type: 'SET_SEARCH_QUERY'; query: string };

const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Wireless Bluetooth Headphones',
    price: 99.99,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
    category: 'Electronics',
    description: 'Premium wireless headphones with noise cancellation and superior sound quality.',
    rating: 4.5,
    reviews: 128,
    inStock: true,
  },
  {
    id: '2',
    name: 'Smart Watch',
    price: 299.99,
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400',
    category: 'Electronics',
    description: 'Advanced fitness tracking, heart rate monitoring, and smart notifications.',
    rating: 4.3,
    reviews: 89,
    inStock: true,
  },
  {
    id: '3',
    name: 'Organic Cotton T-Shirt',
    price: 29.99,
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400',
    category: 'Clothing',
    description: 'Comfortable, sustainable, and stylish organic cotton t-shirt.',
    rating: 4.7,
    reviews: 203,
    inStock: true,
  },
  {
    id: '4',
    name: 'Running Sneakers',
    price: 129.99,
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400',
    category: 'Shoes',
    description: 'Professional running shoes with advanced cushioning technology.',
    rating: 4.4,
    reviews: 156,
    inStock: true,
  },
  {
    id: '5',
    name: 'Laptop Backpack',
    price: 79.99,
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400',
    category: 'Accessories',
    description: 'Durable laptop backpack with multiple compartments and water resistance.',
    rating: 4.6,
    reviews: 94,
    inStock: true,
  },
  {
    id: '6',
    name: 'Coffee Mug Set',
    price: 39.99,
    image: 'https://images.unsplash.com/photo-1514228742587-6b1558fcf93a?w=400',
    category: 'Home',
    description: 'Set of 4 ceramic coffee mugs with beautiful designs.',
    rating: 4.8,
    reviews: 267,
    inStock: true,
  },
];

const initialState: ProductState = {
  products: mockProducts,
  cart: [],
  selectedCategory: 'All',
  searchQuery: '',
};

function productReducer(state: ProductState, action: ProductAction): ProductState {
  switch (action.type) {
    case 'ADD_TO_CART': {
      const existingItem = state.cart.find(item => item.id === action.product.id);
      if (existingItem) {
        return {
          ...state,
          cart: state.cart.map(item =>
            item.id === action.product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          ),
        };
      }
      return {
        ...state,
        cart: [...state.cart, { id: action.product.id, quantity: 1, product: action.product }],
      };
    }
    case 'REMOVE_FROM_CART':
      return {
        ...state,
        cart: state.cart.filter(item => item.id !== action.productId),
      };
    case 'UPDATE_QUANTITY':
      if (action.quantity === 0) {
        return {
          ...state,
          cart: state.cart.filter(item => item.id !== action.productId),
        };
      }
      return {
        ...state,
        cart: state.cart.map(item =>
          item.id === action.productId
            ? { ...item, quantity: action.quantity }
            : item
        ),
      };
    case 'SET_CATEGORY':
      return { ...state, selectedCategory: action.category };
    case 'SET_SEARCH_QUERY':
      return { ...state, searchQuery: action.query };
    default:
      return state;
  }
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export function ProductProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(productReducer, initialState);

  const addToCart = (product: Product) => {
    dispatch({ type: 'ADD_TO_CART', product });
  };

  const removeFromCart = (productId: string) => {
    dispatch({ type: 'REMOVE_FROM_CART', productId });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', productId, quantity });
  };

  const setCategory = (category: string) => {
    dispatch({ type: 'SET_CATEGORY', category });
  };

  const setSearchQuery = (query: string) => {
    dispatch({ type: 'SET_SEARCH_QUERY', query });
  };

  const getCartTotal = () => {
    return state.cart.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  };

  const getCartItemCount = () => {
    return state.cart.reduce((count, item) => count + item.quantity, 0);
  };

  return (
    <ProductContext.Provider value={{
      state,
      addToCart,
      removeFromCart,
      updateQuantity,
      setCategory,
      setSearchQuery,
      getCartTotal,
      getCartItemCount,
    }}>
      {children}
    </ProductContext.Provider>
  );
}

export function useProducts() {
  const context = useContext(ProductContext);
  if (context === undefined) {
    throw new Error('useProducts must be used within a ProductProvider');
  }
  return context;
}