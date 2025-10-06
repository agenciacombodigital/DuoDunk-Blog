import { Link } from "react-router-dom";

export default function Header() {
  return (
    <header className="bg-dunk-dark/80 backdrop-blur-sm sticky top-0 z-50 border-b border-dunk-card">
      <nav className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="text-2xl font-bold font-poppins">
          Duo<span className="text-dunk-yellow">Dunk</span>
        </Link>
        <div className="flex gap-6 text-white">
          <Link to="/" className="hover:text-dunk-yellow transition-colors">Home</Link>
          <Link to="/ultimas" className="hover:text-dunk-yellow transition-colors">Últimas</Link>
          <Link to="/admin" className="text-dunk-yellow hover:text-yellow-400 transition-colors">Admin</Link>
        </div>
      </nav>
    </header>
  )
}