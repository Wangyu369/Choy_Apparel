
import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useLocation } from 'react-router-dom';
import Banner from '@/components/Banner';
import ProductGrid from '@/components/ProductGrid';
import { productsService } from '../services/api';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { 
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { CheckCircle } from 'lucide-react';

const Index = () => {
  const { data: bestSellers, isLoading, error } = useQuery({
    queryKey: ['bestsellers'],
    queryFn: () => productsService.getBestSellers(),
    retry: 1,
  });
  
  const location = useLocation();
  const orderSuccess = location.state?.orderSuccess;
  const orderId = location.state?.orderId;
  
  useEffect(() => {
    if (orderSuccess && orderId) {
      toast.success(`Order #${orderId} placed successfully!`);
    }
  }, [orderSuccess, orderId]);

  console.log('BestSellers:', bestSellers);
  return (
    <div className="min-h-screen flex flex-col">
      <Helmet>
        <title>Choy Apparel | Home</title>
        <meta name="description" content="Discover the latest fashion trends at Choy Apparel" />
      </Helmet>

      <main className="flex-1">
        <div className="container px-4 mx-auto py-8">
          {orderSuccess && (
            <Alert className="mb-6 bg-green-50 border-green-200">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <AlertTitle className="text-green-800">Order Successful!</AlertTitle>
              <AlertDescription className="text-green-700">
                Your order #{orderId} has been placed successfully. Thank you for shopping with us!
              </AlertDescription>
            </Alert>
          )}
          
          {/* Banner */}
          <Banner />
          
          {/* Best Sellers */}
          <section className="mb-16">
            {isLoading ? (
              <div>Loading best sellers...</div>
            ) : error ? (
              <div className="text-destructive">Could not load best sellers.</div>
            ) : (
              <ProductGrid products={bestSellers || []} title="Best sellers!" />
            )}
          </section>
        </div>
      </main>
      
      <footer className="bg-black text-white py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-sm font-semibold mb-4">About</h3>
              <p className="text-sm text-gray-400">
                Choy Apparel offers premium fashion for men and women with a focus on quality and style.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold mb-4">Privacy and Policy</h3>
              <p className="text-sm text-gray-400">
                We care about your privacy. Read our policies to understand how we protect your information.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold mb-4">Teams</h3>
              <p className="text-sm text-gray-400">
                Our team is dedicated to providing you with the best shopping experience.
              </p>
            </div>
          </div>
          <div className="mt-8 text-center text-xs text-gray-500">
            © 2023 Choy Apparel. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;