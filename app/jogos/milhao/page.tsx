"use client";
import { useEffect, useState } from 'react';
import MilhaoInterface from '@/components/games/MilhaoInterface';
import { supabase } from '@/lib/supabase'; // Usando o import padrão

export default function MilhaoPage() {
  const [settings, setSettings] = useState<any>({});
  
  // Anti-Cheat State
  const [cheated, setCheated] = useState(false);

  useEffect(() => {
    // Carregar configurações (Logo, etc)
    supabase.from('quiz_settings').select('*').eq('id', 1).single().then(({ data }) => {
      if (data) setSettings(data);
    });

    // --- SISTEMA ANTI-CHEAT (TAB SWITCH = MORTE) ---
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setCheated(true);
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#050505] text-white font-sans selection:bg-cyan-500 selection:text-black">
      
      {/* BACKGROUND ANIMADO (DuoDunk Aura) */}
      <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-purple-600/30 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] bg-cyan-600/20 rounded-full blur-[120px] animate-pulse delay-1000" />
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay pointer-events-none"></div>

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4 md:p-8">
        
        {/* TELA DE ELIMINAÇÃO POR 'CHEAT' */}
        {cheated ? (
          <div className="max-w-md w-full bg-red-950/90 border border-red-500/50 p-8 rounded-3xl backdrop-blur-xl text-center shadow-[0_0_50px_rgba(220,38,38,0.5)] animate-in zoom-in duration-300">
            <h1 className="text-6xl mb-4">🚫</h1>
            <h2 className="text-3xl font-bebas text-red-500 mb-2">FALTA TÉCNICA!</h2>
            <p className="text-gray-300 mb-6">Você saiu da tela do jogo. Para garantir a integridade do Quiz mais difícil do Brasil, não é permitido trocar de abas.</p>
            <button onClick={() => window.location.reload()} className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-full uppercase tracking-widest transition">
              Tentar Novamente
            </button>
          </div>
        ) : (
          /* INTERFACE DO JOGO */
          <MilhaoInterface initialSettings={settings} />
        )}
      </div>
    </div>
  );
}