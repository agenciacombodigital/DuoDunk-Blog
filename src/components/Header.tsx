import { Link } from "react-router-dom";
import { Instagram, MessageSquare } from 'lucide-react';
import MobileMenu from './MobileMenu'; // Importação adicionada

export default function Header() {
  return (
    <header className="border-b bg-black relative z-50">
      <div className="container mx-auto px-4 flex items-center justify-between h-24">
        
        {/* --- LAYOUT DESKTOP (lg e acima) --- */}
        <div className="hidden lg:flex items-center justify-between w-full">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0">
            <img 
              src="/images/duodunk-logoV2.svg" 
              alt="Duo Dunk Logo" 
              className="h-[88px]"
            />
          </Link>
          
          {/* Navegação */}
          <nav className="flex items-center gap-8 text-sm uppercase tracking-widest font-inter font-semibold">
            <Link to="/" className="text-gray-300 hover:text-white transition-colors">Home</Link>
            <Link to="/ultimas" className="text-gray-300 hover:text-white transition-colors">Últimas</Link>
            <Link to="/times" className="text-gray-300 hover:text-white transition-colors">Times</Link>
            <Link to="/classificacao" className="text-gray-300 hover:text-white transition-colors">Classificação</Link>
          </nav>
          
          {/* Sociais */}
          <div className="flex items-center gap-4">
            <a 
              href="https://www.instagram.com/duodunk/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-gray-400 hover:text-primary transition-colors"
            >
              <Instagram size={20} />
            </a>
            <a 
              href="https://www.threads.com/@duodunk?xmt=AQF0DK1KHM0AbHGst0S-sm_Wy_Nva6Jl70oEeQGRbf5SZsY" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-gray-400 hover:text-primary transition-colors"
            >
              <MessageSquare size={20} />
            </a>
          </div>
        </div>

        {/* --- LAYOUT MOBILE & TABLET (abaixo de lg) --- */}
        <div className="lg:hidden w-full flex items-center justify-between h-full">
          {/* Logo à Esquerda */}
          <Link to="/" className="flex items-center h-16 w-16 flex-shrink-0">
            <img 
              src="/images/duodunk-logo-mobile.svg"
              alt="Duo Dunk Logo" 
              className="h-16 w-auto block"
            />
          </Link>

          {/* Menu à Direita */}
          <MobileMenu />
        </div>
        
      </div>
    </header>
  )
}