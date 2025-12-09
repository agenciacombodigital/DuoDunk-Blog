"use client";
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { ArrowLeft, Save, PlusCircle } from 'lucide-react';
import Link from 'next/link';

export default function QuizAdmin() {
  const [form, setForm] = useState({
    level: 1,
    question: '',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    correctIndex: 0,
    category: 'Geral',
    sequence_num: 1,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const toastId = toast.loading("Salvando pergunta...");

    try {
      if (!form.question || !form.optionA || !form.optionB || !form.optionC || !form.optionD) {
        throw new Error("Todos os campos de pergunta e opções são obrigatórios.");
      }
      
      const { error } = await supabase.from('milhao_questions').insert({
        level: form.level,
        sequence_num: form.sequence_num,
        question: form.question,
        options: [form.optionA, form.optionB, form.optionC, form.optionD],
        correct_index: form.correctIndex,
        category: form.category
      });

      if (error) throw error;
      
      toast.success("Pergunta salva com sucesso!", { id: toastId });
      // Limpa apenas os campos de texto, mantendo nível e categoria
      setForm(prev => ({ 
        ...prev, 
        question: '', 
        optionA: '', 
        optionB: '', 
        optionC: '', 
        optionD: '',
        sequence_num: prev.sequence_num + 1 // Incrementa a sequência para facilitar
      }));
      
    } catch (error: any) {
      toast.error("Erro ao salvar", { id: toastId, description: error.message });
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/admin"
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition"
        >
          <ArrowLeft className="w-5 h-5" />
          Voltar para Admin
        </Link>

        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <PlusCircle className="w-6 h-6 text-yellow-400" /> Gerenciar Perguntas - Milhão NBA
        </h1>
        <p className="text-gray-400 mb-8">
          Cadastre novas perguntas para o quiz.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6 bg-gray-800 p-6 rounded-xl border border-gray-700">
          
          {/* Nível e Sequência */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Nível de Dificuldade (1-3)</label>
              <select
                value={form.level}
                onChange={e => setForm({...form, level: parseInt(e.target.value)})}
                className="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg text-white"
              >
                <option value={1}>1 (Fácil)</option>
                <option value={2}>2 (Médio)</option>
                <option value={3}>3 (Difícil)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Categoria</label>
              <input
                type="text"
                value={form.category}
                onChange={e => setForm({...form, category: e.target.value})}
                className="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg text-white"
                placeholder="Ex: Finais, Draft, Jogadores"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Sequência (Ordem)</label>
              <input
                type="number"
                value={form.sequence_num}
                onChange={e => setForm({...form, sequence_num: parseInt(e.target.value)})}
                className="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg text-white"
                placeholder="1, 2, 3..."
              />
            </div>
          </div>

          {/* Pergunta */}
          <div>
            <label className="block text-sm font-medium mb-2">Pergunta *</label>
            <textarea
              rows={3}
              required
              value={form.question}
              onChange={e => setForm({...form, question: e.target.value})}
              className="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg text-white resize-none"
              placeholder="Qual jogador detém o recorde de mais pontos em um único jogo de playoffs?"
            />
          </div>

          {/* Opções */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {['A', 'B', 'C', 'D'].map((label, index) => (
              <div key={index} className="relative">
                <label className="block text-sm font-medium mb-2">Opção {label} *</label>
                <input
                  type="text"
                  required
                  value={form[`option${label}` as keyof typeof form] as string}
                  onChange={e => setForm({...form, [`option${label}`]: e.target.value})}
                  className="w-full p-3 bg-gray-900 border rounded-lg text-white pr-12"
                  placeholder={`Opção ${label}`}
                />
                <input
                  type="radio"
                  name="correct_option"
                  checked={form.correctIndex === index}
                  onChange={() => setForm({...form, correctIndex: index})}
                  className="absolute right-3 top-1/2 mt-1 transform -translate-y-1/2 w-5 h-5 text-green-500 bg-gray-700 border-gray-600 focus:ring-green-500 cursor-pointer"
                  title={`Marcar como Correta (${label})`}
                />
              </div>
            ))}
          </div>
          
          {/* Correta */}
          <div className="p-4 bg-green-900/30 border border-green-700/50 rounded-lg">
            <p className="text-sm font-bold text-green-400">
              Resposta Correta: Opção {['A', 'B', 'C', 'D'][form.correctIndex]}
            </p>
          </div>

          {/* Botão Submit */}
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-pink-600 hover:bg-pink-700 text-white font-bold py-4 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 transition"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Salvar Pergunta
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}