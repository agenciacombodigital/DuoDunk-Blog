import { Link } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { useState } from 'react';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="bg-black border-b border-gray-800 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* LOGO - Caminho corrigido */}
          <Link to="/" className="flex items-center gap-2 z-50 flex-shrink-0">
            <img 
              src="/images/logo.svg" 
              alt="DuoDunk Logo" 
              className="h-10 w-auto sm:h-12" 
              style={{ display: 'block', maxWidth: '150px' }}
            />
          </Link>

          {/* MENU DESKTOP - Cores para tema escuro */}
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-gray-300 hover:text-[#FA007D] font-semibold transition-colors">
              HOME
            </Link>
            <Link to="/ultimas" className="text-gray-300 hover:text-[#FA007D] font-semibold transition-colors">
              ÚLTIMAS
            </Link>
            <Link to="/times" className="text-gray-300 hover:text-[#FA007D] font-semibold transition-colors">
              TIMES
            </Link>
            <Link to="/classificacao" className="text-gray-300 hover:text-[#FA007D] font-semibold transition-colors">
              CLASSIFICAÇÃO
            </Link>
          </nav>

          {/* BOTÃO MENU MOBILE - Cores para tema escuro */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-gray-300 hover:text-[#FA007D]"
            aria-label="Menu"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>

        {/* MENU MOBILE - Dropdown com tema escuro */}
        {mobileMenuOpen && (
          <nav className="md:hidden py-4 border-t border-gray-800 bg-black">
            <Link 
              to="/" 
              className="block py-2 text-gray-300 hover:text-[#FA007D] font-semibold"
              onClick={() => setMobileMenuOpen(false)}
            >
              HOME
            </Link>
            <Link 
              to="/ultimas" 
              className="block py-2 text-gray-300 hover:text-[#FA007D] font-semibold"
              onClick={() => setMobileMenuOpen(false)}
            >
              ÚLTIMAS
            </Link>
            <Link 
              to="/times" 
              className="block py-2 text-gray-300 hover:text-[#FA007D] font-semibold"
              onClick={() => setMobileMenuOpen(false)}
            >
              TIMES
            </Link>
            <Link 
              to="/classificacao" 
              className="block py-2 text-gray-300 hover:text-[#FA007D] font-semibold"
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