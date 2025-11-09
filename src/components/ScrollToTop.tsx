import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Força o scroll para o topo da janela
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}