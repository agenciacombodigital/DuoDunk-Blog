import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getObjectPositionStyle(focalPoint?: string | null): object {
  if (!focalPoint) {
    return { objectPosition: 'center 40%' }; // ✅ Padrão melhor para mobile
  }
  
  // Normaliza o focalPoint para comparação
  const normalizedFocalPoint = focalPoint.toLowerCase().replace(/ /g, '');

  // Se for apenas "center", "50%", ou "center50%", ajusta para 40%
  if (normalizedFocalPoint === 'center' || normalizedFocalPoint === '50%' || normalizedFocalPoint === 'center50%') {
    return { objectPosition: 'center 40%' };
  }
  
  // Se for um valor percentual único (Y%), garante que o X seja 'center'
  if (focalPoint.endsWith('%') && !focalPoint.includes(' ')) {
    return { objectPosition: `center ${focalPoint}` };
  }
  
  return { objectPosition: focalPoint };
}