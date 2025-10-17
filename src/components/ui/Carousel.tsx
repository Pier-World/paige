import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CarouselProps {
  title?: string;
  items: React.ReactNode[];
  slidesToShow?: number;
  spacing?: number;
  autoplay?: boolean;
  autoplaySpeed?: number;
  className?: string;
}

export const Carousel: React.FC<CarouselProps> = ({
  title,
  items,
  slidesToShow = 4,
  spacing = 16,
  autoplay = false,
  autoplaySpeed = 5000,
  className = '',
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Responsive slidesToShow
  const getResponsiveSlidesToShow = () => {
    if (typeof window === 'undefined') return slidesToShow;
    const width = window.innerWidth;
    if (width < 640) return 1;
    if (width < 768) return Math.min(2, slidesToShow);
    if (width < 1024) return Math.min(3, slidesToShow);
    return slidesToShow;
  };

  const responsiveSlidesToShow = getResponsiveSlidesToShow();
  
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    if (!autoplay) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => 
        prevIndex === items.length - responsiveSlidesToShow ? 0 : prevIndex + 1
      );
    }, autoplaySpeed);
    
    return () => clearInterval(interval);
  }, [autoplay, autoplaySpeed, items.length, responsiveSlidesToShow]);

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex >= items.length - responsiveSlidesToShow ? 0 : prevIndex + 1
    );
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex <= 0 ? items.length - responsiveSlidesToShow : prevIndex - 1
    );
  };

  const slideWidth = responsiveSlidesToShow > 0 
    ? (containerWidth - (spacing * (responsiveSlidesToShow - 1))) / responsiveSlidesToShow 
    : containerWidth;

  return (
    <div className={`w-full ${className}`}>
      {title && (
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-display">{title}</h2>
          <div className="flex space-x-2">
            <button 
              onClick={prevSlide}
              className="p-2 rounded-full bg-primary-100 hover:bg-primary-200 transition-colors"
              aria-label="Previous slide"
            >
              <ChevronLeft size={20} />
            </button>
            <button 
              onClick={nextSlide}
              className="p-2 rounded-full bg-primary-100 hover:bg-primary-200 transition-colors"
              aria-label="Next slide"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      )}
      
      <div className="relative overflow-hidden" ref={containerRef}>
        <motion.div
          className="flex"
          animate={{
            x: -currentIndex * (slideWidth + spacing),
          }}
          transition={{ type: "spring", stiffness: 150, damping: 30 }}
          style={{ gap: `${spacing}px` }}
        >
          {items.map((item, index) => (
            <div
              key={index}
              style={{ width: `${slideWidth}px`, flexShrink: 0 }}
            >
              {item}
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};