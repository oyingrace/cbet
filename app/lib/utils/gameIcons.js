import { Target, DiceFive, Sparkle } from '@phosphor-icons/react';

/** Icon for a game's category: draw / combo / special. */
export function getGameIcon(gameType) {
  if (typeof gameType !== 'string') return Sparkle;
  if (gameType.startsWith('draw-')) return Target;
  if (gameType.startsWith('combo-')) return DiceFive;
  return Sparkle;
}
