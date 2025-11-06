import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getObjectPositionStyle(focalPoint?: string | null): object {
  // Se não tiver focalPoint, usa padrão central
  if (!focalPoint) {
    return { objectPosition: 'center 50%' };
  }
  
  // Se for um valor percentual único (Y%), garante que o X seja 'center'
  if (focalPoint.endsWith('%') && !focalPoint.includes(' ')) {
    return { objectPosition: `center ${focalPoint}` };
  }
  
  // Se for "center" sozinho, converte para "center 50%"
  if (focalPoint.toLowerCase().trim() === 'center') {
    return { objectPosition: 'center 50%' };
  }
  
  // Retorna o focalPoint como está (para valores como "50% 30%")
  return { objectPosition: focalPoint };
}