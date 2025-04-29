
import { Product } from './products.types';

// Define product images with placeholder URLs


import e1 from '../assets/essentials/e1.png'
import e2 from '../assets/essentials/e2.png'
import e3 from '../assets/essentials/e3.png'
import e4 from '../assets/essentials/e4.png'
import e5 from '../assets/essentials/e5.png'
import e6 from '../assets/essentials/e6.png'
import e7 from '../assets/essentials/e7.png'
import e8 from '../assets/essentials/e8.png'
import e9 from '../assets/essentials/e9.png'
import e10 from '../assets/essentials/e10.png'


// Essentials products
export const essentialsProducts: Product[] = [
  {
    id: 'UA Cap ni Ungart',
    name: 'UA Cap ni Ungart',
    price: 890,
    category: 'essentials',
    image: e1,
    isBestSeller: true,
    description: 'Classic Black and White cap with a modern twist, adjustable fit.'
  },
  {
    id: 'Buhay ng Gansta Neutral Bandana',
    name: 'Buhay ng Gansta Neutral Bandana',
    price: 590,
    category: 'essentials',
    image: e2,
    isBestSeller: true,
    description: 'Buhay ng gansta,pang pahid sa samad.'
  },
  {
    id: 'White Sock',
    name: 'White Sock',
    price: 280,
    category: 'essentials',
    image: e3,
    description: 'Comfortable sleek white sock perfect for you.'
  },
  {
    id: 'Gray Sock',
    name: 'Gray Sock',
    price: 280,
    category: 'essentials',
    image: e4,
    description: 'Comfortable sleek Gray sock perfect for you.'
  },
  {
    id: 'Blanc Men perfume',
    name: 'Blanc Men perfume',
    price: 890,
    category: 'essentials',
    image: e5,
    isBestSeller: true,
    description: 'eau de toilette spray all over your body.'
  },
  {
    id: 'Amethsyt Women perfume',
    name: 'Amethsyt Women perfume',
    price: 890,
    category: 'essentials',
    image: e6,
    description: 'eau de toilette spray all over your body.'
  },
  {
    id: 'Cloud Bag',
    name: 'Cloud Bag',
    price: 890,
    category: 'essentials',
    image: e7,
    isBestSeller: true,
    description: 'Sleek black bag with a "cloud" design, spacious and practical.'
  },
  {
    id: 'Shinobi Sleeper',
    name: 'Shinobi Sleeper',
    price: 680,
    category: 'essentials',
    image: e8,
    description: 'Comfortable and soft sleeper made with fine cotton and leather.'
  },
  {
    id: 'Gansta Green',
    name: 'Gansta Green',
    price: 680,
    category: 'essentials',
    image: e9,
    description: 'Perfect for Gansta boi na nature lover.'
  },
  {
    id: 'Pink Panther Sling Bag',
    name: 'Pink Panther Sling Bag',
    price: 680,
    category: 'essentials',
    image: e10,
    description: 'Sleek Pink bag with a "cloud" design, spacious and practical.'
  },
];
