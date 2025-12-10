"use client";
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Save, RefreshCw, CheckCircle, ArrowLeft, BrainCircuit } from 'lucide-react';
import Link from 'next/link';

// ⚡ MODELO ATUALIZADO (Dezembro 2025)
const GEMINI_MODEL = "gemini-2.0-flash-exp"; 

export default function QuizLab() {
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  // --- 1. LÓGICA DE PROMPT ISOLADA ---
  const getLevelPrompt = (level: number | 'mixed') => {
    // Cabeçalho Técnico
    const techSpecs = `
      ATUE COMO UM ESPECIALISTA EM NBA E ENGENHEIRO DE DADOS.
      Gere um ARRAY JSON puro com 50 perguntas.
      Idioma: Português do Brasil (PT-BR).
      Formato de Saída: APENAS o JSON [ ... ]. Sem markdown (\`\`\`json).
      Estrutura Obrigatória:
      {
        "level": <NUMERO_DO_NIVEL_FIXO>,
        "question": "...",
        "options": ["A", "B", "C", "D"],
        "correct_index": 0,
        "category": "..."
      }
      REGRA: NÃO coloque vírgula após o último objeto da lista.
    `;

    if (level === 1) return `
      ${techSpecs}
      SUA MISSÃO: Gerar 50 perguntas EXCLUSIVAMENTE DO NÍVEL 1 (FÁCIL).
      - O campo "level" deve ser sempre 1.
      - Tópicos: Cores dos times, Cidades, Mascotes, Lendas (Jordan/LeBron), Regras básicas.
    `;

    if (level === 2) return `
      ${techSpecs}
      SUA MISSÃO: Gerar 50 perguntas EXCLUSIVAMENTE DO NÍVEL 2 (MÉDIO).
      - O campo "level" deve ser sempre 2.
      - Tópicos: Campeões recentes, Apelidos famosos, Recordes simples.
    `;

    if (level === 3) return `
      ${techSpecs}
      SUA MISSÃO: Gerar 50 perguntas EXCLUSIVAMENTE DO NÍVEL 3 (DIFÍCIL).
      - O campo "level" deve ser sempre 3.
      - Tópicos: História anos 80/90, Detalhes de Draft, Estatísticas específicas.
    `;

    if (level === 4) return `
      ${techSpecs}
      SUA MISSÃO: Gerar 50 perguntas EXCLUSIVAMENTE DO NÍVEL 4 (MILHÃO/ESPECIALISTA).
      - O campo "level" deve ser sempre 4.
      - Tópicos: Recordes obscuros, Curiosidades extremas, História da ABA.
    `;

    return `
      ${techSpecs}
      SUA MISSÃO: Gerar 50 perguntas MISTAS (1 a 4).
      - Distribua os níveis de forma equilibrada.
    `;
  };

  const generateQuestions = async (level: number | 'mixed') => {
    if (!apiKey) return toast.error("Insira sua API Key do Gemini!");
    
    setLoading(true);
    setGeneratedQuestions([]);
    
    const finalPrompt = getLevelPrompt(level);

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: finalPrompt }] }],
          generationConfig: {
            temperature: 0.9,
            maxOutputTokens: 8192,
          }
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        if (response.status === 503) throw new Error("O modelo da IA está sobrecarregado (Erro 503). Aguarde 30s.");
        if (response.status === 404) throw new Error(`Modelo '${GEMINI_MODEL}' não encontrado.`);
        throw new Error(errData.error?.message || "Erro na API");
      }

      const data = await response.json();
      let rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      
      rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      
      let parsed;
      try {
        parsed = JSON.parse(rawText);
      } catch (e) {
        if (!rawText.startsWith('[')) rawText = `[${rawText}`;
        if (!rawText.endsWith(']')) rawText = `${rawText}]`;
        try { parsed = JSON.parse(rawText); } catch (e2) { throw new Error("A IA gerou um formato inválido. Tente novamente."); }
      }
      
      if (!Array.isArray(parsed)) throw new Error("A resposta não é uma lista.");

      const processed = parsed.map((q, i) => ({
        ...q,
        level: level === 'mixed' ? q.level : level,
        sequence_num: Date.now() + i
      }));

      setGeneratedQuestions(processed);
      toast.success(`${processed.length} perguntas geradas!`);

    } catch (error: any) {
      toast.error(error.message);
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
        toast.success("Perguntas salvas no banco!");
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
            <h1 className="text-4xl font-bebas text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 flex items-center gap-3">
              <BrainCircuit /> NBA QuizLab <span className="text-sm text-gray-500 font-sans">v2.5</span>
            </h1>
            <Link href="/admin" className="text-gray-400 hover:text-white flex items-center gap-2">
                <ArrowLeft size={20}/> Voltar
            </Link>
        </div>

        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 mb-8">
            <label className="block text-sm font-bold text-gray-400 mb-2">Gemini API Key</label>
            <input 
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Cole sua chave aqui..."
                className="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg text-white outline-none focus:border-cyan-500 transition"
            />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            {[1, 2, 3, 4].map((lvl) => (
                <button 
                    key={lvl}
                    onClick={() => generateQuestions(lvl)} 
                    disabled={loading} 
                    className={`p-6 rounded-xl font-bold transition flex flex-col items-center gap-2 border ${
                        loading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95'
                    } ${
                        lvl === 1 ? 'bg-green-900/30 text-green-400 border-green-500/30' :
                        lvl === 2 ? 'bg-blue-900/30 text-blue-400 border-blue-500/30' :
                        lvl === 3 ? 'bg-orange-900/30 text-orange-400 border-orange-500/30' :
                        'bg-purple-900/30 text-purple-400 border-purple-500/30'
                    }`}
                >
                    {loading ? <RefreshCw className="animate-spin"/> : `Gerar Nível ${lvl}`}
                </button>
            ))}
             <button onClick={() => generateQuestions('mixed')} disabled={loading} className="p-6 bg-gray-700 border border-gray-600 rounded-xl font-bold text-white hover:bg-gray-600 transition flex flex-col items-center gap-2">
                {loading ? <RefreshCw className="animate-spin"/> : "Gerar Misto"}
            </button>
        </div>

        {generatedQuestions.length > 0 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-between items-center mb-4 bg-green-900/20 p-4 rounded-lg border border-green-500/30">
                    <h2 className="text-xl font-bold flex items-center gap-2 text-green-400">
                        <CheckCircle /> {generatedQuestions.length} Perguntas Geradas
                    </h2>
                    <button 
                        onClick={saveToDatabase} 
                        disabled={saving}
                        className="bg-green-600 hover:bg-green-500 text-white px-8 py-3 rounded-lg font-bold flex items-center gap-2 shadow-lg hover:shadow-green-500/20 transition"
                    >
                        {saving ? <RefreshCw className="animate-spin"/> : <Save />}
                        SALVAR NO BANCO
                    </button>
                </div>

                <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden max-h-[600px] overflow-y-auto">
                    <table className="w-full text-left text-sm text-gray-300">
                        <thead className="bg-black text-gray-400 uppercase font-bold sticky top-0">
                            <tr>
                                <th className="p-4">Nível</th>
                                <th className="p-4">Pergunta</th>
                                <th className="p-4">Alternativas</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                            {generatedQuestions.map((q, idx) => (
                                <tr key={idx} className="hover:bg-gray-800/50 transition">
                                    <td className="p-4 text-center font-bold text-white">{q.level}</td>
                                    <td className="p-4 font-medium text-white">{q.question}</td>
                                    <td className="p-4 text-xs">
                                        <div className="grid grid-cols-2 gap-2">
                                            {q.options.map((opt: string, i: number) => (
                                                <span key={i} className={i === q.correct_index ? 'text-green-400 font-bold' : 'text-gray-500'}>
                                                    {opt}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
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