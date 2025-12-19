"use client";
import { useState, useRef, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Upload, Plus, FileJson, AlertCircle, ArrowLeft, Settings, BrainCircuit, Search, Loader2, Download, Trash2, AlertTriangle, Server, CheckCircle, Play } from 'lucide-react';
import Link from 'next/link';
import { Question } from '@/lib/milhao-data';
import QuestionTable from '@/components/admin/quiz/QuestionTable';
import EditQuestionModal from '@/components/admin/quiz/EditQuestionModal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const QUESTIONS_PER_PAGE = 10;

// Tipagem para o resultado da auditoria
interface AuditQuestion {
  id: string;
  question: string;
}

export default function QuizAdmin() {
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [generatedQuestions, setGeneratedQuestions] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // --- ESTADOS DE AUDITORIA ---
  const [auditResults, setAuditResults] = useState<AuditQuestion[][]>([]);
  const [isAuditing, setIsAuditing] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [auditProgress, setAuditProgress] = useState(""); // Novo estado de progresso
  
  // Estados Novos para controle manual
  const [auditOffset, setAuditOffset] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  
  // --- NOVO ESTADO DE SELEÇÃO ---
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  // Form State (for manual entry)
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
  
  // --- Data Fetching ---
  const fetchQuestions = useCallback(async (page: number, search: string) => {
    setLoading(true);
    try {
      const from = (page - 1) * QUESTIONS_PER_PAGE;
      const to = from + QUESTIONS_PER_PAGE - 1;
      
      let query = supabase
        .from('milhao_questions')
        .select('*', { count: 'exact' })
        .order('level', { ascending: true })
        .order('sequence_num', { ascending: false });
        
      if (search) {
        query = query.ilike('question', `%${search}%`);
      }
      
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;
      
      setQuestions(data as Question[] || []);
      setTotalCount(count || 0);
      setCurrentPage(page);
      setSelectedIds([]); // Limpa a seleção ao mudar de página/busca

    } catch (error: any) {
      toast.error("Erro ao carregar perguntas: " + error.message);
    } finally {
      setLoading(false);
    }
  }, []);
  
  useEffect(() => {
    // Pequeno delay para evitar spam de requisições ao digitar
    const handler = setTimeout(() => {
      fetchQuestions(currentPage, searchTerm);
    }, 300);
    
    return () => clearTimeout(handler);
  }, [fetchQuestions, searchTerm, currentPage]);
  
  const totalPages = Math.ceil(totalCount / QUESTIONS_PER_PAGE);
  
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Resetar para a primeira página ao pesquisar
  };
  
  // --- Lógica de Seleção ---
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
        prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === questions.length && questions.length > 0) {
        setSelectedIds([]); // Desmarca tudo
    } else {
        setSelectedIds(questions.map(q => q.id)); // Marca tudo
    }
  };
  
  // --- Lógica de Download de Selecionados ---
  const handleDownload = () => {
    if (selectedIds.length === 0) return toast.error("Selecione pelo menos uma pergunta para exportar.");

    // Filtra e limpa os dados para o formato de importação
    const dataToExport = questions
        .filter(q => selectedIds.includes(q.id))
        .map(({ level, question, options, correct_index, category }) => ({
            level, 
            question, 
            options, 
            correct_index, 
            category
        }));

    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `perguntas-nba-exportadas-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success(`${dataToExport.length} perguntas baixadas!`);
    setSelectedIds([]);
  };
  
  // --- Lógica de Download da Base Completa ---
  const handleDownloadAll = async () => {
    const confirm = window.confirm("Deseja baixar TODAS as perguntas do banco de dados? Isso pode levar alguns segundos.");
    if (!confirm) return;

    try {
        toast.info("Gerando arquivo de backup...");
        
        // Busca TUDO sem limite de paginação, selecionando apenas os campos necessários
        const { data, error } = await supabase
            .from('milhao_questions')
            .select('level, question, options, correct_index, category')
            .order('id', { ascending: true }); 

        if (error) throw error;
        if (!data || data.length === 0) return toast.error("Nenhuma pergunta encontrada.");

        // Gera o JSON limpo
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup-milhao-nba-completo-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        toast.success(`Arquivo gerado com sucesso! (${data.length} perguntas)`);

    } catch (error: any) {
        console.error(error);
        toast.error("Erro ao baixar a base completa.", { description: error.message });
    }
  };
  
  // --- Ações da Tabela ---
  const handleEdit = (question: Question) => {
    setEditingQuestion(question);
    setShowEditModal(true);
  };
  
  const handleDelete = async (id: string) => {
    if (!window.confirm("Tem certeza que deseja excluir esta pergunta?")) return;
    
    const toastId = toast.loading("Excluindo pergunta...");
    try {
      const { error } = await supabase
        .from('milhao_questions')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      toast.success("Pergunta excluída com sucesso!", { id: toastId });
      fetchQuestions(currentPage, searchTerm); // Recarrega a lista
    } catch (error: any) {
      toast.error("Erro ao excluir: " + error.message, { id: toastId });
    }
  };

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
      fetchQuestions(1, searchTerm); // Recarrega a primeira página
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
        
        let sanitizedText = rawText.replace(/\]\s*\[/g, ',');

        let json;
        try {
            json = JSON.parse(sanitizedText);
        } catch (parseError) {
            if (!sanitizedText.trim().startsWith('[')) {
                sanitizedText = `[${sanitizedText.trim().replace(/,\s*$/, '')}]`;
                json = JSON.parse(sanitizedText);
            } else {
                throw parseError;
            }
        }

        if (!Array.isArray(json)) throw new Error("O arquivo deve conter uma lista (array) de perguntas.");

        const questionsToInsert = json.map((item: any, index) => ({
          level: item.level || 1,
          sequence_num: Date.now() + index,
          question: item.question,
          options: item.options,
          correct_index: item.correct_index,
          category: item.category || 'Geral'
        }));

        if (questionsToInsert.some(q => !q.question || !q.options || q.options.length !== 4 || q.correct_index === undefined || q.correct_index < 0 || q.correct_index > 3)) {
            throw new Error("Formato inválido. Verifique se todas as perguntas têm texto, 4 opções e um índice correto (0-3).");
        }

        toast.loading(`Inserindo ${questionsToInsert.length} perguntas em lote...`, { id: toastId });
        
        const { error } = await supabase
            .from('milhao_questions')
            .upsert(questionsToInsert, { 
                onConflict: 'question', 
                ignoreDuplicates: true 
            });

        if (error) throw error;

        toast.success("Importação concluída! Perguntas novas foram adicionadas (duplicatas ignoradas).", { id: toastId });
        if (fileInputRef.current) fileInputRef.current.value = '';
        fetchQuestions(1, searchTerm); // Recarrega a primeira página
      } catch (error: any) {
        console.error(error);
        toast.error("Erro na importação: " + error.message, { id: toastId });
      } finally {
        setLoading(false);
      }
    };

    reader.readAsText(file);
  };
  
  // --- FUNÇÃO 3: GERAR PERGUNTAS IA (Mantida) ---
  const generateQuestions = async (level: number | 'mixed') => {
    setLoading(true);
    setGeneratedQuestions([]);
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

  const saveGeneratedToDatabase = async () => {
    if (generatedQuestions.length === 0) return;
    setSaving(true);
    try {
        const { error } = await supabase
            .from('milhao_questions')
            .upsert(generatedQuestions, { onConflict: 'question', ignoreDuplicates: true });

        if (error) throw error;
        
        toast.success("Processado! Perguntas novas foram salvas (duplicatas ignoradas).");
        setGeneratedQuestions([]); 
        fetchQuestions(1, searchTerm); // Recarrega a primeira página
    } catch (error: any) {
        toast.error("Erro ao salvar: " + error.message);
    } finally {
        setSaving(false);
    }
  };
  
  // --- FUNÇÕES DE AUDITORIA (SMART AUDIT - PASSO A PASSO) ---
  
  const runAuditStep = async () => {
    setIsAuditing(true);
    const limit = 100;

    try {
        // Se for o início, limpa os resultados anteriores
        if (auditOffset === 0) {
            setAuditResults([]);
            setIsFinished(false);
            toast.info("Iniciando auditoria...");
        }

        setAuditProgress(`Analisando lote ${auditOffset} até ${auditOffset + limit}...`);

        const { data, error } = await supabase.functions.invoke('analyze-duplicates', {
            body: { offset: auditOffset, limit }
        });

        if (error || data?.error) {
            throw new Error(error?.message || data?.error);
        }

        const { duplicates, hasMore, nextOffset } = data;

        // Adiciona novos conflitos encontrados à lista existente
        if (duplicates && duplicates.length > 0) {
            setAuditResults(prev => [...prev, ...duplicates]);
            toast.warning(`Encontradas ${duplicates.length} duplicatas neste lote!`);
        } else {
            toast.success(`Lote limpo. Nenhuma duplicata.`, { duration: 1500 });
        }

        // Prepara o próximo passo
        if (hasMore) {
            setAuditOffset(nextOffset);
        } else {
            setIsFinished(true);
            setAuditOffset(0); // Reseta para a próxima vez
            toast.success("🏁 Auditoria Completa em todo o banco de dados!");
        }

    } catch (err: any) {
        console.error(err);
        toast.error("Erro no lote. Tente clicar em 'Continuar' novamente.");
    } finally {
        setIsAuditing(false);
        setAuditProgress("");
    }
  };
  
  const resolveConflictGroup = async (groupIdx: number, questionsToKeep: AuditQuestion[]) => {
    if (questionsToKeep.length === 0) {
        toast.error("Você deve manter pelo menos uma pergunta no grupo.");
        return;
    }
    
    setResolving(true);
    const toastId = toast.loading(`Resolvendo conflito #${groupIdx + 1}...`);
    
    try {
        const group = auditResults[groupIdx];
        const idsToKeep = questionsToKeep.map(q => q.id);
        const idsToDelete = group.filter(q => !idsToKeep.includes(q.id)).map(q => q.id);
        
        if (idsToDelete.length === 0) {
            toast.info("Nenhuma pergunta para deletar neste grupo.", { id: toastId });
        } else {
            // Deleta as perguntas não selecionadas
            const { error } = await supabase
                .from('milhao_questions')
                .delete()
                .in('id', idsToDelete);
                
            if (error) throw error;
            
            toast.success(`${idsToDelete.length} perguntas deletadas!`, { id: toastId });
        }
        
        // Remove o grupo resolvido
        setAuditResults(prev => prev.filter((_, i) => i !== groupIdx));
        fetchQuestions(currentPage, searchTerm); // Recarrega a lista
        
    } catch (error: any) {
        toast.error("Erro ao resolver conflito", { id: toastId, description: error.message });
    } finally {
        setResolving(false);
    }
  };
  
  // --- COMPONENTE DO MODAL DE AUDITORIA ---
  const AuditModal = () => {
    const [selectedToKeep, setSelectedToKeep] = useState<Record<number, string[]>>({}); // { groupIndex: [id1, id2] }
    
    useEffect(() => {
        // Inicializa o estado de seleção: mantém a primeira de cada grupo por padrão
        const initialSelection: Record<number, string[]> = {};
        auditResults.forEach((group, index) => {
            if (group.length > 0) {
                initialSelection[index] = [group[0].id];
            }
        });
        setSelectedToKeep(initialSelection);
    }, [auditResults]);
    
    const toggleKeep = (groupIdx: number, questionId: string) => {
        setSelectedToKeep(prev => {
            const current = prev[groupIdx] || [];
            if (current.includes(questionId)) {
                // Se for o último, não permite desmarcar
                if (current.length > 1) {
                    return { ...prev, [groupIdx]: current.filter(id => id !== questionId) };
                }
                return prev;
            } else {
                return { ...prev, [groupIdx]: [...current, questionId] };
            }
        });
    };
    
    const handleResolveAll = async () => {
        if (resolving) return;
        
        const groupsToResolve = auditResults.map((group, groupIdx) => ({
            groupIdx,
            questionsToKeep: group.filter(q => selectedToKeep[groupIdx]?.includes(q.id))
        }));
        
        setResolving(true);
        const totalGroups = groupsToResolve.length;
        let resolvedCount = 0;
        
        for (const { groupIdx, questionsToKeep } of groupsToResolve) {
            try {
                const group = auditResults.find((_, i) => i === groupIdx);
                if (!group) continue;
                
                const idsToKeep = questionsToKeep.map(q => q.id);
                const idsToDelete = group.filter(q => !idsToKeep.includes(q.id)).map(q => q.id);
                
                if (idsToDelete.length > 0) {
                    const { error } = await supabase
                        .from('milhao_questions')
                        .delete()
                        .in('id', idsToDelete);
                        
                    if (error) throw error;
                }
                resolvedCount++;
            } catch (error) {
                console.error(`Falha ao resolver grupo ${groupIdx}:`, error);
                toast.error(`Falha ao resolver grupo ${groupIdx + 1}.`);
            }
        }
        
        setAuditResults([]);
        fetchQuestions(currentPage, searchTerm);
        toast.success(`✅ ${resolvedCount} de ${totalGroups} grupos resolvidos!`);
        setResolving(false);
    };

    return (
      <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setAuditResults([])}>
        <div className="bg-gray-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-auto border border-gray-700 shadow-2xl animate-in zoom-in duration-300" onClick={(e) => e.stopPropagation()}>
          <div className="sticky top-0 bg-gray-900 p-6 border-b border-gray-700 flex justify-between items-center">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2 font-oswald uppercase"><AlertTriangle className="w-6 h-6 text-red-400" /> Auditoria de Duplicidade ({auditResults.length})</h2>
            <button onClick={() => setAuditResults([])} className="p-2 hover:bg-gray-800 rounded-full transition-colors"><X className="w-6 h-6 text-gray-400 hover:text-white" /></button>
          </div>
          
          <div className="p-6 space-y-6">
            <div className="bg-red-900/20 border border-red-500/30 p-4 rounded-xl text-sm text-red-300 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p>A IA identificou perguntas que significam a mesma coisa. Selecione a(s) versão(ões) que você deseja MANTER. As não selecionadas serão DELETADAS permanentemente.</p>
            </div>
            
            {auditResults.map((group, groupIdx) => (
              <div key={groupIdx} className="bg-gray-800 border border-gray-700 p-4 rounded-xl">
                 <p className="text-lg font-bold text-white mb-3">Conflito #{groupIdx + 1} ({group.length} perguntas)</p>
                 
                 <div className="space-y-2">
                    {group.map(q => (
                      <div key={q.id} className="flex items-center justify-between bg-gray-900 p-3 rounded-lg border border-gray-700">
                         <div className="flex items-center gap-3 flex-1">
                            <Checkbox 
                                id={`q-${q.id}`}
                                checked={selectedToKeep[groupIdx]?.includes(q.id) || false}
                                onCheckedChange={() => toggleKeep(groupIdx, q.id)}
                                className="w-5 h-5 border-gray-500 data-[state=checked]:bg-green-600 data-[state=checked]:text-white"
                                disabled={resolving || (selectedToKeep[groupIdx]?.length === 1 && selectedToKeep[groupIdx]?.includes(q.id))}
                            />
                            <label htmlFor={`q-${q.id}`} className={cn("text-gray-300 text-sm flex-1 cursor-pointer", !selectedToKeep[groupIdx]?.includes(q.id) && "line-through text-gray-500")}>
                                {q.question}
                            </label>
                         </div>
                         <span className={cn("text-xs font-mono", selectedToKeep[groupIdx]?.includes(q.id) ? "text-green-400" : "text-red-400")}>
                            {selectedToKeep[groupIdx]?.includes(q.id) ? 'MANTER' : 'DELETAR'}
                         </span>
                      </div>
                    ))}
                 </div>
              </div>
            ))}
          </div>
          
          <div className="p-6 border-t border-gray-700 flex justify-end">
            <button 
              onClick={handleResolveAll} 
              disabled={resolving} 
              className="btn-danger flex items-center justify-center gap-2 disabled:opacity-50 font-inter"
            >
              {resolving ? (<Loader2 className="w-5 h-5 animate-spin" />) : (<Trash2 className="w-5 h-5" />)}
              Resolver Todos os {auditResults.length} Conflitos
            </button>
          </div>
        </div>
      </div>
    );
  };
  // --- FIM DO COMPONENTE DO MODAL DE AUDITORIA ---


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
          <div className="flex gap-3">
            <Link 
              href="/admin/quiz-lab"
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm"
            >
              <BrainCircuit className="w-4 h-4" /> Gerar Perguntas IA
            </Link>
            <Link 
              href="/admin/quiz/settings"
              className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm"
            >
              <Settings className="w-4 h-4" /> Configurações Visuais
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* COLUNA 1: CADASTRO MANUAL */}
          <div className="bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-700 lg:col-span-1">
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
                {loading ? <Loader2 className="w-5 h-5 animate-spin"/> : 'Salvar Pergunta'}
              </button>
            </form>
          </div>

          {/* COLUNA 2: IMPORTAÇÃO EM MASSA */}
          <div className="bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-700 h-fit lg:col-span-2">
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
        
        {/* ÁREA DE PERGUNTAS GERADAS PELA IA */}
        {generatedQuestions.length > 0 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 mt-8 w-full">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold flex items-center gap-2 text-green-400"><CheckCircle /> {generatedQuestions.length} Perguntas Geradas (Aguardando Salvar)</h2>
                    <button onClick={saveGeneratedToDatabase} disabled={saving} className="bg-green-600 hover:bg-green-500 text-white px-6 py-2 rounded-lg font-bold shadow-lg flex items-center gap-2">
                        {saving ? <Loader2 className="animate-spin w-5 h-5"/> : <Save className="w-5 h-5"/>} SALVAR TUDO
                    </button>
                </div>
                {/* Reutilizando QuestionTable para exibir as perguntas geradas */}
                <QuestionTable 
                    questions={generatedQuestions as Question[]}
                    loading={false}
                    onEdit={() => toast.info("Edite após salvar no banco.")}
                    onDelete={() => toast.info("Deletar após salvar no banco.")}
                    currentPage={1}
                    totalPages={1}
                    onPageChange={() => {}}
                    selectedIds={[]}
                    onToggleSelect={() => {}}
                    onToggleSelectAll={() => {}}
                />
            </div>
        )}

        {/* TABELA DE GERENCIAMENTO */}
        <div className="mt-12 w-full">
          <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
            <h2 className="text-3xl font-bebas text-white">Gerenciamento de Perguntas ({totalCount})</h2>
            <div className="flex gap-3">
                <Button 
                  onClick={handleDownload}
                  disabled={selectedIds.length === 0 || loading}
                  className="bg-pink-600 hover:bg-pink-700 text-white font-bold flex items-center gap-2 disabled:opacity-50"
                >
                  <Download className="w-4 h-4" /> Baixar Selecionados ({selectedIds.length})
                </Button>
                <Button 
                  onClick={handleDownloadAll} 
                  disabled={loading || isAuditing}
                  className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold flex items-center gap-2 disabled:opacity-50"
                >
                  <Download className="w-4 h-4" /> 📦 Baixar Base Completa
                </Button>
                
                {/* NOVO BOTÃO DE AUDITORIA PASSO-A-PASSO */}
                <button 
                    onClick={isFinished ? () => { setAuditResults([]); setIsFinished(false); setAuditOffset(0); } : runAuditStep}
                    disabled={isAuditing}
                    className={`px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition text-white text-sm ${
                        isFinished 
                        ? "bg-green-600 hover:bg-green-700" 
                        : auditOffset === 0 
                            ? "bg-yellow-600 hover:bg-yellow-700" 
                            : "bg-blue-600 hover:bg-blue-700 animate-pulse"
                    }`}
                >
                    {isAuditing ? (
                        <><Loader2 className="w-4 h-4 animate-spin"/> Analisando...</>
                    ) : isFinished ? (
                        <><CheckCircle className="w-4 h-4"/> Auditoria Finalizada (Reiniciar)</>
                    ) : auditOffset === 0 ? (
                        <><Search className="w-4 h-4"/> Iniciar Auditoria IA</>
                    ) : (
                        <><Play className="w-4 h-4"/> Continuar (Lote {auditOffset}-{auditOffset + 100})</>
                    )}
                </button>
            </div>
          </div>
          
          {/* Barra de Progresso da Auditoria */}
          {isAuditing && auditProgress && (
            <div className="bg-yellow-900/20 border border-yellow-500/30 p-3 rounded-xl mb-4 flex items-center gap-3 text-yellow-300">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm font-medium">{auditProgress}</span>
            </div>
          )}
          
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input 
              placeholder="Buscar pergunta por texto..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="pl-9 bg-gray-800 border-gray-700 text-white focus:border-pink-500"
            />
            {loading && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-pink-500 animate-spin" />
            )}
          </div>
          
          <QuestionTable 
            questions={questions}
            loading={loading}
            onEdit={handleEdit}
            onDelete={handleDelete}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
            onToggleSelectAll={toggleSelectAll}
          />
        </div>
        
        {/* Modal de Edição */}
        <EditQuestionModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          question={editingQuestion}
          onSaveSuccess={() => fetchQuestions(currentPage, searchTerm)}
        />
        
        {/* Modal de Auditoria */}
        {auditResults.length > 0 && <AuditModal />}
      </div>
    </div>
  );
}