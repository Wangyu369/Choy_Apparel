import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, ShoppingBag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import AuthModal from './AuthModal';
import OrdersDialog from './OderDialog'
import logo from '../assets/logos.png';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { totalItems } = useCart();
  const { isAuthenticated, user, signOut } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authView, setAuthView] = useState<'signin' | 'signup'>('signin');
  
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const handleOpenAuthModal = (view: 'signin' | 'signup') => {
    setAuthView(view);
    setShowAuthModal(true);
  };

  const handleHomeClick = () => {
    navigate('/');
  };

  return (
    <>
      <header className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out",
        isScrolled ? "bg-white/80 backdrop-blur-md shadow-sm" : "bg-transparent"
      )}>
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-2">
              <div className="relative h-10 w-10">
                <div className="absolute inset-0 rounded-full bg-primary"></div>
                <div className="absolute inset-1 rounded-full bg-white flex items-center justify-center">
                <img src={logo} alt="Logo" />

               
                </div>
              </div>
              <span className="text-lg font-bold hidden md:block">Choy Apparel</span>
            </Link>
            
            <div className="relative hidden md:block max-w-md w-full">
              <div className="relative">
                <input 
                  type="search" 
                  placeholder="Search here" 
                  className="w-full rounded-full bg-secondary px-4 py-2 pl-10 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Link to="/cart" className="relative p-2">
                <ShoppingBag className="h-5 w-5" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-black text-[10px] text-white">
                    {totalItems}
                  </span>
                )}
              </Link>
              {isAuthenticated ? (
                <div className="flex items-center space-x-4">
                  <span className="text-sm hidden md:inline-block">Hello, {user?.name}</span>
                  <OrdersDialog />
                  <Button variant="ghost" size="sm" onClick={signOut}>Sign Out</Button>
                </div>
              ) : (
                <Button variant="default" size="sm" onClick={() => handleOpenAuthModal('signin')}>
                  Log In
                </Button>
              )}
            </div>
          </div>
        </div>
        
        <nav className="bg-black text-white">
          <div className="container mx-auto">
            <ul className="flex justify-center">
              <li>
                <Link 
                  to="/" 
                  onClick={handleHomeClick}
                  className={cn(
                    "block px-6 py-2 text-sm nav-link",
                    isActive('/') && "font-medium text-white after:w-full"
                  )}
                >
                  Home
                </Link>
              </li>
              <li>
                <Link 
                  to="/category/men" 
                  className={cn(
                    "block px-6 py-2 text-sm nav-link",
                    isActive('/category/men') && "font-medium text-white after:w-full"
                  )}
                >
                  Men
                </Link>
              </li>
              <li>
                <Link 
                  to="/category/women" 
                  className={cn(
                    "block px-6 py-2 text-sm nav-link",
                    isActive('/category/women') && "font-medium text-white after:w-full"
                  )}
                >
                  Women
                </Link>
              </li>
              <li>
                <Link 
                  to="/category/essentials" 
                  className={cn(
                    "block px-6 py-2 text-sm nav-link",
                    isActive('/category/essentials') && "font-medium text-white after:w-full"
                  )}
                >
                  Essentials
                </Link>
              </li>
            </ul>
          </div>
        </nav>
      </header>
      
      <div className="h-[100px]"></div>
      
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
        initialView={authView}
        onSwitchView={(view) => setAuthView(view)}
      />
    </>
  );
};

export default Navbar;