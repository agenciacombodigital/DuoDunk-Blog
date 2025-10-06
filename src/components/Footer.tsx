export default function Footer() {
  return (
    <footer className="bg-black/20 mt-20 py-12">
      <div className="container mx-auto px-4">
        <div className="text-center text-gray-400">
          <p className="text-sm mb-4">
            Duo Dunk é um projeto de demonstração.
          </p>
          <p>© {new Date().getFullYear()} Duo Dunk. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  )
}