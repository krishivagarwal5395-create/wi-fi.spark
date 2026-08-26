
import { CardTheme } from './types';

export const CARD_THEMES: CardTheme[] = [
  {
    id: 'modern-dark',
    name: 'Midnight',
    bgClass: 'bg-slate-900',
    textClass: 'text-white',
    accentClass: 'bg-indigo-500'
  },
  {
    id: 'clean-white',
    name: 'Minimalist',
    bgClass: 'bg-white border border-gray-200',
    textClass: 'text-gray-900',
    accentClass: 'bg-emerald-500'
  },
  {
    id: 'warm-sunset',
    name: 'Sunset',
    bgClass: 'bg-gradient-to-br from-orange-500 to-rose-600',
    textClass: 'text-white',
    accentClass: 'bg-white/20 backdrop-blur-sm'
  },
  {
    id: 'deep-ocean',
    name: 'Ocean',
    bgClass: 'bg-gradient-to-br from-blue-600 to-indigo-800',
    textClass: 'text-white',
    accentClass: 'bg-white/20'
  }
];