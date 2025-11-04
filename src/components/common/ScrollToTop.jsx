import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import LoadingSpinner from './LoadingSpinner';

export default function ScrollToTop() {
  const { pathname } = useLocation();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Tampilkan loading spinner
    setIsLoading(true);

    // Smooth scroll to top
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth'
    });

    // Sembunyikan loading setelah delay
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 300); // Reduced from 500ms to 300ms

    return () => clearTimeout(timer);
  }, [pathname]);

  return <LoadingSpinner show={isLoading} message="Memuat halaman..." size="normal" />;
}
