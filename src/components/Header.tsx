"use client";

import Link from "next/link";
import { Instagram } from 'lucide-react';
import MobileMenu from './MobileMenu';
import ThreadsIcon from './ThreadsIcon';

export default function Header() {
  return (
    <header className="border-b bg-black relative z-50">
      <div className="container mx-auto px-4 flex items-center justify-between h-24">
        
        {/* --- LAYOUT DESKTOP (lg e acima) --- */}
        <div className="hidden lg:flex items-center justify-between w-full">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0" aria-label="Página Inicial Duo Dunk">
            <img 
              src="/images/duodunk-logoV2.svg" 
              alt="Duo Dunk Logo" 
              className="h-[88px]"
            />
          </Link>
          
          {/* Navegação */}
          <nav className="flex items-center gap-8 text-sm uppercase tracking-widest font-inter font-semibold">
            <Link href="/" className="text-gray-300 hover:text-white transition-colors">Home</Link>
            <Link href="/ultimas" className="text-gray-300 hover:text-white transition-colors">Últimas</Link>
            <Link href="/times" className="text-gray-300 hover:text-white transition-colors">Times</Link>
            <Link href="/classificacao" className="text-gray-300 hover:text-white transition-colors">Classificação</Link>
            <Link href="/calendario" className="text-gray-300 hover:text-white transition-colors">Calendário</Link>
          </nav>
          
          {/* Sociais */}
          <div className="flex items-center gap-4">
            <a 
              href="https://www.instagram.com/duodunk/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-gray-400 hover:text-primary transition-colors"
              aria-label="Siga Duo Dunk no Instagram"
            >
              <Instagram size={20} />
            </a>
            <a 
              href="https://www.threads.com/@duodunk?xmt=AQF0DK1KHM0AbHGst0S-sm_Wy_Nva6Jl70oEeQGRbf5SZsY" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-gray-400 hover:text-primary transition-colors"
              aria-label="Siga Duo Dunk no Threads"
            >
              <ThreadsIcon className="w-5 h-5" />
            </a>
          </div>
        </div>

        {/* --- LAYOUT MOBILE & TABLET (abaixo de lg) --- */}
        <div className="lg:hidden w-full flex items-center justify-between h-full">
          {/* Logo à Esquerda */}
          <Link href="/" className="flex items-center h-16 w-16 flex-shrink-0" aria-label="Página Inicial Duo Dunk">
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