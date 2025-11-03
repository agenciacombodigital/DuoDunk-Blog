import { Link } from "react-router-dom";
import { Youtube, Instagram, Twitter, Twitch } from 'lucide-react';
import MobileMenu from './MobileMenu';

export default function Header() {
  return (
    <header className="border-b overflow-x-hidden bg-black">
      <div className="container mx-auto px-4 flex items-center justify-between h-20 md:h-24">
        <Link to="/">
          {/* Logo: h-12 no mobile, h-16 no desktop */}
          <img src="/images/duodunk-logoV2.svg" alt="Duo Dunk Logo" className="h-12 md:h-16" />
        </Link>
        
        {/* Navegação principal escondida no mobile */}
        <nav className="hidden lg:flex items-center gap-8 text-sm uppercase tracking-widest">
          <Link to="/" className="text-gray-300 hover:text-white transition-colors">Home</Link>
          <Link to="/ultimas" className="text-gray-300 hover:text-white transition-colors">Últimas</Link>
          <Link to="/times" className="text-gray-300 hover:text-white transition-colors">Times</Link>
          <Link to="/classificacao" className="text-gray-300 hover:text-white transition-colors">Classificação</Link>
        </nav>

        {/* Ícones de redes sociais e menu mobile */}
        <div className="flex items-center gap-4">
          <a href="#" className="text-gray-400 hover:text-primary transition-colors hidden sm:flex"><Youtube size={20} /></a>
          <a href="https://www.instagram.com/duodunk/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-primary transition-colors hidden sm:flex"><Instagram size={20} /></a>
          <a href="#" className="text-gray-400 hover:text-primary transition-colors hidden sm:flex"><Twitter size={20} /></a>
          <a href="#" className="text-gray-400 hover:text-primary transition-colors hidden sm:flex"><Twitch size={20} /></a>
          
          {/* Menu mobile */}
          <MobileMenu />
        </div>
      </div>
    </header>
  )
}