import { Link } from "react-router-dom";
import { Youtube, Instagram, Twitter, Twitch } from 'lucide-react';
import MobileMenu from './MobileMenu';

export default function Header() {
  return (
    <header className="border-b bg-black relative z-50">
      <div className="container mx-auto px-4 flex items-center justify-between h-24">
        
        {/* --- LAYOUT DESKTOP & TABLET (md e acima) --- */}
        <div className="hidden md:flex items-center justify-between w-full">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0">
            <img 
              src="/images/duodunk-logoV2.svg" 
              alt="Duo Dunk Logo" 
              className="h-20"
            />
          </Link>
          
          {/* Navegação (Aparece em telas grandes, some em tablet) */}
          <nav className="hidden lg:flex items-center gap-8 text-sm uppercase tracking-widest">
            <Link to="/" className="text-gray-300 hover:text-white transition-colors">Home</Link>
            <Link to="/ultimas" className="text-gray-300 hover:text-white transition-colors">Últimas</Link>
            <Link to="/times" className="text-gray-300 hover:text-white transition-colors">Times</Link>
            <Link to="/classificacao" className="text-gray-300 hover:text-white transition-colors">Classificação</Link>
          </nav>
          
          {/* Sociais (Sempre visível em desktop/tablet) */}
          <div className="flex items-center gap-4">
            <a href="#" className="text-gray-400 hover:text-primary transition-colors"><Youtube size={20} /></a>
            <a href="https://www.instagram.com/duodunk/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-primary transition-colors"><Instagram size={20} /></a>
            <a href="#" className="text-gray-400 hover:text-primary transition-colors"><Twitter size={20} /></a>
            <a href="#" className="text-gray-400 hover:text-primary transition-colors"><Twitch size={20} /></a>
          </div>
        </div>

        {/* --- LAYOUT MOBILE (abaixo de md) --- */}
        <div className="md:hidden w-full flex items-center justify-between h-full">
          {/* Logo à Esquerda */}
          <Link to="/" className="flex-shrink-0">
            <img 
              src="/images/duodunk-logoV2.svg"
              alt="Duo Dunk Logo" 
              className="h-8"
            />
          </Link>

          {/* Menu à Direita */}
          <MobileMenu />
        </div>
        
      </div>
    </header>
  )
}