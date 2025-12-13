"use client";

import { useState, useEffect } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { Question } from '@/lib/milhao-data';

interface EditQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  question: Question | null;
  onSaveSuccess: () => void;
}

export default function EditQuestionModal({ isOpen, onClose, question, onSaveSuccess }: EditQuestionModalProps) {
  const [formData, setFormData] = useState<Question | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (question) {
      setFormData(question);
    }
  }, [question]);

  if (!isOpen || !formData) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const toastId = toast.loading("Salvando pergunta...");

    try {
      if (!formData.question || formData.options.some(opt => !opt)) {
        throw new Error("Todos os campos de pergunta e opções são obrigatórios.");
      }
      
      const { error } = await supabase
        .from('milhao_questions')
        .update({
          question: formData.question,
          options: formData.options,
          correct_index: formData.correct_index,
          level: formData.level,
          category: formData.category,
        })
        .eq('id', formData.id);

      if (error) throw error;

      toast.success("Pergunta atualizada com sucesso!", { id: toastId });
      onSaveSuccess();
      onClose();
    } catch (error: any) {
      toast.error("Erro ao salvar", { id: toastId, description: error.message });
    } finally {
      setSaving(false);
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    setFormData(prev => {
      if (!prev) return null;
      const newOptions = [...prev.options];
      newOptions[index] = value;
      return { ...prev, options: newOptions };
    });
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-gray-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-auto border border-gray-700 shadow-2xl animate-in zoom-in duration-300" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-gray-900 p-6 border-b border-gray-700 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2 font-oswald uppercase">Editar Pergunta</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-full transition-colors"><X className="w-6 h-6 text-gray-400 hover:text-white" /></button>
        </div>
        
        <form onSubmit={handleSave} className="p-6 space-y-4">
          
          <div>
            <label className="block text-sm font-bold text-gray-300 mb-1">Nível</label>
            <select 
              className="w-full p-3 border rounded bg-gray-800 border-gray-700 text-white font-inter"
              value={formData.level}
              onChange={e => setFormData(prev => prev ? { ...prev, level: Number(e.target.value) } : null)}
            >
              <option value={1}>1 - Fácil (R$ 1k - 7k)</option>
              <option value={2}>2 - Médio (R$ 10k - 60k)</option>
              <option value={3}>3 - Difícil (R$ 80k - 500k)</option>
              <option value={4}>4 - Pergunta do Milhão</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-bold text-gray-300 mb-1">Categoria</label>
            <input 
              type="text"
              className="w-full p-3 border rounded bg-gray-800 border-gray-700 text-white font-inter" 
              value={formData.category || ''}
              onChange={e => setFormData(prev => prev ? { ...prev, category: e.target.value } : null)}
              placeholder="Categoria (Ex: Finais, Jogadores)"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-300 mb-1">Pergunta</label>
            <textarea 
              rows={3}
              className="w-full p-3 border rounded bg-gray-800 border-gray-700 text-white font-inter resize-none" 
              value={formData.question}
              onChange={e => setFormData(prev => prev ? { ...prev, question: e.target.value } : null)}
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {formData.options.map((option, index) => (
              <div key={index}>
                <label className="block text-sm font-bold text-gray-300 mb-1">Opção {String.fromCharCode(65 + index)}</label>
                <input 
                  type="text"
                  className="w-full p-3 border rounded bg-gray-800 border-gray-700 text-white font-inter" 
                  value={option}
                  onChange={e => handleOptionChange(index, e.target.value)}
                  required
                />
              </div>
            ))}
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-300 mb-1">Resposta Correta</label>
            <select 
              className="w-full p-3 border rounded bg-gray-800 border-gray-700 text-white"
              value={formData.correct_index}
              onChange={e => setFormData(prev => prev ? { ...prev, correct_index: Number(e.target.value) } : null)}
            >
              {formData.options.map((_, index) => (
                <option key={index} value={index}>Opção {String.fromCharCode(65 + index)}: {formData.options[index]}</option>
              ))}
            </select>
          </div>

          <div className="pt-4 border-t border-gray-700 flex justify-end">
            <button 
              type="submit" 
              disabled={saving} 
              className="btn-success flex items-center justify-center gap-2 disabled:opacity-50 font-inter"
            >
              {saving ? (<Loader2 className="w-5 h-5 animate-spin" />) : (<Save className="w-5 h-5" />)}
              Salvar Alterações
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}