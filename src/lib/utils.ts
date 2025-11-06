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

// ✅ CORREÇÃO: Função para processar focal point, agora recebe isMobileFocalPoint para saber se deve forçar 'center' para X.
export function getObjectPositionStyle(
  focalPoint?: string | null,
  isMobileFocalPoint: boolean = false
): object {
  // Se não tiver focalPoint, usa padrão central
  if (!focalPoint) {
    return { objectPosition: 'center 50%' };
  }
  
  let objectPosition: string;

  if (isMobileFocalPoint) {
    // Mobile: apenas valor Y (vertical). Ex: "50%"
    const yValue = focalPoint.trim();
    
    if (yValue.includes(' ')) {
        // Se por acaso salvou o formato desktop, usamos ele
        objectPosition = yValue;
    } else {
        // Se for o formato mobile (Y%), garantimos que o X seja 'center'
        objectPosition = `center ${yValue}`;
    }
  } else {
    // Desktop: valores X e Y. Ex: "50% 50%"
    objectPosition = focalPoint;
  }
  
  // Handle keywords like 'center', 'top', 'bottom' if they were passed
  if (objectPosition.toLowerCase().trim() === 'center') {
    objectPosition = 'center 50%';
  }
  
  return { objectPosition };
}