import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getObjectPositionStyle(focalPoint?: string | null): object {
  const getPosition = () => {
    if (!focalPoint) return 'center';
    
    // Se for um par de coordenadas (ex: '30% 70%')
    if (focalPoint.includes(' ')) return focalPoint;

    // Se for um valor percentual único (ex: '50%', '0%', '100%') - Usado para foco vertical mobile
    if (focalPoint.endsWith('%')) {
      // Assumimos que é o foco vertical (Y), mantendo o horizontal no centro (X=50%)
      return `50% ${focalPoint}`;
    }
    
    // Se for uma palavra-chave
    if (focalPoint === 'top') return '50% 0%';
    if (focalPoint === 'center') return '50% 50%';
    if (focalPoint === 'bottom') return '50% 100%';
    
    return 'center';
  }
  return { objectPosition: getPosition() };
}