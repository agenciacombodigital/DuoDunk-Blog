"use client";

import { useEffect } from 'react';
import Link from 'next/link';
import { RefreshCw, AlertTriangle } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Opcional: Logar o erro para um serviço de monitoramento
    console.error("Erro capturado no Error Boundary:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center bg-white p-10 rounded-xl shadow-2xl border border-red-100 max-w-md">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Algo deu errado!</h2>
        <p className="text-gray-600 mb-6">
          Não foi possível carregar o conteúdo principal da página. Isso pode ser um erro temporário de conexão com o banco de dados.
        </p>
        <button
          onClick={
            // Tenta re-renderizar o segmento
            () => reset()
          }
          className="inline-flex items-center gap-2 bg-pink-600 hover:bg-pink-700 text-white px-6 py-3 rounded-xl font-bold transition"
        >
          <RefreshCw className="w-4 h-4" />
          Tentar Novamente
        </button>
        <Link href="/" className="block mt-4 text-sm text-gray-500 hover:text-pink-600">
            Voltar para Home (Forçar Recarga)
        </Link>
      </div>
    </div>
  );
}