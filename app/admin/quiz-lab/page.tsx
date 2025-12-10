"use client";
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { BrainCircuit, Save, RefreshCw, AlertTriangle, CheckCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function QuizLab() {
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  // --- 1. DEFINIÇÃO DE NÍVEIS ISOLADA ---
  const getLevelPrompt = (level: number | 'mixed') => {
    const commonRules = `
      ATUE COMO UM ESPECIALISTA EM NBA (PORTUGUÊS DO BRASIL).
      Gere um ARRAY JSON puro com 50 perguntas de quiz.
      FORMATO OBRIGATÓRIO (SEM MARKDOWN):
      [{"level": 1, "question": "...", "options": ["A","B","C","D"], "correct_index": 0, "category": "..."}]
      
      REGRAS CRÍTICAS:
      - Idioma: PT-BR (Use 'Time' não 'Equipa', 'Toco', 'Cesta').
      - NÃO repita perguntas.
      - NÃO coloque vírgula no último item.
    `;

    if (level === 1) return `
      ${commonRules}
      FOCO EXCLUSIVO: NÍVEL 1 (FÁCIL/CASUAL).
      Assuntos permitidos APENAS:
      - Cores dos times, Cidades sedes, Mascotes.
      - Superestrelas óbvias (LeBron, Curry, Jordan, Shaq).
      - Regras muito básicas (pontos da cesta, tempo de jogo).
      PROIBIDO: Perguntas de história antiga ou jogadores desconhecidos.
      TODAS as perguntas devem ter "level": 1.
    `;

    if (level === 2) return `
      ${commonRules}
      FOCO EXCLUSIVO: NÍVEL 2 (MÉDIO/FÃ).
      Assuntos permitidos APENAS:
      - Campeões dos últimos 20 anos.
      - Apelidos famosos (The King, Black Mamba).
      - Recordes simples (quem tem mais pontos).
      TODAS as perguntas devem ter "level": 2.
    `;

    if (level === 3) return `
      ${commonRules}
      FOCO EXCLUSIVO: NÍVEL 3 (DIFÍCIL/HARDCORE).
      Assuntos permitidos APENAS:
      - MVPs de anos específicos, Técnicos históricos.
      - Detalhes de Drafts (quem foi a escolha #1 em 2004).
      - Estatísticas específicas (rebotes, assistências).
      TODAS as perguntas devem ter "level": 3.
    `;

    if (level === 4) return `
      ${commonRules}
      FOCO EXCLUSIVO: NÍVEL 4 (MILHÃO/EXPERT).
      Assuntos permitidos APENAS:
      - Recordes obscuros e curiosidades bizarras.
      - História da ABA ou anos 50/60/70.
      - Jogadores de rotação que fizeram história.
      TODAS as perguntas devem ter "level": 4.
    `;

    return `
      ${commonRules}
      MISTURE OS NÍVEIS EQUITATIVAMENTE (1, 2, 3 e 4).
      Garanta diversidade total de temas.
    `;
  };

  const generateQuestions = async (level: number | 'mixed') => {
    if (!apiKey) return toast.error("Insira sua API Key do Gemini (2.5 Flash)!");
    
    setLoading(true);
    setGeneratedQuestions([]);
    
    // Constrói o prompt específico para aquele nível
    const finalPrompt = getLevelPrompt(level);

    try {
      // --- 2. CHAMADA API ATUALIZADA (GEMINI 2.5) ---
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: finalPrompt }] }],
          generationConfig: {
            temperature: 0.7, // Criatividade alta para não repetir
            maxOutputTokens: 8192,
          }
        })
      });

      const data = await response.json();
      
      if (data.error) {
        // Fallback: Se o 2.5 falhar, tenta o 1.5-flash-latest
        if(data.error.code === 404) {
             throw new Error("Modelo não encontrado. Tente verificar se sua chave tem acesso ao 'gemini-2.5-flash'.");
        }
        throw new Error(data.error.message);
      }
      
      let rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      
      // Limpeza do JSON
      rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      rawText = rawText.replace(/,\s*\]/g, ']'); // Remove vírgula final

      let parsed;
      try {
        parsed = JSON.parse(rawText);
      } catch (e) {
        // Tenta corrigir erro de array colado se houver
        rawText = rawText.replace(/\]\s*\[/g, ',');
        if (!rawText.startsWith('[')) rawText = '[' + rawText;
        if (!rawText.endsWith(']')) rawText = rawText + ']';
        
        try {
            parsed = JSON.parse(rawText);
        } catch (e2) {
            throw new Error("Falha ao parsear JSON. Verifique o formato retornado pela IA.");
        }
      }
      
      if (!Array.isArray(parsed)) throw new Error("A IA não retornou uma lista válida.");

      const questionsWithIds = parsed.filter(q => 
          q.question && 
          Array.isArray(q.options) && 
          q.options.length === 4 && 
          q.correct_index !== undefined && 
          q.correct_index >= 0 && 
          q.correct_index <= 3
      ).map((q, i) => ({
        ...q,
        level: level === 'mixed' ? q.level : level, // Força o nível correto
        sequence_num: Date.now() + i
      }));
      
      if (questionsWithIds.length === 0) {
          throw new Error("Nenhuma pergunta válida foi gerada ou o formato JSON estava incorreto.");
      }

      setGeneratedQuestions(questionsWithIds);
      toast.success(`${questionsWithIds.length} perguntas geradas!`);

    } catch (error: any) {
      console.error(error);
      toast.error("Erro ao gerar: " + error.message);
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
        toast.success("Perguntas salvas no banco com sucesso!");
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
            <h1 className="text-4xl font-bebas text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500">
            🧪 NBA QuizLab <span className="text-sm text-gray-500 ml-2">v2.5 (Gemini Flash)</span>
            </h1>
            <Link href="/admin/quiz" className="text-gray-400 hover:text-white flex items-center gap-2"><ArrowLeft className="w-4 h-4"/> Voltar</Link>
        </div>

        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 mb-8">
            <label className="block text-sm font-bold text-gray-400 mb-2">Gemini API Key</label>
            <input 
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Cole sua chave AIza..."
                className="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg text-white outline-none focus:border-green-500"
            />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            {[1, 2, 3, 4].map((lvl) => (
                <button 
                    key={lvl}
                    onClick={() => generateQuestions(lvl)} 
                    disabled={loading || !apiKey} 
                    className={`p-4 rounded-xl font-bold transition flex flex-col items-center gap-2 ${
                        loading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'
                    } ${
                        lvl === 1 ? 'bg-green-900/50 text-green-400 border border-green-500/30' :
                        lvl === 2 ? 'bg-blue-900/50 text-blue-400 border border-blue-500/30' :
                        lvl === 3 ? 'bg-orange-900/50 text-orange-400 border border-orange-500/30' :
                        'bg-purple-900/50 text-purple-400 border border-purple-500/30'
                    }`}
                >
                    {loading ? <RefreshCw className="animate-spin"/> : `Gerar Nível ${lvl}`}
                </button>
            ))}
            
            <button onClick={() => generateQuestions('mixed')} disabled={loading || !apiKey} className="p-4 bg-gray-700 border border-gray-600 rounded-xl font-bold text-white hover:bg-gray-600 transition flex flex-col items-center gap-2 disabled:opacity-50">
                {loading ? <RefreshCw className="animate-spin"/> : "Gerar Misto"}
            </button>
        </div>

        {generatedQuestions.length > 0 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-between items-center mb-4 bg-green-900/20 p-4 rounded-lg border border-green-500/30">
                    <h2 className="text-xl font-bold flex items-center gap-2 text-green-400">
                        <CheckCircle /> {generatedQuestions.length} Perguntas Prontas
                    </h2>
                    <button 
                        onClick={saveToDatabase} 
                        disabled={saving}
                        className="bg-green-600 hover:bg-green-500 text-white px-8 py-3 rounded-lg font-bold flex items-center gap-2 shadow-lg disabled:opacity-50"
                    >
                        {saving ? <RefreshCw className="animate-spin"/> : <Save />}
                        SALVAR NO BANCO
                    </button>
                </div>

                <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden max-h-[500px] overflow-y-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-900 text-gray-400 uppercase font-bold sticky top-0">
                            <tr>
                                <th className="p-4">Nível</th>
                                <th className="p-4">Pergunta</th>
                                <th className="p-4">Resp. Correta</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {generatedQuestions.map((q, idx) => (
                                <tr key={idx} className="hover:bg-gray-700/50">
                                    <td className="p-4 text-center font-bold">{q.level}</td>
                                    <td className="p-4">{q.question}</td>
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