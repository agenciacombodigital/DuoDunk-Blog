"use client";
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { BrainCircuit, Save, RefreshCw, AlertTriangle, CheckCircle, Copy, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function QuizLab() {
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  // Prompt Baseado nas regras do especialista
  const BASE_PROMPT = `
    ATUE COMO UM ESPECIALISTA SUPREMO EM NBA.
    Sua tarefa é gerar um ARRAY JSON com 50 perguntas de quiz sobre a NBA.
    
    REGRAS ESTRUTURAIS (CRÍTICO):
    1. A saída deve ser APENAS o Array JSON puro. Sem markdown, sem \`\`\`json, sem texto antes ou depois.
    2. Formato de cada objeto:
       {
         "level": (inteiro 1-4),
         "question": "Texto da pergunta em PT-BR",
         "options": ["Opção A", "Opção B", "Opção C", "Opção D"],
         "correct_index": (inteiro 0-3),
         "category": "Categoria curta"
       }

   NÍVEL 1: Fatos óbvios, lendas famosas, jogadores populares, regras básicas
Categorias:

Lendas históricas conhecidas (Jordan, LeBron, Kobe, Magic, Bird, Shaq)

Superstars atuais e recentes (Curry, Durant, Giannis, Jokic, Luka, Embiid, Tatum)

Jogadores populares da atualidade (Shai, Harden, Westbrook, Kawhi, Anthony Davis)

Regras básicas do jogo (quantos jogadores, duração do jogo, pontos por arremesso)

Times famosos e suas cidades

Recordes conhecidos e populares (mais pontos em um jogo, mais títulos, MVP)

Curiosidades populares sobre a NBA

Apelidos óbvios de jogadores famosos (Chef Curry, Slim Reaper, The Greek Freak)

NÍVEL 2: Recordes conhecidos, campeões recentes, apelidos
Categorias:

Campeões da última década

Apelidos famosos de jogadores (The King, Black Mamba, Greek Freak)

Recordes de equipes (sequências de vitórias, playoffs)

MVPs recentes e All-Stars

Rivalidades históricas conhecidas

Jogadores brasileiros na NBA (Nenê, Leandrinho, Tiago Splitter, Anderson Varejão)

Curiosidades sobre arenas e franquias

Celebridades famosas ligadas à NBA (Drake e Raptors, Jay-Z e Nets, Spike Lee e Knicks)

Curiosidades engraçadas conhecidas (momentos virais, memes famosos)

Filmes famosos sobre NBA (Space Jam, Coach Carter, He Got Game)

Jogadores que atuaram em filmes conhecidos (LeBron, Shaq, Kareem)

NÍVEL 3: Estatísticas específicas, história anos 60/70/80/90, trocas
Categorias:

Era anos 60 (Celtics de Russell, Wilt Chamberlain, Jerry West)

Era anos 70 (Kareem Abdul-Jabbar, rivalidades ABA-NBA, Dr. J)

Era anos 80 (Magic vs Bird, Lakers-Celtics, Bad Boys Pistons)

Era anos 90 (Jordan e Bulls, Hakeem e Rockets, Stockton e Malone)

Trocas históricas famosas

Estatísticas específicas (triplo-duplos, eficiência)

Acontecimentos históricos marcantes (The Decision, Lakers-Celtics Finals)

Jogadas históricas famosas (último arremesso de Jordan, block do LeBron)

Jogos históricos (63 pontos do Jordan nos playoffs, 81 do Kobe, 100 do Wilt)

Regras que mudaram ao longo do tempo

Jogadores brasileiros menos conhecidos (Marcelinho Huertas, Raul Neto, Cristiano Felício)

Celebridades com histórias específicas (Jack Nicholson presença nos jogos, fãs famosos de times específicos)

Curiosidades engraçadas mais específicas (declarações polêmicas, rivalidades inusitadas)

Filmes e documentários específicos (The Last Dance, More Than a Game)

Participações específicas em filmes (Kareem em Airplane, Ray Allen em He Got Game)

Produções cinematográficas de jogadores (LeBron como produtor, documentários)

NÍVEL 4: Fatos obscuros, role players, ABA, drafts antigos
Categorias:

História da ABA (fusão, jogadores, regras diferentes)

Role players importantes em conquistas

Drafts antigos (picks surpreendentes, busts históricos)

Fatos obscuros e pouco conhecidos

Regras antigas e modificações técnicas detalhadas

Acontecimentos históricos obscuros (greves, mudanças de franquias, casos judiciais)

Jogadores de outras nacionalidades com histórias únicas e raras

Estatísticas raras e recordes obscuros

Detalhes técnicos de jogadas históricas menos conhecidas

Curiosidades ultra-específicas que só fãs hardcore sabem

IMPORTANTE:
Use Português do Brasil em todas as perguntas

NÃO repita perguntas óbvias (ex: quem é o logo da NBA)

Varie os times e as eras históricas

Misture as categorias dentro de cada nível

Nível 1: Foque em jogadores que qualquer fã casual reconhece (incluindo geração atual)

Nível 3: Cubra todas as décadas importantes (60s, 70s, 80s, 90s) com jogadores e fatos marcantes

Filmes Nível 2: produções famosas e óbvias (Space Jam, Coach Carter)

Filmes Nível 3: documentários específicos, participações detalhadas, produções menos mainstream
  `;

  const generateQuestions = async (level: number | 'mixed') => {
    if (!apiKey) return toast.error("Insira sua API Key do Gemini primeiro!");
    
    setLoading(true);
    setGeneratedQuestions([]);
    
    const levelText = level === 'mixed' 
      ? "Misture os níveis 1, 2, 3 e 4 equitativamente." 
      : `Gere APENAS perguntas de Nível ${level}.`;

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: `${BASE_PROMPT}\n\nCOMANDO ATUAL: Gere 50 perguntas. ${levelText}` }]
          }],
          generationConfig: {
            temperature: 0.7, // Criatividade para não repetir
            maxOutputTokens: 8192,
          }
        })
      });

      const data = await response.json();
      
      if (data.error) throw new Error(data.error.message);
      
      let rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      
      // 1. Limpeza do JSON (Remove ```json e ```)
      rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      
      // 2. Sanitização para corrigir concatenação de arrays (se houver)
      rawText = rawText.replace(/\]\s*\[/g, ',');
      
      // 3. Correção de vírgulas trailing (se houver)
      rawText = rawText.replace(/,\s*\]/g, ']');

      let parsed;
      try {
          parsed = JSON.parse(rawText);
      } catch (parseError) {
          // Tenta envolver em colchetes se for uma lista de objetos separados por vírgula/quebra de linha
          if (!rawText.trim().startsWith('[')) {
              rawText = `[${rawText.trim().replace(/,\s*$/, '')}]`;
              parsed = JSON.parse(rawText);
          } else {
              throw parseError;
          }
      }
      
      if (!Array.isArray(parsed)) throw new Error("A IA não retornou uma lista válida.");

      // Adiciona sequence_num temporário e validação básica
      const questionsWithIds = parsed.filter(q => 
          q.question && 
          Array.isArray(q.options) && 
          q.options.length === 4 && 
          q.correct_index !== undefined && 
          q.correct_index >= 0 && 
          q.correct_index <= 3
      ).map((q, i) => ({
        ...q,
        sequence_num: Date.now() + i
      }));
      
      if (questionsWithIds.length === 0) {
          throw new Error("Nenhuma pergunta válida foi gerada ou o formato JSON estava incorreto.");
      }

      setGeneratedQuestions(questionsWithIds);
      toast.success(`${questionsWithIds.length} perguntas geradas! Revise e salve.`);

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
        // Inserir em lote
        const { error } = await supabase.from('milhao_questions').insert(generatedQuestions);
        
        if (error) throw error;

        toast.success("Sucesso! Perguntas adicionadas ao jogo.");
        setGeneratedQuestions([]); // Limpa a tela
    } catch (error: any) {
        toast.error("Erro ao salvar no banco: " + error.message);
    } finally {
        setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bebas text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
            🤖 NBA QuizLab <span className="text-sm text-gray-400 font-sans ml-2">(Gerador IA)</span>
            </h1>
            <Link href="/admin/quiz" className="text-gray-400 hover:text-white flex items-center gap-2"><ArrowLeft className="w-4 h-4"/> Voltar</Link>
        </div>

        {/* CONFIGURAÇÃO API */}
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 mb-8">
            <label className="block text-sm font-bold text-gray-400 mb-2">Google Gemini API Key</label>
            <input 
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Cole sua chave aqui (começa com AIza...)"
                className="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:border-purple-500 outline-none"
            />
            <p className="text-xs text-gray-500 mt-2">A chave não é salva permanentemente por segurança. Cole a cada uso.</p>
        </div>

        {/* BOTÕES DE GERAÇÃO */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <button onClick={() => generateQuestions(1)} disabled={loading || !apiKey} className="p-4 bg-green-900/50 border border-green-500/50 hover:bg-green-500/20 rounded-xl font-bold text-green-400 transition flex flex-col items-center gap-2 disabled:opacity-50">
                {loading ? <RefreshCw className="animate-spin"/> : "Gerar Nível 1"}
                <span className="text-xs opacity-70">Fácil</span>
            </button>
            <button onClick={() => generateQuestions(2)} disabled={loading || !apiKey} className="p-4 bg-blue-900/50 border border-blue-500/50 hover:bg-blue-500/20 rounded-xl font-bold text-blue-400 transition flex flex-col items-center gap-2 disabled:opacity-50">
                {loading ? <RefreshCw className="animate-spin"/> : "Gerar Nível 2"}
                <span className="text-xs opacity-70">Médio</span>
            </button>
            <button onClick={() => generateQuestions(3)} disabled={loading || !apiKey} className="p-4 bg-orange-900/50 border border-orange-500/50 hover:bg-orange-500/20 rounded-xl font-bold text-orange-400 transition flex flex-col items-center gap-2 disabled:opacity-50">
                {loading ? <RefreshCw className="animate-spin"/> : "Gerar Nível 3"}
                <span className="text-xs opacity-70">Difícil</span>
            </button>
            <button onClick={() => generateQuestions(4)} disabled={loading || !apiKey} className="p-4 bg-red-900/50 border border-red-500/50 hover:bg-red-500/20 rounded-xl font-bold text-red-400 transition flex flex-col items-center gap-2 disabled:opacity-50">
                {loading ? <RefreshCw className="animate-spin"/> : "Gerar Nível 4"}
                <span className="text-xs opacity-70">Milhão</span>
            </button>
            <button onClick={() => generateQuestions('mixed')} disabled={loading || !apiKey} className="p-4 bg-purple-900/50 border border-purple-500/50 hover:bg-purple-500/20 rounded-xl font-bold text-purple-400 transition flex flex-col items-center gap-2 disabled:opacity-50">
                {loading ? <RefreshCw className="animate-spin"/> : "Gerar Misto"}
                <span className="text-xs opacity-70">Todos</span>
            </button>
        </div>

        {/* ÁREA DE REVISÃO E SALVAMENTO */}
        {generatedQuestions.length > 0 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <CheckCircle className="text-green-500" />
                        {generatedQuestions.length} Perguntas Geradas
                    </h2>
                    <button 
                        onClick={saveToDatabase} 
                        disabled={saving}
                        className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-bold flex items-center gap-2 transition shadow-lg shadow-green-900/20 disabled:opacity-50"
                    >
                        {saving ? <RefreshCw className="w-5 h-5 animate-spin"/> : <Save className="w-5 h-5" />}
                        SALVAR TUDO NO BANCO
                    </button>
                </div>

                <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden max-h-[500px] overflow-y-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-900 text-gray-400 uppercase font-bold sticky top-0">
                            <tr>
                                <th className="p-4">Nível</th>
                                <th className="p-4">Pergunta</th>
                                <th className="p-4">Resp. Correta</th>
                                <th className="p-4">Categoria</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {generatedQuestions.map((q, idx) => (
                                <tr key={idx} className="hover:bg-gray-700/50">
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                                            q.level === 1 ? 'bg-green-900 text-green-300' :
                                            q.level === 2 ? 'bg-blue-900 text-blue-300' :
                                            q.level === 3 ? 'bg-orange-900 text-orange-300' :
                                            'bg-red-900 text-red-300'
                                        }`}>NV {q.level}</span>
                                    </td>
                                    <td className="p-4 font-medium">{q.question}</td>
                                    <td className="p-4 text-gray-300">{q.options[q.correct_index]}</td>
                                    <td className="p-4 text-gray-400">{q.category}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                
                <div className="mt-4 p-4 bg-yellow-900/20 border border-yellow-700/50 rounded-lg flex gap-3 text-yellow-200 text-sm">
                    <AlertTriangle className="shrink-0" />
                    <p>Revise as perguntas acima. Se estiverem boas, clique em "Salvar Tudo". Se não, gere novamente (isso apagará a lista atual da tela, mas não do banco).</p>
                </div>
            </div>
        )}
      </div>
    </div>
  );
}