import { useState, useEffect, useRef } from 'react';
import { Clock, Dumbbell, Plane, UtensilsCrossed, Home, Car } from 'lucide-react';
import { ImageWithFallback } from './ImageWithFallback';

interface Benefit {
  id: string;
  title: string;
  description: string;
  image: string;
  countdown?: {
    days: number;
    hours: number;
    minutes: number;
  };
  cta: string;
  category: string;
  bottomLabel?: string;
  bottomValue?: string;
}

const benefits: Benefit[] = [
  {
    id: '1',
    title: 'Equinox: Complimentary Guest Passes',
    description: 'Share your fitness journey. Bring guests to experience luxury wellness.',
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxneW0lMjBsdXh1cnl8ZW58MXx8fHwxNzM1NTA2NDAwfDA&ixlib=rb-4.1.0&q=80&w=1080',
    countdown: {
      days: 20,
      hours: 6,
      minutes: 45
    },
    cta: 'Claim',
    category: 'Fitness',
    bottomLabel: 'Guest passes available',
    bottomValue: '3 remaining this month'
  },
  {
    id: '2',
    title: 'Priority Pass: Global Lounge Access',
    description: 'Access 1,300+ airport lounges worldwide with Priority Pass Select.',
    image: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhaXJwb3J0JTIwbG91bmdlfGVufDF8fHx8MTczNTUwNjQwMHww&ixlib=rb-4.1.0&q=80&w=1080',
    cta: 'Activate',
    category: 'Travel Rewards',
    bottomLabel: 'Lounge access',
    bottomValue: 'Unlimited visits included'
  },
  {
    id: '3',
    title: 'Michelin Star Dining Credits',
    description: '$200 dining credit at participating Michelin-starred restaurants.',
    image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyZXN0YXVyYW50JTIwZmluZSUyMGRpbmluZ3xlbnwxfHx8fDE3MzU1MDY0MDB8MA&ixlib=rb-4.1.0&q=80&w=1080',
    countdown: {
      days: 12,
      hours: 18,
      minutes: 30
    },
    cta: 'Book table',
    category: 'Dining',
    bottomLabel: 'Dining credit',
    bottomValue: '$200 available'
  },
  {
    id: '4',
    title: 'Transfer Bilt Points to Hyatt',
    description: 'Access premium experiences worldwide at 30+ hotel brands.',
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBob3RlbCUyMHBvb2x8ZW58MXx8fHwxNzM1NTA2NDAwfDA&ixlib=rb-4.1.0&q=80&w=1080',
    cta: 'Transfer',
    category: 'Travel Rewards',
    bottomLabel: 'Transfer 1:1',
    bottomValue: '1K pts = 1K Hyatt Bonus Points'
  },
  {
    id: '5',
    title: 'Tesla Rental: Weekend Upgrade',
    description: 'Complimentary upgrade to Model S or X for weekend rentals.',
    image: 'https://images.unsplash.com/photo-1617788138017-80ad40651399?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZXNsYSUyMGNhcnxlbnwxfHx8fDE3MzU1MDY0MDB8MA&ixlib=rb-4.1.0&q=80&w=1080',
    cta: 'Reserve',
    category: 'Auto',
    bottomLabel: 'Weekend upgrade',
    bottomValue: 'Available Fri-Sun'
  }
];

interface FeaturedBenefitsCarouselProps {
  firstName?: string;
}

export function FeaturedBenefitsCarousel({ firstName }: FeaturedBenefitsCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDesktop, setIsDesktop] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);

  // Check if desktop
  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    return 'evening';
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Fitness':
        return <Dumbbell size={12} className="text-white" />;
      case 'Travel Rewards':
        return <Plane size={12} className="text-white" />;
      case 'Dining':
        return <UtensilsCrossed size={12} className="text-white" />;
      case 'Auto':
        return <Car size={12} className="text-white" />;
      default:
        return <Home size={12} className="text-white" />;
    }
  };

  // Touch/Mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollContainerRef.current) return;
    isDraggingRef.current = true;
    startXRef.current = e.pageX - scrollContainerRef.current.offsetLeft;
    scrollLeftRef.current = scrollContainerRef.current.scrollLeft;
    scrollContainerRef.current.style.cursor = 'grabbing';
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current || !scrollContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startXRef.current) * 2;
    scrollContainerRef.current.scrollLeft = scrollLeftRef.current - walk;
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
    if (scrollContainerRef.current) {
      scrollContainerRef.current.style.cursor = 'grab';
    }
  };

  // Touch handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!scrollContainerRef.current) return;
    isDraggingRef.current = true;
    startXRef.current = e.touches[0].pageX - scrollContainerRef.current.offsetLeft;
    scrollLeftRef.current = scrollContainerRef.current.scrollLeft;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingRef.current || !scrollContainerRef.current) return;
    const x = e.touches[0].pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startXRef.current) * 2;
    scrollContainerRef.current.scrollLeft = scrollLeftRef.current - walk;
  };

  const handleTouchEnd = () => {
    isDraggingRef.current = false;
  };

  // Track if we're programmatically scrolling to avoid conflicts
  const isProgrammaticScrollRef = useRef(false);

  // Scroll to current index
  useEffect(() => {
    if (!scrollContainerRef.current) return;
    
    // Wait for layout to be ready
    requestAnimationFrame(() => {
      if (!scrollContainerRef.current) return;
      
      const container = scrollContainerRef.current;
      const scrollWidth = container.scrollWidth;
      const visibleWidth = container.offsetWidth;
      
      // Calculate card width based on actual rendered size
      // On mobile, each card is 92% of container width + gap
      // On desktop, we show 3 cards with gaps (now 36.666% width each, ~10% bigger than original 33.333%)
      const gap = isDesktop ? 24 : 16; // md:gap-6 = 24px, gap-4 = 16px
      const cardWidth = isDesktop 
        ? (visibleWidth * 0.36666)  // ~36.666% width per card (10% bigger than 33.333%)
        : (visibleWidth * 0.92) + gap;    // 92% width + gap
      
      const scrollPosition = currentIndex * cardWidth;
      
      // Ensure we don't scroll past the end
      const maxScroll = Math.max(0, scrollWidth - visibleWidth);
      const clampedPosition = Math.min(Math.max(0, scrollPosition), maxScroll);
      
      isProgrammaticScrollRef.current = true;
      container.scrollTo({
        left: clampedPosition,
        behavior: 'smooth'
      });
      
      // Reset flag after scroll completes
      setTimeout(() => {
        isProgrammaticScrollRef.current = false;
      }, 500);
    });
  }, [currentIndex, isDesktop]);

  // Detect scroll events (for trackpad/mouse wheel scrolling)
  useEffect(() => {
    if (!scrollContainerRef.current || !isDesktop) return;
    
    const container = scrollContainerRef.current;
    
    const handleScroll = () => {
      // Skip if we're programmatically scrolling
      if (isProgrammaticScrollRef.current) return;
      
      const scrollLeft = container.scrollLeft;
      const visibleWidth = container.offsetWidth;
      const cardWidth = visibleWidth * 0.36666;
      
      // Calculate which card is most visible
      const cardIndex = Math.round(scrollLeft / cardWidth);
      const clampedIndex = Math.max(0, Math.min(cardIndex, benefits.length - 1));
      
      // Update currentIndex if it changed
      if (clampedIndex !== currentIndex) {
        setCurrentIndex(clampedIndex);
      }
    };
    
    // Use passive listener for better performance
    container.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [isDesktop, currentIndex]);

  const getFormattedDate = () => {
    const date = new Date();
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  return (
    <div className="w-full bg-gradient-to-b from-secondary/30 via-background to-background py-8 md:py-16 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 mb-6 md:mb-10">
        {/* Desktop: Greeting centered */}
        <div className="hidden md:block text-center">
          <h2 className="text-foreground mb-1 tracking-[-0.02em]" style={{ fontSize: '32px', fontWeight: 300, fontFamily: 'Inter, sans-serif', letterSpacing: '0.05em' }}>
            Good {getTimeOfDay()}, {firstName || 'there'}.
          </h2>
          <p className="text-muted-foreground tracking-[-0.01em]" style={{ fontSize: '18px', fontWeight: 400, fontFamily: 'Inter, sans-serif' }}>
            Picked just for you
          </p>
        </div>
        
        {/* Mobile: Featured Benefits Header */}
        <div className="md:hidden">
          <h1 className="text-foreground mb-1 tracking-[-0.02em]" style={{ fontSize: '28px', fontWeight: 300, fontFamily: 'Inter, sans-serif', letterSpacing: '-0.01em' }}>
            Good {getTimeOfDay()}, {firstName || 'there'}
          </h1>
          <p className="text-muted-foreground tracking-[-0.01em]" style={{ fontSize: '14px', fontWeight: 400, fontFamily: 'Inter, sans-serif' }}>
            {getFormattedDate()}
          </p>
        </div>
      </div>

      {/* Carousel Container */}
      <div className="relative">
        {/* Left Fade - Desktop Only */}
        <div className="hidden md:block absolute left-0 top-0 bottom-0 w-[15%] bg-gradient-to-r from-background via-background/50 to-transparent z-10 pointer-events-none" />
        
        {/* Right Fade - Desktop Only */}
        <div className="hidden md:block absolute right-0 top-0 bottom-0 w-[15%] bg-gradient-to-l from-background via-background/50 to-transparent z-10 pointer-events-none" />

        {/* Scrollable Container - 75% width on desktop (slightly wider to accommodate bigger cards) */}
        <div className="w-full md:w-[75%] md:mx-auto overflow-hidden">
          <div
            ref={scrollContainerRef}
            className="flex gap-4 md:gap-6 overflow-x-auto snap-x snap-mandatory scrollbar-hide cursor-grab active:cursor-grabbing pb-8 md:pb-12 px-6 md:px-0"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            {benefits.map((benefit, index) => (
              <div
                key={benefit.id}
                className="flex-shrink-0 w-[92%] md:w-[calc(36.666%-18px)] snap-center"
                style={{
                  opacity: isDesktop && index !== currentIndex && index !== (currentIndex + 1) % benefits.length && index !== (currentIndex - 1 + benefits.length) % benefits.length ? 0.4 : 1,
                  transform: isDesktop && index === currentIndex ? 'scale(1)' : 'scale(0.95)',
                  transition: 'all 0.5s ease'
                }}
              >
                <div className="rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 group h-full relative bg-card border border-[#2a2a2a]">
                  {/* Full Image Background - Taller on desktop (10-15% increase) */}
                  <div className="relative aspect-[3/4] md:aspect-[3/4.5]">
                    <ImageWithFallback
                      src={benefit.image}
                      alt={benefit.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />

                    {/* Countdown Timer - Top Right Corner (if exists) */}
                    {benefit.countdown && (
                      <div className="absolute top-3 right-3 z-20 px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-sm flex items-center gap-1">
                        <Clock size={11} className="text-white" />
                        <span className="text-xs text-white" style={{ fontWeight: 500 }}>
                          Ends {benefit.countdown.days}d {benefit.countdown.hours}h
                        </span>
                      </div>
                    )}

                    {/* Category Pill - On Midline between clean image and dark area */}
                    <div className="absolute left-4 z-20" style={{ top: '50%', transform: 'translateY(-50%)' }}>
                      <div className="px-3 py-1.5 rounded-full bg-white/25 backdrop-blur-md border border-white/30 flex items-center gap-1.5">
                        {getCategoryIcon(benefit.category)}
                        <span className="text-xs text-white" style={{ fontWeight: 600 }}>
                          {benefit.category}
                        </span>
                      </div>
                    </div>

                    {/* Bottom Content Section ONLY - with blur/darkening - 50% height */}
                    <div className="absolute inset-x-0 bottom-0 h-[50%]">
                      {/* Gradient + Blur Background */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/85 to-black/50" />
                      <div className="absolute inset-0 backdrop-blur-xl" />
                      
                      {/* Content - Flex column with space between */}
                      <div className="relative h-full flex flex-col p-4 md:p-5">
                        {/* Top Section: Title and Description (below category pill) */}
                        {/* Category pill is centered at 50% (midline), so we need padding from top to account for pill's bottom half + good spacing */}
                        <div className="pt-5 md:pt-1.5 flex-1 flex flex-col justify-start min-h-0">
                          {/* Title - Max 2 lines, positioned directly below category pill */}
                          <h3 className="text-white mb-2 line-clamp-2" style={{ fontSize: '16px', fontWeight: 600, lineHeight: '1.3' }}>
                            {benefit.title}
                          </h3>
                          
                          {/* Description - Max 2 lines */}
                          <p className="text-white/85 line-clamp-2" style={{ fontSize: '13px', fontWeight: 400, lineHeight: '1.4' }}>
                            {benefit.description}
                          </p>
                        </div>

                        {/* Bottom Section: Redemption Info and CTA Button in a single frame/widget */}
                        <div className="mt-auto px-3 py-2.5 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-between gap-3">
                          {/* Left: Redemption Info - Two lines stacked */}
                          {benefit.bottomLabel && benefit.bottomValue ? (
                            <div className="flex flex-col items-start min-w-0 flex-1">
                              <span className="text-xs text-white/70 truncate w-full leading-tight" style={{ fontWeight: 500 }}>
                                {benefit.bottomLabel}
                              </span>
                              <span className="text-xs text-white truncate w-full leading-tight" style={{ fontWeight: 600 }}>
                                {benefit.bottomValue}
                              </span>
                            </div>
                          ) : (
                            <div className="flex-1" />
                          )}

                          {/* Right: CTA Button */}
                          <button className="px-4 md:px-5 py-2 rounded-lg bg-white text-black hover:bg-white/90 transition-all shadow-sm whitespace-nowrap flex-shrink-0 flex items-center justify-center">
                            <span className="text-sm leading-tight" style={{ fontWeight: 600 }}>
                              {benefit.cta}
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Custom Dots */}
      <div className="flex items-center justify-center gap-2 mt-8">
        {benefits.map((_, index) => (
          <button
            key={index}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setCurrentIndex(index);
            }}
            className={`rounded-full transition-all ${
              index === currentIndex ? 'bg-foreground w-6 h-2' : 'bg-border w-2 h-2'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Hide scrollbar */}
      <style dangerouslySetInnerHTML={{ __html: `
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />
    </div>
  );
}

