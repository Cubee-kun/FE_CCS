import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import LoadingSpinner from './LoadingSpinner';

export default function ScrollToTop() {
  const { pathname } = useLocation();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // ✅ Only show loading and scroll for actual navigation, not refresh
    const isNavigationEvent = window.performance?.navigation?.type === 1 || 
                              performance.getEntriesByType?.('navigation')?.[0]?.type === 'navigate';
    
    if (isNavigationEvent) {
      setIsLoading(true);
    }

    // Smooth scroll to top
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth'
    });

    // Hide loading after delay
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [pathname]);

  // ✅ Don't show loading spinner on page refresh
  return isLoading ? <LoadingSpinner show={true} message="Memuat halaman..." size="normal" /> : null;
}
