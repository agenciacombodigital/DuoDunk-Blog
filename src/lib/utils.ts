import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getObjectPositionClass(focalPoint?: string | null): string {
  switch (focalPoint) {
    case 'top':
      return 'object-top';
    case 'bottom':
      return 'object-bottom';
    case 'center':
    default:
      return 'object-center';
  }
}