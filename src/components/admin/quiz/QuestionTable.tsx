"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Question } from '@/lib/milhao-data';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox'; // Importando Checkbox

interface QuestionTableProps {
  questions: Question[];
  loading: boolean;
  onEdit: (question: Question) => void;
  onDelete: (id: string) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  
  // Novos Props para Seleção
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
}

const levelMap: Record<number, string> = {
  1: 'Fácil',
  2: 'Médio',
  3: 'Difícil',
  4: 'Milhão',
};

const levelColor: Record<number, string> = {
  1: 'bg-green-500/10 text-green-400 border-green-500/30',
  2: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
  3: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
  4: 'bg-red-600/10 text-red-400 border-red-600/30',
};

export default function QuestionTable({ 
  questions, 
  loading, 
  onEdit, 
  onDelete,
  currentPage,
  totalPages,
  onPageChange,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll
}: QuestionTableProps) {
  
  const renderContent = () => {
    if (loading) {
      return (
        <TableRow>
          <TableCell colSpan={6} className="h-24 text-center text-gray-500">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-pink-500" />
            Carregando perguntas...
          </TableCell>
        </TableRow>
      );
    }

    if (questions.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={6} className="h-24 text-center text-gray-500">
            Nenhuma pergunta encontrada.
          </TableCell>
        </TableRow>
      );
    }

    return questions.map((q) => (
      <TableRow key={q.id} className="hover:bg-gray-800/50 border-gray-700">
        <TableCell className="w-10">
          <Checkbox 
            checked={selectedIds.includes(q.id)}
            onCheckedChange={() => onToggleSelect(q.id)}
            className="border-gray-500 data-[state=checked]:bg-pink-600 data-[state=checked]:text-white"
          />
        </TableCell>
        <TableCell className="font-medium text-white w-16">
          <span className={cn("px-2 py-1 rounded-full text-xs font-bold border", levelColor[q.level] || 'bg-gray-500/10 text-gray-400 border-gray-500/30')}>
            {levelMap[q.level] || 'N/D'}
          </span>
        </TableCell>
        <TableCell className="text-gray-300 max-w-xs truncate" title={q.question}>
          {q.question}
        </TableCell>
        <TableCell className="text-cyan-400 font-medium w-40">
          {q.options[q.correct_index]}
        </TableCell>
        <TableCell className="text-gray-400 w-24">
          {q.category}
        </TableCell>
        <TableCell className="w-24 text-center">
          <div className="flex gap-2 justify-center">
            <Button variant="ghost" size="icon" onClick={() => onEdit(q)} className="text-blue-400 hover:bg-blue-900/50">
              <Edit className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onDelete(q.id)} className="text-red-400 hover:bg-red-900/50">
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
    ));
  };

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-black border-gray-700">
            <TableRow>
              <TableHead className="w-10">
                <Checkbox 
                  checked={questions.length > 0 && selectedIds.length === questions.length}
                  onCheckedChange={onToggleSelectAll}
                  className="border-gray-500 data-[state=checked]:bg-pink-600 data-[state=checked]:text-white"
                />
              </TableHead>
              <TableHead className="w-16 text-gray-400">NÍVEL</TableHead>
              <TableHead className="text-gray-400">PERGUNTA</TableHead>
              <TableHead className="w-40 text-gray-400">RESPOSTA CORRETA</TableHead>
              <TableHead className="w-24 text-gray-400">CATEGORIA</TableHead>
              <TableHead className="w-24 text-gray-400 text-center">AÇÕES</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {renderContent()}
          </TableBody>
        </Table>
      </div>
      
      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center p-4 border-t border-gray-800">
          <Button
            variant="ghost"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1 || loading}
            className="text-gray-400 hover:bg-gray-700"
          >
            <ChevronLeft className="w-4 h-4" /> Anterior
          </Button>
          <span className="text-sm text-white mx-4">
            Página {currentPage} de {totalPages}
          </span>
          <Button
            variant="ghost"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages || loading}
            className="text-gray-400 hover:bg-gray-700"
          >
            Próxima <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}