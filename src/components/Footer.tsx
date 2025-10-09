export default function Footer() {
  return (
    <footer className="bg-card mt-20 border-t border-border/50">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-3 gap-8 text-center md:text-left">
          <div>
            <h3 className="text-3xl font-heading tracking-wider">
              Duo<span className="text-primary">Dunk</span>
            </h3>
            <p className="text-sm text-gray-400 mt-2">O Jogo Dentro do Jogo.</p>
          </div>
          <div className="text-gray-400 space-y-2">
            <h4 className="font-bold text-white uppercase tracking-widest mb-3">Navegação</h4>
            <a href="#" className="block hover:text-primary">Sobre</a>
            <a href="#" className="block hover:text-primary">Contato</a>
            <a href="#" className="block hover:text-primary">Política de Privacidade</a>
          </div>
          <div className="text-gray-400">
            <h4 className="font-bold text-white uppercase tracking-widest mb-3">Siga-nos</h4>
            <p>Acompanhe nas redes sociais.</p>
          </div>
        </div>
        <div className="text-center text-gray-500 text-sm mt-12 border-t border-border/50 pt-8">
          <p>© {new Date().getFullYear()} Duo Dunk. Criado com paixão pelo jogo.</p>
        </div>
      </div>
    </footer>
  )
}