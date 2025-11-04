import { Link } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { useState } from 'react';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* LOGO - SEMPRE VISÍVEL */}
          <Link to="/" className="flex items-center gap-2 z-50 flex-shrink-0">
            <img 
              src="/images/logo.svg" 
              alt="DuoDunk Logo" 
              className="h-10 w-auto sm:h-12" 
              style={{ display: 'block', maxWidth: '150px' }}
            />
          </Link>

          {/* MENU DESKTOP - Oculto no mobile */}
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-gray-700 hover:text-[#FA007D] font-semibold">
              HOME
            </Link>
            <Link to="/ultimas" className="text-gray-700 hover:text-[#FA007D] font-semibold">
              ÚLTIMAS
            </Link>
            <Link to="/times" className="text-gray-700 hover:text-[#FA007D] font-semibold">
              TIMES
            </Link>
            <Link to="/classificacao" className="text-gray-700 hover:text-[#FA007D] font-semibold">
              CLASSIFICAÇÃO
            </Link>
          </nav>

          {/* BOTÃO MENU MOBILE */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-gray-700 hover:text-[#FA007D]"
            aria-label="Menu"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>

        {/* MENU MOBILE - Dropdown */}
        {mobileMenuOpen && (
          <nav className="md:hidden py-4 border-t border-gray-200">
            <Link 
              to="/" 
              className="block py-2 text-gray-700 hover:text-[#FA007D] font-semibold"
              onClick={() => setMobileMenuOpen(false)}
            >
              HOME
            </Link>
            <Link 
              to="/ultimas" 
              className="block py-2 text-gray-700 hover:text-[#FA007D] font-semibold"
              onClick={() => setMobileMenuOpen(false)}
            >
              ÚLTIMAS
            </Link>
            <Link 
              to="/times" 
              className="block py-2 text-gray-700 hover:text-[#FA007D] font-semibold"
              onClick={() => setMobileMenuOpen(false)}
            >
              TIMES
            </Link>
            <Link 
              to="/classificacao" 
              className="block py-2 text-gray-700 hover:text-[#FA007D] font-semibold"
              onClick={() => setMobileMenuOpen(false)}
            >
              CLASSIFICAÇÃO
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}