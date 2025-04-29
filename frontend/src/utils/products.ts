
export type { Product } from './products.types';

//Helper functions
export const getBestSellers = () => {
  return products.filter(product => product.isBestSeller);
};

export const getProductsByCategory = (category: string) => {
  return products.filter(product => product.category === category);
};

export const getProductById = (id: string) => {
  return products.find(product => product.id === id);
};
