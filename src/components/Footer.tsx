export default function Footer() {
  return (
    <footer className="bg-black text-white border-t border-gray-800 py-12">
      <div className="container mx-auto px-4 text-center">
        <p className="text-gray-400">
          © {new Date().getFullYear()} Duo Dunk. O Jogo Dentro do Jogo.
        </p>
      </div>
    </footer>
  );
}