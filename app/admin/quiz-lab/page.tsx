"use client";
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Save, RefreshCw, CheckCircle, ArrowLeft, Zap, Server } from 'lucide-react';
import Link from 'next/link';

export default function QuizLab() {
  const [loading, setLoading] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  const generateQuestions = async (level: number | 'mixed') => {
    setLoading(true);
    setGeneratedQuestions([]);
    const toastId = toast.loading("O Servidor está pensando... (Isso evita erros de cota)");
    
    try {
      // Chama a Edge Function que usa a chave GEMINI_API_KEY_QUIZ do servidor
      const { data, error } = await supabase.functions.invoke('generate-quiz', {
        body: { level }
      });

      if (error) throw new Error(error.message || "Erro na conexão com Edge Function.");
      if (data.error) throw new Error(data.error);

      // O backend retorna o JSON puro ou string
      let questions = data;
      if (typeof data === 'string') {
         try { questions = JSON.parse(data); } 
         catch { throw new Error("Erro ao ler resposta do servidor."); }
      }

      if (!Array.isArray(questions)) throw new Error("Formato inválido recebido.");

      // Adiciona IDs locais para a tabela
      const processed = questions.map((q: any, i: number) => ({
        ...q,
        level: level === 'mixed' ? q.level : level,
        sequence_num: Date.now() + i
      }));

      setGeneratedQuestions(processed);
      toast.success(`${processed.length} perguntas geradas!`, { id: toastId });

    } catch (error: any) {
      console.error(error);
      toast.error(error.message, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const saveToDatabase = async () => {
    if (generatedQuestions.length === 0) return;
    setSaving(true);
    try {
        const { error } = await supabase.from('milhao_questions').insert(generatedQuestions);
        if (error) throw error;
        toast.success("Salvo no banco com sucesso!");
        setGeneratedQuestions([]); 
    } catch (error: any) {
        toast.error("Erro ao salvar: " + error.message);
    } finally {
        setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bebas text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600 flex items-center gap-3">
              <Server /> NBA QuizLab <span className="text-sm text-gray-500 ml-2">v5.0 (Edge Powered)</span>
            </h1>
            <Link href="/admin" className="text-gray-400 hover:text-white flex items-center gap-2">
                <ArrowLeft size={20}/> Voltar
            </Link>
        </div>

        <div className="bg-blue-900/20 border border-blue-500/30 p-6 rounded-xl mb-8 flex items-center gap-4">
            <div className="p-3 bg-blue-500/20 rounded-full text-blue-400">
                <Zap size={24} />
            </div>
            <div>
                <h3 className="font-bold text-blue-200">Gerador Turbo Ativado</h3>
                <p className="text-sm text-blue-300/70">Esta ferramenta usa processamento em nuvem (Edge Function) com uma chave dedicada. Mais estabilidade e sem erros de cota do navegador.</p>
            </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            {[1, 2, 3, 4].map((lvl) => (
                <button 
                    key={lvl}
                    onClick={() => generateQuestions(lvl)} 
                    disabled={loading} 
                    className={`p-6 rounded-xl font-bold transition flex flex-col items-center gap-2 border border-gray-700 bg-gray-800 hover:bg-gray-700 hover:border-cyan-500 ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95'}`}
                >
                    {loading ? <RefreshCw className="animate-spin"/> : `Gerar Nível ${lvl}`}
                </button>
            ))}
             <button onClick={() => generateQuestions('mixed')} disabled={loading} className="p-6 bg-purple-900/50 border border-purple-500 rounded-xl font-bold text-white hover:bg-purple-900/70 transition flex flex-col items-center gap-2">
                {loading ? <RefreshCw className="animate-spin"/> : "Gerar Misto"}
            </button>
        </div>

        {/* ÁREA DE RESULTADOS (Igual à anterior) */}
        {generatedQuestions.length > 0 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold flex items-center gap-2 text-green-400"><CheckCircle /> {generatedQuestions.length} Perguntas</h2>
                    <button onClick={saveToDatabase} disabled={saving} className="bg-green-600 hover:bg-green-500 text-white px-6 py-2 rounded-lg font-bold shadow-lg flex items-center gap-2">
                        {saving ? <RefreshCw className="animate-spin"/> : <Save />} SALVAR TUDO
                    </button>
                </div>
                <div className="bg-gray-900 rounded-xl border border-gray-800 p-0 overflow-hidden max-h-[600px] overflow-y-auto">
                     <table className="w-full text-left text-sm text-gray-300">
                        <thead className="bg-black text-gray-400 uppercase font-bold sticky top-0">
                            <tr>
                                <th className="p-4">Nível</th>
                                <th className="p-4">Pergunta</th>
                                <th className="p-4">Resposta</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                            {generatedQuestions.map((q, idx) => (
                                <tr key={idx} className="hover:bg-gray-800/50">
                                    <td className="p-4 text-center font-bold text-white">{q.level}</td>
                                    <td className="p-4 font-medium text-white">{q.question}</td>
                                    <td className="p-4 text-green-400">{q.options[q.correct_index]}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )}
      </div>
    </div>
  );
}