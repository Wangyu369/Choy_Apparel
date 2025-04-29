import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useCheckout } from '@/hooks/useCheckout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Address, PaymentMethod } from '@/utils/products.types';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const CheckoutPage = () => {
  const { isAuthenticated, user,refreshToken } = useAuth();
  const { items, totalPrice } = useCart();
  const { processCheckout, isProcessing } = useCheckout();
  const navigate = useNavigate();
  
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [addressIsComplete, setAddressIsComplete] = useState(false);
  const [showAddressPrompt, setShowAddressPrompt] = useState(false);
  
  // Form state
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvc, setCvc] = useState('');


  const [formData, setFormData] = useState<Address>({
    firstName: user?.first_name || user?.name?.split(' ')[0] || '',
    lastName: user?.last_name || user?.name?.split(' ')[1] || '',
    address: '',
    city: '',
    state: '',
    zip: '',
    phone: '',
  });
  
  // Update form data when user changes
  useEffect(() => {
    const { address, city, state, zip, phone } = formData;
    setAddressIsComplete(!!address && !!city && !!state && !!zip && !!phone);
  }, [formData]);
  
  const formatCardNumber = (value: string): string => {
    const digits = value.replace(/\D/g, '');
    let formattedValue = '';
    for (let i = 0; i < digits.length; i++) {
      if (i > 0 && i % 4 === 0) {
        formattedValue += ' ';
      }
      formattedValue += digits[i];
    }
    return formattedValue.substring(0, 19);
  };
  
  const formatExpiryDate = (value: string): string => {
    const digits = value.replace(/\D/g, '');
    if (digits.length > 2) {
      return digits.substring(0, 2) + '/' + digits.substring(2, 4);
    }
    return digits;
  };
  
  useEffect(() => {
    const { address, city, state, zip, phone } = formData;
    setAddressIsComplete(!!address && !!city && !!state && !!zip && !!phone);
  }, [formData]);
  
  useEffect(() => {
    // Check authentication status
    console.log('CheckoutPage - Authentication status:', isAuthenticated);
    console.log('CheckoutPage - Current user:', user);
    console.log('CheckoutPage - Cart items:', items.length);
    
    // Redirect to home if not authenticated
    if (!isAuthenticated) {
      console.log('Not authenticated, redirecting to home');
      toast.error('Please sign in to proceed with checkout');
      navigate('/');
      return;
    }
    
    const checkAuthState = async () => {
      if (!isAuthenticated && items.length > 0) {
        console.log('Not authenticated, attempting to refresh token');
        const refreshed = await refreshToken();
        if (!refreshed) {
          console.log('Token refresh failed, redirecting to home');
          toast.error('Please sign in to proceed with checkout');
          navigate('/');
          return;
        } else {
          console.log('Token refresh successful');
        }
      }
      
      if (items.length === 0) {
        console.log('Cart is empty, redirecting to cart');
        toast.info('Your cart is empty');
        navigate('/cart');
      }
    };
    
    checkAuthState();
  }, [isAuthenticated, items, navigate, user, refreshToken]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
  };
  
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatCardNumber(e.target.value);
    setCardNumber(formattedValue);
  };
  
  const handleExpiryDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatExpiryDate(e.target.value);
    setExpiryDate(formattedValue);
  };
  
  const handleCvcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').substring(0, 4);
    setCvc(value);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Submitting checkout form');

    if (!paymentMethod) {
      console.log('No payment method selected');
      toast.error('Please select a payment method');
      return;
    }
    
    // Check if address is complete
    if (!addressIsComplete) {
      console.log('Address is incomplete');
      setShowAddressPrompt(true);
      return;
    }
    
    // Final authentication check before proceeding
    if (!isAuthenticated || !user) {
      console.log('Authentication check failed before order submission');
      const refreshed = await refreshToken();
      if (!refreshed) {
        toast.error('You must be signed in to complete your order');
        navigate('/');
        return;
      }
    }
    
    try {
      console.log('Processing checkout with data:', {
        address: formData,
        paymentMethod,
        items: items.length
      });
      await processCheckout(formData, paymentMethod);
    } catch (error) {
      
      console.error('Checkout failed:', error);
      if (error instanceof Error && error.message.includes('Unauthorized')) {
        toast.error('Your session has expired. Please sign in again.');
        navigate('/cart');
      }
    }
  };
  
  // If authentication check is still processing, show loading
  if (isAuthenticated === undefined) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  // Don't render the main content if not authenticated or cart is empty
  if (items.length === 0) {
    return null; // Will redirect via useEffect
  }
  
  return (
    <div className="min-h-screen">
      <Helmet>
        <title>Checkout | Choy Apparel</title>
        <meta name="description" content="Complete your purchase" />
      </Helmet>
      
      <main className="container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8">Checkout</h1>
        
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Shipping Information</h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input 
                      id="firstName" 
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required 
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input 
                      id="lastName" 
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required 
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    value={user?.email || ''} 
                    readOnly 
                    className="bg-gray-50"
                  />
                </div>
                
                <div>
                  <Label htmlFor="address">Address</Label>
                  <Input 
                    id="address" 
                    value={formData.address}
                    onChange={handleInputChange}
                    required 
                  />
                </div>
                
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input 
                      id="city" 
                      value={formData.city}
                      onChange={handleInputChange}
                      required 
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State/Province</Label>
                    <Input 
                      id="state" 
                      value={formData.state}
                      onChange={handleInputChange}
                      required 
                    />
                  </div>
                  <div>
                    <Label htmlFor="zip">ZIP / Postal Code</Label>
                    <Input 
                      id="zip" 
                      value={formData.zip}
                      onChange={handleInputChange}
                      required 
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input 
                    id="phone" 
                    type="tel" 
                    value={formData.phone}
                    onChange={handleInputChange}
                    required 
                  />
                </div>
                
                <div className="pt-4">
                  <h2 className="text-xl font-semibold mb-4">Payment Method</h2>
                  
                  <div className="grid md:grid-cols-2 gap-4 mb-6">
                    <Button
                      type="button"
                      variant={paymentMethod === 'card' ? 'default' : 'outline'}
                      className={`w-full ${paymentMethod === 'card' ? 'ring-2 ring-primary' : ''}`}
                      onClick={() => setPaymentMethod('card')}
                    >
                      Card
                    </Button>
                    <Button
                      type="button"
                      variant={paymentMethod === 'cod' ? 'default' : 'outline'}
                      className={`w-full ${paymentMethod === 'cod' ? 'ring-2 ring-primary' : ''}`}
                      onClick={() => setPaymentMethod('cod')}
                    >
                      Cash on Delivery
                    </Button>
                  </div>
                  
                  {paymentMethod === 'card' && (
                    <div className="pt-4 space-y-4">
                      <h3 className="font-medium">Card Payment Details</h3>
                      
                      <div>
                        <Label htmlFor="cardNumber">Card Number</Label>
                        <Input 
                          id="cardNumber" 
                          placeholder="1234 5678 9012 3456" 
                          value={cardNumber}
                          onChange={handleCardNumberChange}
                          required 
                        />
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-2">
                          <Label htmlFor="expiry">Expiry Date</Label>
                          <Input 
                            id="expiry" 
                            placeholder="MM/YY" 
                            value={expiryDate}
                            onChange={handleExpiryDateChange}
                            required 
                          />
                        </div>
                        <div>
                          <Label htmlFor="cvc">CVC</Label>
                          <Input 
                            id="cvc" 
                            placeholder="123" 
                            value={cvc}
                            onChange={handleCvcChange}
                            required 
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full mt-6"
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Processing...' : 'Place Order'}
                </Button>
              </form>
            </div>
          </div>
          
          <div>
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
              <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
              
              <div className="space-y-4 mb-4">
                {items.map(item => (
                  <div key={item.product.id} className="flex justify-between">
                    <div>
                      <span className="font-medium">{item.product.name}</span>
                      <span className="text-muted-foreground ml-1">x{item.quantity}</span>
                    </div>
                    <span>₱{(item.product.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              
              <div className="border-t pt-4">
                <div className="flex justify-between mb-2">
                  <span>Subtotal</span>
                  <span>₱{totalPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span>Shipping</span>
                  <span>Free</span>
                </div>
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>₱{totalPrice.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      {/* Address Prompt Dialog */}
      <Dialog open={showAddressPrompt} onOpenChange={setShowAddressPrompt}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Address Required</DialogTitle>
            <DialogDescription>
              Please fill in all address fields to complete your order.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <Button 
              className="w-full" 
              onClick={() => setShowAddressPrompt(false)}
            >
              OK
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CheckoutPage;