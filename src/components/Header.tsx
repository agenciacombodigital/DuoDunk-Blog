import { Link } from "react-router-dom";
import { Youtube, Instagram, Twitter, Twitch } from 'lucide-react';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b">
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
        </nav>

        {/* Ícones de redes sociais */}
        <div className="flex items-center gap-4">
          <a href="#" className="text-gray-400 hover:text-primary transition-colors"><Youtube size={20} /></a>
          <a href="https://www.instagram.com/duodunk/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-primary transition-colors"><Instagram size={20} /></a>
          <a href="#" className="text-gray-400 hover:text-primary transition-colors"><Twitter size={20} /></a>
          <a href="#" className="text-gray-400 hover:text-primary transition-colors"><Twitch size={20} /></a>
        </div>
      </div>
    </header>
  )
}