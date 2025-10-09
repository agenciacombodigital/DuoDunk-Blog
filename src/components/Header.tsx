import { Link } from "react-router-dom";
import { Youtube, Instagram, Twitter, Twitch } from 'lucide-react';

export default function Header() {
  return (
    <header className="bg-background/80 backdrop-blur-sm sticky top-0 z-50 border-b border-border/50">
      <div className="container mx-auto px-4 flex items-center justify-between h-20">
        <Link to="/" className="text-4xl font-heading tracking-wider group">
          Duo<span className="text-primary group-hover:text-secondary transition-colors duration-300">Dunk</span>
        </Link>
        
        <nav className="hidden md:flex items-center gap-8 text-sm uppercase tracking-widest">
          <Link to="/" className="link-gradient-underline">Home</Link>
          <Link to="/ultimas" className="link-gradient-underline">Últimas</Link>
          <Link to="/admin" className="text-accent hover:text-white transition-colors">Admin</Link>
        </nav>

        <div className="flex items-center gap-4">
          <a href="#" className="text-gray-400 hover:text-primary transition-colors"><Youtube size={20} /></a>
          <a href="#" className="text-gray-400 hover:text-primary transition-colors"><Instagram size={20} /></a>
          <a href="#" className="text-gray-400 hover:text-primary transition-colors"><Twitter size={20} /></a>
          <a href="#" className="text-gray-400 hover:text-primary transition-colors"><Twitch size={20} /></a>
        </div>
      </div>
    </header>
  )
}