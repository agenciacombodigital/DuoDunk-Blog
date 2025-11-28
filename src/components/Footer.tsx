"use client";

import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-black text-white border-t border-gray-800 py-12">
      <div className="container mx-auto px-4 text-center flex flex-col items-center gap-6">
        <Link href="/">
          <img src="/images/duodunk-logoV2.svg" alt="Duo Dunk Logo" className="h-8 opacity-80 hover:opacity-100 transition-opacity" />
        </Link>
        
        <div className="border-t border-gray-800 mt-8 pt-8 w-full">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-400">
              © {new Date().getFullYear()} Duo Dunk. O Jogo Dentro do Jogo.
            </p>
            
            <div className="flex gap-4 text-sm">
              <Link 
                href="/privacidade" 
                className="text-gray-400 hover:text-[#FA007D] transition-colors"
              >
                Política de Privacidade
              </Link>
              <span className="text-gray-600">|</span>
              <Link 
                href="/cookies" 
                className="text-gray-400 hover:text-[#FA007D] transition-colors"
              >
                Política de Cookies
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}