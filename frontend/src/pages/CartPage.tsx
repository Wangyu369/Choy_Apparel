
import React from 'react';
import { Helmet } from 'react-helmet';
import Cart from '@/components/Cart';

const CartPage = () => {
  return (
    <div className="min-h-screen">
      <Helmet>
        <title>Your Cart | Choy Apparel</title>
        <meta name="description" content="View and manage your shopping cart" />
      </Helmet>
      
      <main className="container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8">Your Cart</h1>
        <div className="max-w-2xl mx-auto">
          <Cart />
        </div>
      </main>
    </div>
  );
};

export default CartPage;
