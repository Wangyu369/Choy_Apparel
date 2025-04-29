
import React, { useState, useEffect } from 'react';
import { Minus, Plus, Trash } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import AuthModal from './AuthModal';

const Cart: React.FC = () => {
  const { items, removeItem, updateQuantity, totalPrice } = useCart();
  const { isAuthenticated, refreshToken } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authView, setAuthView] = useState<'signin' | 'signup'>('signin');
  const [authCheckInProgress, setAuthCheckInProgress] = useState(false);
  const navigate = useNavigate();
  
  const handleCheckout = async () => {
    console.log('Checkout button clicked, auth status:', isAuthenticated);
    setAuthCheckInProgress(true);
    
    // Try to refresh the token first if user has one
    if (!isAuthenticated) {
      try {
        console.log('Attempting to refresh authentication before checkout');
        const refreshed = await refreshToken();
        if (refreshed) {
          console.log('Authentication refreshed successfully, proceeding to checkout');
          setAuthCheckInProgress(false);
          navigate('/checkout');
          return;
        }
      } catch (error) {
        console.error('Failed to refresh authentication:', error);
      }
      
      console.log('User not authenticated, showing auth modal');
      setAuthView('signin');
      setShowAuthModal(true);
      setAuthCheckInProgress(false);
      return;
    }
    
    // Proceed to checkout - use navigate instead of direct URL change
    console.log('User authenticated, navigating to checkout page');
    setAuthCheckInProgress(false);
    navigate('/checkout');
  };
  
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-4 rounded-full bg-accent p-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6"
          >
            <circle cx="8" cy="21" r="1" />
            <circle cx="19" cy="21" r="1" />
            <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold">Your cart is empty</h2>
        <p className="mt-1 text-muted-foreground">Add some products to your cart and they'll appear here.</p>
        <Button className="mt-6" onClick={() => navigate('/')}>
          Continue Shopping
        </Button>
      </div>
    );
  }
  
  return (
    <div className="divide-y">
      <div className="space-y-4 py-6">
        {items.map(item => (
          <div key={item.product.id} className="flex items-center py-4">
            <div className="relative h-16 w-16 rounded-md overflow-hidden">
              <img
                src={item.product.image}
                alt={item.product.name}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>


            <p className="text-sm text-muted-foreground">
  ₱{Number(item.product.price).toFixed(2)}
</p>


            
            
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                disabled={item.quantity <= 1}
              >
                <Minus className="h-3 w-3" />
                <span className="sr-only">Decrease quantity</span>
              </Button>
              
              <span className="w-8 text-center">{item.quantity}</span>
              
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
              >
                <Plus className="h-3 w-3" />
                <span className="sr-only">Increase quantity</span>
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => removeItem(item.product.id)}
              >
                <Trash className="h-4 w-4" />
                <span className="sr-only">Remove</span>
              </Button>
            </div>
          </div>
        ))}
      </div>
      
      <div className="py-6">
        <div className="flex justify-between mb-4">
          <span>Subtotal</span>
          <span>₱{totalPrice.toFixed(2)}</span>
        </div>
        <div className="flex justify-between mb-4">
          <span>Shipping</span>
          <span>Free</span>
        </div>
        <div className="flex justify-between font-semibold">
          <span>Total</span>
          <span>₱{totalPrice.toFixed(2)}</span>
        </div>
        
        <Button
          className="mt-6 w-full"
          onClick={handleCheckout}
          disabled={authCheckInProgress}
        >
          {authCheckInProgress
            ? "Checking authentication..."
            : isAuthenticated 
              ? "Proceed to Checkout" 
              : "Sign in to Checkout"}
        </Button>
      </div>
      
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => {
          setShowAuthModal(false);
          // If user is authenticated after modal closes, proceed to checkout
          if (isAuthenticated) {
            console.log('Auth modal closed, user is now authenticated');
            navigate('/checkout');
          }
        }} 
        initialView={authView}
        onSwitchView={(view) => setAuthView(view)}
      />
    </div>
  );
};

export default Cart;