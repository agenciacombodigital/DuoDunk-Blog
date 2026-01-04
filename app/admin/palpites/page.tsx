"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Trash2, Edit, Save, X, Loader2, ArrowLeft, BrainCircuit, CheckSquare, Square } from 'lucide-react';
import Link from 'next/link';

export default function AdminPalpites() {
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    loadPalpites();
  }, []);

  const loadPalpites = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('daily_games')
      .select('*, predictions(*)')
      .order('date', { ascending: false })
      .limit(50);
    
    if (error) toast.error("Erro ao carregar palpites");
    else setGames(data || []);
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Deletar este palpite?")) return;
    const { error } = await supabase.from('daily_games').delete().eq('id', id);
    if (error) toast.error("Erro ao deletar");
    else {
      toast.success("Deletado!");
      loadPalpites();
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Deletar ${selectedIds.length} palpites selecionados?`)) return;
    
    const { error } = await supabase.from('daily_games').delete().in('id', selectedIds);
    if (error) toast.error("Erro ao deletar em massa");
    else {
      toast.success("Palpites deletados!");
      setSelectedIds([]);
      loadPalpites();
    }
  };

  const startEdit = (game: any) => {
    const palpite = game.predictions[0];
    setEditingId(game.id);
    setEditForm({
      id: palpite.id,
      title: palpite.prediction_title,
      analysis: palpite.prediction_analysis,
      score: palpite.confidence_score
    });
  };

  const saveEdit = async () => {
    const { error } = await supabase
      .from('predictions')
      .update({
        prediction_title: editForm.title,
        prediction_analysis: editForm.analysis,
        confidence_score: editForm.score
      })
      .eq('id', editForm.id);

    if (error) toast.error("Erro ao salvar");
    else {
      toast.success("Palpite atualizado!");
      setEditingId(null);
      loadPalpites();
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition">
              <ArrowLeft size={20} />
            </Link>
            <h1 className="text-3xl font-bebas flex items-center gap-2">
              <BrainCircuit className="text-pink-500" /> Gerenciar Palpites IA
            </h1>
          </div>
          
          {selectedIds.length > 0 && (
            <button 
              onClick={handleBulkDelete}
              className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition"
            >
              <Trash2 size={18} /> Deletar Selecionados ({selectedIds.length})
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-pink-500" size={40} /></div>
        ) : (
          <div className="grid gap-4">
            {games.map(game => {
              const palpite = game.predictions?.[0];
              const isEditing = editingId === game.id;
              const isSelected = selectedIds.includes(game.id);

              if (!palpite) return null;

              return (
                <div key={game.id} className={`bg-gray-800 border rounded-xl p-6 transition-colors ${isSelected ? 'border-pink-500 bg-gray-800/80' : 'border-gray-700'}`}>
                  <div className="flex gap-4">
                    <button onClick={() => toggleSelect(game.id)} className="mt-1 text-gray-500 hover:text-pink-500 transition">
                      {isSelected ? <CheckSquare size={24} className="text-pink-500" /> : <Square size={24} />}
                    </button>

                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-4">
                          <img src={game.visitor_team_logo} className="w-8 h-8 object-contain" />
                          <span className="font-oswald uppercase text-lg">{game.visitor_team_name} @ {game.home_team_name}</span>
                          <img src={game.home_team_logo} className="w-8 h-8 object-contain" />
                          <span className="text-xs text-gray-500 font-mono bg-black px-2 py-1 rounded">
                            {new Date(game.date).toLocaleDateString('pt-BR')}
                          </span>
                        </div>

                        {!isEditing && (
                          <div className="flex gap-2">
                            <button onClick={() => startEdit(game)} className="p-2 bg-blue-600/20 text-blue-400 rounded hover:bg-blue-600 hover:text-white transition"><Edit size={16} /></button>
                            <button onClick={() => handleDelete(game.id)} className="p-2 bg-red-600/20 text-red-400 rounded hover:bg-red-600 hover:text-white transition"><Trash2 size={16} /></button>
                          </div>
                        )}
                      </div>

                      {isEditing ? (
                        <div className="space-y-4 bg-black/30 p-4 rounded-lg">
                          <input 
                            className="w-full bg-gray-900 border border-gray-700 p-2 rounded text-white font-oswald uppercase"
                            value={editForm.title}
                            onChange={e => setEditForm({...editForm, title: e.target.value})}
                          />
                          <textarea 
                            className="w-full bg-gray-900 border border-gray-700 p-2 rounded text-sm text-gray-300 h-24"
                            value={editForm.analysis}
                            onChange={e => setEditForm({...editForm, analysis: e.target.value})}
                          />
                          <div className="flex items-center gap-4">
                            <label className="text-xs font-bold text-gray-500 uppercase">Confiança (%):</label>
                            <input 
                              type="number"
                              className="bg-gray-900 border border-gray-700 p-2 rounded w-20"
                              value={editForm.score}
                              onChange={e => setEditForm({...editForm, score: parseInt(e.target.value)})}
                            />
                            <div className="flex-1" />
                            <button onClick={() => setEditingId(null)} className="px-4 py-2 text-gray-400 hover:text-white">Cancelar</button>
                            <button onClick={saveEdit} className="bg-green-600 px-6 py-2 rounded font-bold flex items-center gap-2"><Save size={16}/> Salvar</button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <h3 className="text-xl font-oswald font-bold text-white mb-2 uppercase">{palpite.prediction_title}</h3>
                          <p className="text-sm text-gray-400 italic mb-4">"{palpite.prediction_analysis}"</p>
                          <div className="flex items-center gap-2">
                             <div className="h-1.5 flex-1 bg-gray-700 rounded-full overflow-hidden">
                                <div className="h-full bg-pink-500" style={{ width: `${palpite.confidence_score}%` }} />
                             </div>
                             <span className="text-[10px] font-bold text-pink-500">{palpite.confidence_score}%</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}