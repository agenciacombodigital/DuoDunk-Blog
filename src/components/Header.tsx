import { Link } from "react-router-dom";

export default function Header() {
  return (
    <header className="bg-background/80 backdrop-blur-sm sticky top-0 z-50 border-b border-border">
      <nav className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="text-2xl font-bold font-poppins">
          Duo<span className="text-secondary">Dunk</span>
        </Link>
        <div className="flex gap-6 text-white">
          <Link to="/" className="hover:text-secondary transition-colors">Home</Link>
          <Link to="/ultimas" className="hover:text-secondary transition-colors">Últimas</Link>
          <Link to="/admin" className="text-primary hover:text-pink-400 transition-colors">Admin</Link>
        </div>
      </nav>
    </header>
  )
}