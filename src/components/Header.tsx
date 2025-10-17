import { Link } from "react-router-dom";
import { Youtube, Instagram, Twitter, Twitch } from 'lucide-react';
import NBAScoreboard from './NBAScoreboard';

export default function Header() {
  return (
    <>
      <header className="sticky top-0 z-50 border-b">
        <div className="container mx-auto px-4 flex items-center justify-between h-24">
          <Link to="/">
            <img src="/images/duodunk-logoV2.svg" alt="Duo Dunk Logo" className="h-12" />
          </Link>
          
          <nav className="hidden md:flex items-center gap-8 text-sm uppercase tracking-widest">
            <Link to="/" className="text-gray-300 hover:text-white transition-colors">Home</Link>
            <Link to="/ultimas" className="text-gray-300 hover:text-white transition-colors">Últimas</Link>
            <Link to="/classificacao" className="text-gray-300 hover:text-white transition-colors">Classificação</Link>
            <Link to="/calendario" className="text-gray-300 hover:text-white transition-colors">Calendário</Link>
            <Link to="/jogadores" className="text-gray-300 hover:text-white transition-colors">Jogadores</Link>
            <Link to="/lideres" className="text-gray-300 hover:text-white transition-colors">Líderes</Link>
          </nav>

          <div className="flex items-center gap-4">
            <a href="#" className="text-gray-400 hover:text-primary transition-colors"><Youtube size={20} /></a>
            <a href="#" className="text-gray-400 hover:text-primary transition-colors"><Instagram size={20} /></a>
            <a href="#" className="text-gray-400 hover:text-primary transition-colors"><Twitter size={20} /></a>
            <a href="#" className="text-gray-400 hover:text-primary transition-colors"><Twitch size={20} /></a>
          </div>
        </div>
      </header>
      <NBAScoreboard />
    </>
  )
}