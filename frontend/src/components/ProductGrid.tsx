
import React from 'react';
import ProductCard from './ProductCard';

// Use a generic product type matching minimal backend fields
export type ProductGridItem = {
  id: string;
  name: string;
  price: number;
  category: string;
  image: string;
  is_best_seller?: boolean;
  isBestSeller?: boolean;
  description?: string;
  stock?: number;
  created_at?: string;
  updated_at?: string;
};

type ProductGridProps = {
  products: ProductGridItem[];
  title?: string;
};

const ProductGrid: React.FC<ProductGridProps> = ({ products, title }) => {
  return (
    <div className="w-full">
      {title && (
        <div className="mb-6">
          <h2 className="text-2xl font-bold">{title}</h2>
        </div>
      )}
      
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
};

export default ProductGrid;