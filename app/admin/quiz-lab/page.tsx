"use client";
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Save, RefreshCw, CheckCircle, ArrowLeft, Zap, Server, Trash2, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Question } from '@/lib/milhao-data';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

export default function QuizLab() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  
  // --- ESTADO DE SELEÇÃO ---
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);

  const generateQuestions = async (level: number | 'mixed') => {
    setLoading(true);
    setGeneratedQuestions([]);
    setSelectedIndices([]);
    const toastId = toast.loading("O Servidor está pensando... (Isso evita erros de cota)");
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-quiz', {
        body: { level }
      });

      if (error) throw new Error(error.message || "Erro na conexão com Edge Function.");
      if (data.error) throw new Error(data.error);

      let questions = data;
      if (typeof data === 'string') {
         try { questions = JSON.parse(data); } 
         catch { throw new Error("Erro ao ler resposta do servidor."); }
      }

      if (!Array.isArray(questions)) throw new Error("Formato inválido recebido.");

      const processed = questions.map((q: any, i: number) => ({
        ...q,
        level: level === 'mixed' ? q.level : q.level,
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
    
    // Filtra as perguntas que NÃO foram excluídas
    const questionsToSave = generatedQuestions.filter((_, i) => !selectedIndices.includes(i));
    
    if (questionsToSave.length === 0) {
        toast.info("Nenhuma pergunta restante para salvar.");
        setSaving(false);
        setGeneratedQuestions([]);
        setSelectedIndices([]);
        return;
    }
    
    try {
        // Tenta inserir. Se a pergunta já existir (mesmo texto), ignora e segue.
        const { error } = await supabase
            .from('milhao_questions')
            .upsert(questionsToSave, { onConflict: 'question', ignoreDuplicates: true });

        if (error) throw error;
        
        toast.success(`Processado! ${questionsToSave.length} perguntas enviadas (duplicatas ignoradas).`);
        
        // --- MUDANÇA AQUI: Limpa o estado e rola para o topo ---
        setGeneratedQuestions([]); 
        setSelectedIndices([]);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
    } catch (error: any) {
        toast.error("Erro ao salvar: " + error.message);
    } finally {
        setSaving(false);
    }
  };
  
  // --- AÇÕES DE SELEÇÃO ---
  const toggleSelect = (index: number) => {
    setSelectedIndices(prev => 
        prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIndices.length === generatedQuestions.length && generatedQuestions.length > 0) {
        setSelectedIndices([]); // Desmarca tudo
    } else {
        setSelectedIndices(generatedQuestions.map((_, i) => i)); // Marca tudo
    }
  };
  
  const handleDeleteSelected = () => {
    if (selectedIndices.length === 0) return;
    
    const remainingQuestions = generatedQuestions.filter((_, i) => !selectedIndices.includes(i));
    setGeneratedQuestions(remainingQuestions);
    setSelectedIndices([]); // Limpa seleção
    toast.info(`${selectedIndices.length} perguntas excluídas da lista de revisão.`);
  };
  
  const levelMap: Record<number, string> = { 1: 'Fácil', 2: 'Médio', 3: 'Difícil', 4: 'Milhão' };
  const levelColor: Record<number, string> = {
    1: 'bg-green-500/10 text-green-400 border-green-500/30',
    2: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
    3: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
    4: 'bg-red-600/10 text-red-400 border-red-600/30',
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

        {/* ÁREA DE RESULTADOS */}
        {generatedQuestions.length > 0 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold flex items-center gap-2 text-green-400"><CheckCircle /> {generatedQuestions.length} Perguntas</h2>
                    
                    <div className="flex gap-3">
                        {selectedIndices.length > 0 && (
                            <button 
                                onClick={handleDeleteSelected} 
                                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-bold shadow-lg flex items-center gap-2 text-sm"
                            >
                                <Trash2 className="w-4 h-4"/> Excluir ({selectedIndices.length})
                            </button>
                        )}
                        <button 
                            onClick={saveToDatabase} 
                            disabled={saving} 
                            className="bg-green-600 hover:bg-green-500 text-white px-6 py-2 rounded-lg font-bold shadow-lg flex items-center gap-2"
                        >
                            {saving ? <Loader2 className="animate-spin w-5 h-5"/> : <Save className="w-5 h-5"/>} SALVAR RESTANTES
                        </button>
                    </div>
                </div>
                <div className="bg-gray-900 rounded-xl border border-gray-800 p-0 overflow-hidden max-h-[600px] overflow-y-auto">
                     <table className="w-full text-left text-sm text-gray-300">
                        <thead className="bg-black text-gray-400 uppercase font-bold sticky top-0">
                            <tr>
                                <th className="p-4 w-10">
                                    <Checkbox 
                                        checked={selectedIndices.length === generatedQuestions.length && generatedQuestions.length > 0}
                                        onCheckedChange={toggleSelectAll}
                                        className="border-gray-500 data-[state=checked]:bg-pink-600 data-[state=checked]:text-white"
                                    />
                                </th>
                                <th className="p-4 w-16">Nível</th>
                                <th className="p-4">Pergunta</th>
                                <th className="p-4">Resposta</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                            {generatedQuestions.map((q, idx) => (
                                <tr key={idx} className={cn("hover:bg-gray-800/50", selectedIndices.includes(idx) && "bg-gray-800/70")}>
                                    <td className="p-4 w-10">
                                        <Checkbox 
                                            checked={selectedIndices.includes(idx)}
                                            onCheckedChange={() => toggleSelect(idx)}
                                            className="border-gray-500 data-[state=checked]:bg-pink-600 data-[state=checked]:text-white"
                                        />
                                    </td>
                                    <td className="p-4 text-center font-bold text-white w-16">
                                        <span className={cn("px-2 py-1 rounded-full text-xs font-bold border", levelColor[q.level] || 'bg-gray-500/10 text-gray-400 border-gray-500/30')}>
                                            {levelMap[q.level] || 'N/D'}
                                        </span>
                                    </td>
                                    <td className="p-4 font-medium text-white">{q.question}</td>
                                    <td className="p-4 text-cyan-400">{q.options[q.correct_index]}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )}
        
        {/* O restante da página (cadastro manual e tabela de gerenciamento) não foi alterado */}
      </div>
    </div>
  );
}