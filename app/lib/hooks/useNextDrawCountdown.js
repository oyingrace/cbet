'use client';

import { useEffect, useState } from 'react';
import { getMsUntilNextDraw, formatCountdown } from '@/lib/utils/nextDraw';

/**
 * Live "time until next draw" for a round type, ticking once per second.
 * Recomputes from the schedule when the countdown hits zero, so it rolls
 * over to the following draw automatically.
 */
export function useNextDrawCountdown(roundType = 'draw-combo') {
  const [msLeft, setMsLeft] = useState(() => getMsUntilNextDraw(roundType));

  useEffect(() => {
    const tick = () => setMsLeft(getMsUntilNextDraw(roundType));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [roundType]);

  return { msLeft, label: formatCountdown(msLeft) };
}
