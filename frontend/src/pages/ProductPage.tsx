
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { productsService } from '@/services/api';
import { useQuery } from '@tanstack/react-query';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { Minus, Plus, ShoppingBag } from 'lucide-react';
import ProductGrid from '@/components/ProductGrid';

const ProductPage = () => {
  const { productId } = useParams<{ productId: string }>();

  // Product details
  const {
    data: product,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['product', name],
    queryFn: () => (productId ? productsService.getProductById(productId) : Promise.resolve(null)),
    enabled: !!productId,
  });

  // Related products (from same category as this product)
  const {
    data: relatedProducts,
    isLoading: loadingRelated,
  } = useQuery({
    queryKey: ['related-products', product?.category, productId],
    queryFn: () =>
      product?.category
        ? productsService.getProductsByCategory(product.category).then((list) =>
            (list || []).filter((p: any) => p.id !== product.id).slice(0, 5)
          )
        : Promise.resolve([]),
    enabled: !!product?.category && !!productId,
  });

  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [productId]);

  if (isLoading) {
    return <div className="container mx-auto px-4 py-12 text-center">Loading product...</div>;
  }

  if (error || !product) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
        <p className="mb-6">The product you're looking for doesn't exist or has been removed.</p>
        <Button asChild>
          <Link to="/">Back to Home</Link>
        </Button>
      </div>
    );
  }

  const handleAddToCart = () => {
    addItem(product, quantity);
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const incrementQuantity = () => {
    setQuantity(quantity + 1);
  };

  return (
    <div className="min-h-screen">
      <Helmet>
        <title>{product.name} | Choy Apparel</title>
        <meta name="description" content={product.description || `${product.name} at Choy Apparel`} />
      </Helmet>

      <main className="container mx-auto px-4 py-12">
        <div className="mb-4">
          <Link to={`/category/${product.category_code}`} className="text-sm text-muted-foreground hover:text-foreground">
            &larr; Back to {product.name}
          </Link>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {/* Product Image */}
          <div className="relative rounded-lg overflow-hidden bg-accent">
            {!isImageLoaded && (
              <div className="absolute inset-0 shimmer bg-slate-100" />
            )}
            <img
              src={product.image}
              alt={product.name}
              className={`w-full h-auto object-cover ${isImageLoaded ? 'image-loaded' : 'image-fade-in'}`}
              onLoad={() => setIsImageLoaded(true)}
            />
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
              <p className="text-2xl font-semibold">₱{Number(product.price).toFixed(2)}</p>
            </div>
            
            {product.description && (
              <p className="text-muted-foreground">{product.description}</p>
            )}
            
            {/* Quantity Selector */}
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium">Quantity:</span>
              <div className="flex items-center">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-l-md rounded-r-none"
                  onClick={decrementQuantity}
                  disabled={quantity <= 1}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                
                <div className="h-8 w-12 flex items-center justify-center border-y border-input">
                  {quantity}
                </div>
                
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-l-none rounded-r-md"
                  onClick={incrementQuantity}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>
            
            {/* Add to Cart */}
            <Button 
              className="w-full gap-2" 
              onClick={handleAddToCart}
            >
              <ShoppingBag className="h-4 w-4" />
              Add to Cart
            </Button>
          </div>
        </div>

        {/* Related Products */}
        {loadingRelated ? (
          <div>Loading related products...</div>
        ) : relatedProducts && relatedProducts.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-6">You might also like</h2>
            <ProductGrid products={relatedProducts} />
          </div>
        )}
      </main>
    </div>
  );
};

export default ProductPage;