"use client";

import Link from "next/link";
import { usePathname } from 'next/navigation';
import { Instagram, BrainCircuit } from 'lucide-react';
import MobileMenu from './MobileMenu';
import ThreadsIcon from './ThreadsIcon';
import { cn } from '@/lib/utils';

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="border-b bg-black relative z-50">
      <div className="container mx-auto px-4 flex items-center justify-between h-24">
        
        {/* --- LAYOUT DESKTOP --- */}
        <div className="hidden lg:flex items-center justify-between w-full">
          <Link href="/" className="flex-shrink-0" aria-label="Página Inicial Duo Dunk">
            <img src="/images/duodunkv2-logo.svg" alt="Duo Dunk Logo" className="h-16" />
          </Link>
          
          <nav className="flex items-center gap-6 xl:gap-8 text-[11px] xl:text-sm uppercase tracking-widest font-inter font-semibold">
            <Link href="/" className={cn("transition-colors", pathname === '/' ? "text-pink-500" : "text-gray-300 hover:text-white")}>Home</Link>
            <Link href="/ultimas" className={cn("transition-colors", pathname === '/ultimas' ? "text-pink-500" : "text-gray-300 hover:text-white")}>Últimas</Link>
            <Link href="/palpite" className={cn("transition-colors flex items-center gap-1", pathname === '/palpite' ? "text-pink-500" : "text-gray-300 hover:text-white")}>
              <BrainCircuit size={16} /> Palpites
            </Link>
            <Link href="/times" className={cn("transition-colors", pathname?.startsWith('/times') ? "text-pink-500" : "text-gray-300 hover:text-white")}>Times</Link>
            <Link href="/classificacao" className={cn("transition-colors", pathname === '/classificacao' ? "text-pink-500" : "text-gray-300 hover:text-white")}>Classificação</Link>
            <Link href="/calendario" className={cn("transition-colors", pathname === '/calendario' ? "text-pink-500" : "text-gray-300 hover:text-white")}>Calendário</Link>
            <Link href="/jogos/milhao" className="text-yellow-400 hover:text-yellow-300 transition-colors font-bebas tracking-wide text-lg">🏆 NBA Quiz</Link>
          </nav>
          
          <div className="flex items-center gap-4">
            <a href="https://www.instagram.com/duodunk/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-primary transition-colors" aria-label="Instagram"><Instagram size={20} /></a>
            <a href="https://www.threads.com/@duodunk" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-primary transition-colors" aria-label="Threads"><ThreadsIcon className="w-5 h-5" /></a>
          </div>
        </div>

        {/* --- LAYOUT MOBILE --- */}
        <div className="lg:hidden w-full flex items-center justify-between h-full">
          <Link href="/" className="flex items-center h-12 flex-shrink-0" aria-label="Página Inicial Duo Dunk">
            <img src="/images/duodunkv2-logo.svg" alt="Duo Dunk Logo" className="h-12 w-auto block" />
          </Link>
          <MobileMenu />
        </div>
      </div>
    </header>
  )
}