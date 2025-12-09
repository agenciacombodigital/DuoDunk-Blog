"use client";

import { cn } from '@/lib/utils';
import { Clock } from 'lucide-react';

interface MilhaoTimerProps {
  time: number;
  initialTime: number;
}

export default function MilhaoTimer({ time, initialTime }: MilhaoTimerProps) {
  const percentage = (time / initialTime) * 100;
  
  let colorClass = 'bg-green-500';
  let pulseClass = '';

  if (time < 20) {
    colorClass = 'bg-yellow-500';
  }
  if (time < 10) {
    colorClass = 'bg-red-600';
    pulseClass = 'animate-pulse';
  }

  return (
    <div className="w-full max-w-md mx-auto mb-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-bold text-gray-300 flex items-center gap-1">
          <Clock size={16} className={cn(colorClass, 'text-white rounded-full p-0.5', pulseClass)} />
          Tempo Restante
        </span>
        <span className={cn("text-2xl font-bebas tabular-nums", colorClass, pulseClass)}>
          {time.toString().padStart(2, '0')}s
        </span>
      </div>
      <div className="w-full h-3 bg-zinc-800 rounded-full overflow-hidden">
        <div 
          className={cn("h-full transition-all duration-1000 ease-linear", colorClass, pulseClass)}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}