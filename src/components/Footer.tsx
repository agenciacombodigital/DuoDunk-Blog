import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-black text-white border-t border-gray-800 py-12">
      <div className="container mx-auto px-4 text-center flex flex-col items-center gap-6">
        <Link to="/">
          <img src="/images/duodunk-logo.svg" alt="Duo Dunk Logo" className="h-8 opacity-80 hover:opacity-100 transition-opacity" />
        </Link>
        <p className="text-gray-400">
          © {new Date().getFullYear()} Duo Dunk. O Jogo Dentro do Jogo.
        </p>
      </div>
    </footer>
  );
}