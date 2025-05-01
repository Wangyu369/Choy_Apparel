import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import ProductGrid from '../components/ProductGrid';
import { productsService } from '../services/api';
import { getProductsByCategory } from '../utils/products';
import { useQuery } from '@tanstack/react-query';

const CategoryPage = () => {
  const { category } = useParams<{ category: string }>();
  const {
    data: products,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['products', category],
    queryFn: () => {
      if (category) {
        console.log('Fetching products for category:', category);
        return productsService.getProductsByCategory(category);
      }
      return Promise.resolve([]);
    },
    enabled: !!category,
    staleTime: 5 * 60 * 1000, // cache data for 5 minutes to prevent empty fetch on back navigation
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [category]);

  if (!category) {
    return <div>Category not found</div>;
  }

  const categoryTitle = category.charAt(0).toUpperCase() + category.slice(1);

  return (
    <div className="min-h-screen">
      <Helmet>
        <title>{categoryTitle} | Choy Apparel</title>
        <meta name="description" content={`Shop the latest ${category} fashion at Choy Apparel`} />
      </Helmet>

      <main className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">{categoryTitle}</h1>
          <p className="text-muted-foreground mt-2">
            Discover our {category} collection, featuring the latest styles and trends.
          </p>
        </div>

        {isLoading ? (
          <div>Loading products...</div>
        ) : error ? (
          <div className="text-destructive">Could not load products.</div>
        ) : products && products.length > 0 ? (
          <ProductGrid products={products} />
        ) : (
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
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <path d="M12 9v4" />
                <path d="M12 17h.01" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold">No products found</h2>
            <p className="mt-1 text-muted-foreground">
              We couldn't find any products in this category.
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default CategoryPage;
