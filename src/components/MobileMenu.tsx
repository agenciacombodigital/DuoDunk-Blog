import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Home, Newspaper, Users, Trophy, Youtube, Instagram, Twitter, Twitch } from 'lucide-react';

export default function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const menuItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/ultimas', label: 'Últimas', icon: Newspaper },
    { path: '/times', label: 'Times', icon: Users },
    { path: '/classificacao', label: 'Classificação', icon: Trophy },
    { path: '/jogadores', label: 'Jogadores', icon: Users },
  ];

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

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
    <div className="lg:hidden">
      {/* Botão hambúrguer */}
      <button
        onClick={toggleMenu}
        className="z-[100] relative text-gray-300 hover:text-white transition-colors"
        aria-label="Abrir menu"
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
          fixed top-0 right-0 h-full w-4/5 max-w-xs bg-gray-900/90 backdrop-blur-lg
          shadow-2xl z-[90] transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        <div className="p-6 flex flex-col h-full">
          {/* Logo no menu */}
          <div className="pb-6 border-b border-white/10">
            <Link to="/" onClick={closeMenu}>
              <img src="/images/duodunk-logoV2.svg" alt="Duo Dunk Logo" className="h-12" />
            </Link>
          </div>

          {/* Items do menu */}
          <nav className="flex-grow mt-8 space-y-2">
            {menuItems.map((item, index) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={closeMenu}
                  className={`
                    flex items-center gap-4 px-4 py-4 rounded-xl
                    transition-all duration-300 group text-lg font-bold
                    ${isActive 
                      ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg' 
                      : 'text-gray-300 hover:bg-white/10 hover:text-white'
                    }
                  `}
                  style={{
                    animation: isOpen ? `slideInRight 0.5s ease-out ${100 + index * 100}ms forwards` : 'none'
                  }}
                >
                  <Icon className={`w-6 h-6 transition-colors ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'}`} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Footer com redes sociais */}
          <div className="mt-auto pt-6 border-t border-white/10 text-center">
            <p className="text-sm text-gray-400 mb-4">Siga-nos:</p>
            <div className="flex justify-center gap-6">
              <a href="#" className="text-gray-400 hover:text-primary transition-colors"><Youtube size={24} /></a>
              <a href="https://www.instagram.com/duodunk/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-primary transition-colors"><Instagram size={24} /></a>
              <a href="#" className="text-gray-400 hover:text-primary transition-colors"><Twitter size={24} /></a>
              <a href="#" className="text-gray-400 hover:text-primary transition-colors"><Twitch size={24} /></a>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}