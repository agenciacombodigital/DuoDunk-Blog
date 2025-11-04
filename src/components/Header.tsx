import { Link } from "react-router-dom";
import { Youtube, Instagram, Twitter, Twitch } from 'lucide-react';
import MobileMenu from './MobileMenu';

export default function Header() {
  return (
    <header className="border-b overflow-x-hidden bg-black relative z-50">
      <div className="container mx-auto px-4 flex items-center justify-between h-20 md:h-24">
        
        {/* --- LAYOUT DESKTOP (md e acima) --- */}
        <div className="hidden md:flex items-center justify-between w-full">
          {/* Logo no Desktop */}
          <Link to="/" className="relative z-50 flex-shrink-0">
            <img 
              src="/images/duodunk-logoV2.svg" 
              alt="Duo Dunk Logo" 
              className="h-20"
            />
          </Link>
          
          {/* Navegação e Sociais no Desktop */}
          <div className="flex items-center flex-grow justify-end">
            <nav className="flex items-center gap-8 text-sm uppercase tracking-widest flex-grow justify-center">
              <Link to="/" className="text-gray-300 hover:text-white transition-colors">Home</Link>
              <Link to="/ultimas" className="text-gray-300 hover:text-white transition-colors">Últimas</Link>
              <Link to="/times" className="text-gray-300 hover:text-white transition-colors">Times</Link>
              <Link to="/classificacao" className="text-gray-300 hover:text-white transition-colors">Classificação</Link>
            </nav>
            
            <div className="flex items-center gap-4 flex-shrink-0">
              <a href="#" className="text-gray-400 hover:text-primary transition-colors"><Youtube size={20} /></a>
              <a href="https://www.instagram.com/duodunk/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-primary transition-colors"><Instagram size={20} /></a>
              <a href="#" className="text-gray-400 hover:text-primary transition-colors"><Twitter size={20} /></a>
              <a href="#" className="text-gray-400 hover:text-primary transition-colors"><Twitch size={20} /></a>
            </div>
          </div>
        </div>

        {/* --- LAYOUT MOBILE (abaixo de md) --- */}
        <div className="md:hidden w-full grid grid-cols-3 items-center h-full">
          {/* Coluna Esquerda: Menu */}
          <div className="justify-self-start">
            <MobileMenu />
          </div>

          {/* Coluna Central: Logo */}
          <div className="justify-self-center">
            <Link to="/">
              <img 
                src="/images/duodunk-logo-mobile.svg" 
                alt="Duo Dunk Logo" 
                className="h-12"
              />
            </Link>
          </div>

          {/* Coluna Direita: Vazia para balancear */}
          <div></div>
        </div>

      </div>
    </header>
  )
}