import { clsx } from 'clsx';
import type { ClassValue } from 'clsx';
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function capitalize(str: string): string {
  // Handle "Efternamn, Förnamn" → "Förnamn Efternamn"
  if (str.includes(',')) {
    const [last, first] = str.split(',').map(s => s.trim());
    str = first ? `${first} ${last}` : last;
  }
  // Capitalize only the very first character of each space-separated word
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.length > 0 ? word.charAt(0).toUpperCase() + word.slice(1) : word)
    .join(' ');
}
