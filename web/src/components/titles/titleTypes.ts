import { BookOpen, Film, Gamepad2, type LucideIcon } from 'lucide-react';
import type { TitleType } from '../../api/types';

export const TITLE_TYPES: Record<
  TitleType,
  { icon: LucideIcon; label: string }
> = {
  movie: { icon: Film, label: 'Movie' },
  game: { icon: Gamepad2, label: 'Game' },
  book: { icon: BookOpen, label: 'Book' },
};
