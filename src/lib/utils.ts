import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getObjectPositionStyle(focalPoint?: string | null): object {
  const getPosition = () => {
    if (!focalPoint) return 'center';
    if (focalPoint === 'top') return '50% 0%';
    if (focalPoint === 'center') return '50% 50%';
    if (focalPoint === 'bottom') return '50% 100%';
    if (focalPoint.endsWith('%')) return `50% ${focalPoint}`;
    return 'center';
  }
  return { objectPosition: getPosition() };
}