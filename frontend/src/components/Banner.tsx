
import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

import sale from '../assets/banner1.png'
import newproducts from '../assets/banner2.png'
import essentials from '../assets/banner3.png'

type BannerSlide = {
  id: number;
  title: string;
  subtitle: string;
  buttonText: string;
  buttonLink: string;
  image: string;
};

const bannerSlides: BannerSlide[] = [
  {
    id: 1,
    title: 'SALE',
    subtitle: 'Under ₱999 PHP',
    buttonText: 'Shop Now',
    buttonLink: '/category/men',
    image: sale,
  },
  {
    id: 2,
    title: 'NEW ARRIVALS',
    subtitle: 'Summer Collection 2025',
    buttonText: 'Explore',
    buttonLink: '/category/women',
    image: essentials,
  },
  {
    id: 3,
    title: 'ESSENTIALS',
    subtitle: 'Must-have items to elevate your style',
    buttonText: 'Discover',
    buttonLink: '/category/essentials',
    image: newproducts,
  }
];

const Banner = () => {
  const [activeSlide, setActiveSlide] = useState(0);
  const [slideDirection, setSlideDirection] = useState<'right' | 'left'>('right');
  const [isAnimating, setIsAnimating] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const goToSlide = (index: number, direction: 'right' | 'left') => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    setSlideDirection(direction);
    
    setTimeout(() => {
      setActiveSlide(index);
      setIsAnimating(false);
    }, 500);
  };

  const goToNextSlide = () => {
    const nextSlide = (activeSlide + 1) % bannerSlides.length;
    goToSlide(nextSlide, 'right');
  };

  const goToPrevSlide = () => {
    const prevSlide = (activeSlide - 1 + bannerSlides.length) % bannerSlides.length;
    goToSlide(prevSlide, 'left');
  };

  useEffect(() => {
    // Auto-advance slides
    timerRef.current = setTimeout(goToNextSlide, 5000);
    
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  });

  return (
    <div className="relative w-full h-[350px] md:h-[400px] overflow-hidden rounded-lg mb-12 mx-auto max-w-5xl">
      <div 
        className={cn(
          "absolute inset-0 flex transition-transform duration-500 ease-in-out",
          isAnimating && slideDirection === 'right' && "animate-carousel-left",
          isAnimating && slideDirection === 'left' && "animate-carousel-right",
        )}
      >
        {bannerSlides.map((slide, index) => (
          <div 
            key={slide.id}
            className={cn(
              "relative min-w-full h-full bg-accent",
              index === activeSlide ? "block" : "hidden"
            )}
          >
            <div 
              className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent"
              style={{
                backgroundImage: `url(${slide.image})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            ></div>
            
            <div className="relative z-10 flex h-full items-center justify-start p-8 md:p-20">
              <div className="max-w-md space-y-6">
                <div className="space-y-2">
                  <div className="inline-block border border-black p-1">
                    <span className="text-xs font-medium uppercase tracking-wider">
                      {activeSlide === 0 ? 'Up to 50% off' : 'New Season'}
                    </span>
                  </div>
                  <h2 className="text-5xl font-bold tracking-tight">{slide.title}</h2>
                  <p className="text-lg">{slide.subtitle}</p>
                </div>
                
                <Link to={slide.buttonLink}>
                  <Button variant="outline" className="rounded-none border-black bg-white hover:bg-black hover:text-white transition-colors duration-200">
                    {slide.buttonText}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Slide controls */}
      <button 
        onClick={goToPrevSlide}
        className="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/80 p-2 shadow-md backdrop-blur-sm transition-all hover:bg-white"
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      
      <button 
        onClick={goToNextSlide}
        className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/80 p-2 shadow-md backdrop-blur-sm transition-all hover:bg-white"
        aria-label="Next slide"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
      
      {/* Indicators */}
      <div className="absolute bottom-4 left-0 right-0 z-10 flex justify-center space-x-2">
        {bannerSlides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index, index > activeSlide ? 'right' : 'left')}
            className={cn(
              "h-1.5 rounded-full transition-all",
              index === activeSlide ? "w-8 bg-white" : "w-3 bg-white/60"
            )}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default Banner;
