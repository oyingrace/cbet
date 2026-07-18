// Client-side "time until next draw" helper, built on the existing round
// schedule (gameTypes/rounds) — no API call needed, since the schedule is
// already known statically.
import { getActiveRound } from './rounds';

const LAGOS_UTC_OFFSET = '+01:00'; // Africa/Lagos has no DST.

/**
 * Milliseconds from `date` until the next draw for `roundType` fires.
 */
export function getMsUntilNextDraw(roundType = 'draw-combo', date = new Date()) {
  const active = getActiveRound(date, roundType);
  const { year, month, day } = active.roundDate;
  const [hh, mm] = active.drawTime.split(':');

  const iso = `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(
    day
  ).padStart(2, '0')}T${hh}:${mm}:00${LAGOS_UTC_OFFSET}`;

  const target = new Date(iso);
  return Math.max(0, target.getTime() - date.getTime());
}

/** Format milliseconds as "Hh MMm" or "MMm SSs" for a compact countdown. */
export function formatCountdown(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${String(minutes).padStart(2, '0')}m`;
  }
  return `${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
}
