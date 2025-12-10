"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Home, Newspaper, Users, Trophy, Instagram, Calendar } from 'lucide-react';
import ThreadsIcon from './ThreadsIcon';

export default function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const menuItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/ultimas', label: 'Últimas', icon: Newspaper },
    { path: '/times', label: 'Times', icon: Users },
    { path: '/classificacao', label: 'Classificação', icon: Trophy },
    { path: '/calendario', label: 'Calendário', icon: Calendar },
    // ATUALIZADO: Texto do Quiz
    { path: '/jogos/milhao', label: '🏆 NBA Quiz', icon: Trophy }, 
  ];

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  // Fecha o menu ao mudar de rota
  useEffect(() => {
    closeMenu();
  }, [pathname]);

  // Previne o scroll da página quando o menu está aberto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <>
      {/* Botão hambúrguer */}
      <button
        onClick={toggleMenu}
        className="z-[100] relative text-gray-300 hover:text-white transition-colors"
        aria-label={isOpen ? "Fechar Menu" : "Abrir Menu"}
      >
        {isOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
      </button>

      {/* Overlay com blur */}
      {isOpen && (
        <div
          onClick={closeMenu}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[80] animate-fadeIn"
        ></div>
      )}

      {/* Menu lateral */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-4/5 max-w-xs bg-gray-900/90 backdrop-blur-lg
          shadow-2xl z-[90] transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="p-6 pt-24 flex flex-col h-full">
          {/* Items do menu */}
          <nav className="flex-grow space-y-2">
            {menuItems.map((item, index) => {
              const Icon = item.icon;
              const isActive = pathname === item.path;
              
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  onClick={closeMenu}
                  className={`
                    flex items-center gap-4 px-4 py-4 rounded-xl
                    transition-all duration-300 group text-lg font-bold
                    ${isActive 
                      ? 'bg-gray-800 text-white border-l-4 border-pink-600'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    }
                  `}
                  style={{
                    animation: isOpen ? `slideInLeft 0.5s ease-out ${100 + index * 100}ms forwards` : 'none'
                  }}
                >
                  <Icon className={`w-6 h-6 transition-colors ${isActive ? 'text-pink-500' : 'text-gray-400 group-hover:text-pink-500'}`} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Footer com redes sociais */}
          <div className="mt-auto pt-6 border-t border-white/10 text-center">
            <p className="text-sm text-gray-400 mb-4">Siga-nos:</p>
            <div className="flex justify-center gap-6">
              <a 
                href="https://www.instagram.com/duodunk/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-gray-400 hover:text-primary transition-colors"
                aria-label="Instagram"
              >
                <Instagram size={24} />
              </a>
              <a 
                href="https://www.threads.com/@duodunk?xmt=AQF0DK1KHM0AbHGst0S-sm_Wy_Nva6Jl70oEeQGRbf5SZsY" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-gray-400 hover:text-primary transition-colors"
                aria-label="Threads"
              >
                <ThreadsIcon className="w-6 h-6" />
              </a>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}