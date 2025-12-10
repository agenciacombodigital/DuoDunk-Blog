"use client";
import { useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Upload, Plus, FileJson, AlertCircle, ArrowLeft, Settings } from 'lucide-react';
import Link from 'next/link';

export default function QuizAdmin() {
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Estado do formulário manual
  const [form, setForm] = useState({
    level: 1,
    question: '',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    correctIndex: 0,
    category: 'Geral'
  });

  // --- FUNÇÃO 1: ENVIO MANUAL ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const toastId = toast.loading("Salvando pergunta...");
    try {
      if (!form.question || !form.optionA || !form.optionB || !form.optionC || !form.optionD) {
        throw new Error("Todos os campos de pergunta e opções são obrigatórios.");
      }
      
      const { error } = await supabase.from('milhao_questions').insert({
        level: Number(form.level),
        sequence_num: Date.now(), // Timestamp como ID único sequencial
        question: form.question,
        options: [form.optionA, form.optionB, form.optionC, form.optionD],
        correct_index: Number(form.correctIndex),
        category: form.category
      });

      if (error) throw error;
      toast.success("Pergunta salva com sucesso!", { id: toastId });
      setForm({ ...form, question: '', optionA: '', optionB: '', optionC: '', optionD: '' });
    } catch (error: any) {
      toast.error("Erro ao salvar", { id: toastId, description: error.message });
    } finally {
      setLoading(false);
    }
  };

  // --- FUNÇÃO 2: IMPORTAÇÃO EM MASSA (JSON) ---
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    
    reader.onload = async (e) => {
      setLoading(true);
      const toastId = toast.loading("Processando arquivo JSON...");
      try {
        let rawText = e.target?.result as string;
        
        // 1. Sanitização: Corrige a concatenação de múltiplos arrays JSON (ex: `][` ou `] [`)
        // Isso transforma `][` em `,` para que o JSON.parse funcione em um único array.
        let sanitizedText = rawText.replace(/\]\s*\[/g, ',');

        let json;
        try {
            json = JSON.parse(sanitizedText);
        } catch (parseError) {
            // Tenta envolver em colchetes se for uma lista de objetos separados por vírgula/quebra de linha
            if (!sanitizedText.trim().startsWith('[')) {
                sanitizedText = `[${sanitizedText.trim().replace(/,\s*$/, '')}]`;
                json = JSON.parse(sanitizedText);
            } else {
                throw parseError;
            }
        }

        if (!Array.isArray(json)) throw new Error("O arquivo deve conter uma lista (array) de perguntas.");

        // Preparar dados para o Supabase
        const questionsToInsert = json.map((item: any, index) => ({
          level: item.level || 1,
          sequence_num: Date.now() + index, // Garante unicidade
          question: item.question,
          options: item.options, // Deve ser um array de 4 strings
          correct_index: item.correct_index,
          category: item.category || 'Geral'
        }));

        // Validação básica
        if (questionsToInsert.some(q => !q.question || !q.options || q.options.length !== 4 || q.correct_index === undefined || q.correct_index < 0 || q.correct_index > 3)) {
            throw new Error("Formato inválido. Verifique se todas as perguntas têm texto, 4 opções e um índice correto (0-3).");
        }

        toast.loading(`Inserindo ${questionsToInsert.length} perguntas em lote...`, { id: toastId });
        
        // Inserir em lote (Batch Insert)
        const { error } = await supabase.from('milhao_questions').insert(questionsToInsert);

        if (error) throw error;

        toast.success(`${questionsToInsert.length} perguntas importadas com sucesso!`, { id: toastId });
        if (fileInputRef.current) fileInputRef.current.value = ''; // Limpar input

      } catch (error: any) {
        console.error(error);
        toast.error("Erro na importação: " + error.message, { id: toastId });
      } finally {
        setLoading(false);
      }
    };

    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <Link
          href="/admin"
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition"
        >
          <ArrowLeft className="w-5 h-5" />
          Voltar para Admin
        </Link>
        
        <div className="flex justify-between items-center mb-8 border-b pb-4 border-gray-700">
          <h1 className="text-4xl font-bebas text-white">
            Gerenciar Perguntas - Milhão NBA
          </h1>
          <Link 
            href="/admin/quiz/settings"
            className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm"
          >
            <Settings className="w-4 h-4" /> Configurações Visuais
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* COLUNA 1: CADASTRO MANUAL */}
          <div className="bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-700">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-green-400">
              <Plus className="w-5 h-5"/> Nova Pergunta Manual
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-1">Nível (1-4)</label>
                <select 
                  className="w-full p-3 border rounded bg-gray-900 border-gray-700 text-white font-inter"
                  value={form.level}
                  onChange={e => setForm({...form, level: Number(e.target.value)})}
                >
                  <option value={1}>1 - Fácil (R$ 1k - 7k)</option>
                  <option value={2}>2 - Médio (R$ 10k - 60k)</option>
                  <option value={3}>3 - Difícil (R$ 80k - 500k)</option>
                  <option value={4}>4 - Pergunta do Milhão</option>
                </select>
              </div>

              <input 
                className="w-full p-3 border rounded bg-gray-900 border-gray-700 text-white font-inter" 
                placeholder="Texto da Pergunta"
                value={form.question}
                onChange={e => setForm({...form, question: e.target.value})}
                required
              />
              
              <div className="grid grid-cols-2 gap-2">
                <input className="p-3 border rounded bg-gray-900 border-gray-700 text-white" placeholder="Opção A" value={form.optionA} onChange={e => setForm({...form, optionA: e.target.value})} required />
                <input className="p-3 border rounded bg-gray-900 border-gray-700 text-white" placeholder="Opção B" value={form.optionB} onChange={e => setForm({...form, optionB: e.target.value})} required />
                <input className="p-3 border rounded bg-gray-900 border-gray-700 text-white" placeholder="Opção C" value={form.optionC} onChange={e => setForm({...form, optionC: e.target.value})} required />
                <input className="p-3 border rounded bg-gray-900 border-gray-700 text-white" placeholder="Opção D" value={form.optionD} onChange={e => setForm({...form, optionD: e.target.value})} required />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-300 mb-1">Resposta Correta</label>
                <select 
                  className="w-full p-3 border rounded bg-gray-900 border-gray-700 text-white"
                  value={form.correctIndex}
                  onChange={e => setForm({...form, correctIndex: Number(e.target.value)})}
                >
                  <option value={0}>Opção A</option>
                  <option value={1}>Opção B</option>
                  <option value={2}>Opção C</option>
                  <option value={3}>Opção D</option>
                </select>
              </div>
              
              <input 
                className="w-full p-3 border rounded bg-gray-900 border-gray-700 text-white font-inter" 
                placeholder="Categoria (Ex: Finais, Jogadores)"
                value={form.category}
                onChange={e => setForm({...form, category: e.target.value})}
              />

              <button disabled={loading} type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition-colors flex justify-center disabled:opacity-50">
                {loading ? 'Salvando...' : 'Salvar Pergunta'}
              </button>
            </form>
          </div>

          {/* COLUNA 2: IMPORTAÇÃO EM MASSA */}
          <div className="bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-700 h-fit">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-cyan-400">
              <Upload className="w-5 h-5"/> Importar em Massa (JSON)
            </h2>
            
            <div className="mb-6 text-sm text-gray-400 font-inter p-4 bg-gray-900 rounded-lg border border-gray-700">
              <p className="mb-2 font-bold flex items-center gap-2 text-white"><AlertCircle className="w-4 h-4 text-yellow-400"/> Formato do Arquivo:</p>
              <pre className="bg-black p-3 rounded border border-gray-700 overflow-x-auto text-xs text-green-400">
{`[
  {
    "level": 1,
    "question": "Pergunta...",
    "options": ["A", "B", "C", "D"],
    "correct_index": 0,
    "category": "História"
  }
]`}
              </pre>
            </div>

            <label className="block w-full cursor-pointer">
              <input 
                type="file" 
                accept=".json" 
                className="hidden" 
                onChange={handleFileUpload}
                ref={fileInputRef}
                disabled={loading}
              />
              <div className="w-full bg-gray-900 border-2 border-dashed border-cyan-500/50 hover:border-cyan-500 rounded-xl p-8 flex flex-col items-center justify-center transition-colors disabled:opacity-50">
                <FileJson className="w-10 h-10 text-cyan-400 mb-2" />
                <span className="text-cyan-400 font-bold">Clique para selecionar arquivo JSON</span>
                <span className="text-gray-400 text-xs mt-1">Carregar lista de perguntas</span>
              </div>
            </label>
          </div>

        </div>
      </div>
    </div>
  );
}