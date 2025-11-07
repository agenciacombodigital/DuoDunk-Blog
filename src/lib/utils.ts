import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Helper para converter valor de foco (X% ou Y%) para número (0-100)
export const percentageToNumber = (value: string | null | undefined): number => {
  if (!value) return 50;
  if (value.endsWith('%')) return parseInt(value.replace('%', ''));
  if (value === 'top' || value === 'left') return 0;
  if (value === 'center') return 50;
  if (value === 'bottom' || value === 'right') return 100;
  return 50;
};

// Extrai o foco horizontal (X) de uma string de posição (X% Y%)
export const getHorizontalFocalPoint = (focalPoint: string | null | undefined): number => {
  if (!focalPoint) return 50;
  const parts = focalPoint.split(' ');
  return percentageToNumber(parts[0]);
};

// Extrai o foco vertical (Y) de uma string de posição (X% Y% ou Y%)
export const getVerticalFocalPoint = (focalPoint: string | null | undefined): number => {
  if (!focalPoint) return 50;
  const parts = focalPoint.split(' ');
  // Se for um par (desktop), pegamos o segundo valor (Y)
  if (parts.length > 1) {
    return percentageToNumber(parts[1]);
  }
  // Se for apenas um valor (mobile), pegamos ele mesmo (Y)
  return percentageToNumber(parts[0]);
};

// ✅ CORREÇÃO: Função otimizada para processar focal point corretamente
export function getObjectPositionStyle(
  focalPoint?: string | null,
  isMobileFocalPoint: boolean = false
): { objectPosition: string } {
  // Se não tiver focalPoint, usa padrão central
  if (!focalPoint || focalPoint.trim() === '') {
    return { objectPosition: 'center center' };
  }
  
  const trimmedFocalPoint = focalPoint.trim();
  
  // ✅ CORREÇÃO: Tratamento especial para mobile
  if (isMobileFocalPoint) {
    // Mobile: pode ser apenas Y% (ex: "50%") ou X% Y% (ex: "center 50%")
    if (!trimmedFocalPoint.includes(' ')) {
      // Formato mobile simples: apenas Y%
      // Garante que X seja sempre 'center' para mobile
      return { objectPosition: `center ${trimmedFocalPoint}` };
    } else {
      // Se já tem espaço, usa como está (pode ser "center 50%" ou "50% 50%")
      return { objectPosition: trimmedFocalPoint };
    }
  }
  
  // Desktop: usa o valor como está
  // Se for uma palavra-chave simples como 'center', expande
  if (trimmedFocalPoint.toLowerCase() === 'center') {
    return { objectPosition: 'center center' };
  }
  
  if (trimmedFocalPoint.toLowerCase() === 'top') {
    return { objectPosition: 'center top' };
  }
  
  if (trimmedFocalPoint.toLowerCase() === 'bottom') {
    return { objectPosition: 'center bottom' };
  }
  
  // Retorna o valor formatado
  return { objectPosition: trimmedFocalPoint };
}