// Shared rounds/time windows utilities (Africa/Lagos).
// A round accepts bets until BETTING_CUTOFF_MINUTES before its own draw time.
// Inside that cutoff window the round is "closed" and bets roll over to the next round.

import {
  getRoundConfig,
  getRoundTypeForGame,
  BETTING_CUTOFF_MINUTES,
} from './gameTypes';

const LAGOS_TZ = 'Africa/Lagos';

function toMinutes(hours, minutes) {
  return hours * 60 + minutes;
}

function parseTimeToMinutes(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return toMinutes(hours, minutes);
}

function buildSchedule(roundType) {
  const cfg = getRoundConfig(roundType);
  const drawTimeStrings = cfg.drawTimes;
  const times = drawTimeStrings.map(parseTimeToMinutes);
  const labels = drawTimeStrings.map((t) => t.replace(':', ''));
  return { times, labels, drawTimeStrings };
}

export function getLagosNowParts(date = new Date()) {
  const fmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: LAGOS_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const parts = fmt.formatToParts(date).reduce((acc, p) => {
    acc[p.type] = p.value;
    return acc;
  }, {});
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
  };
}

function getActiveRoundIndex(currentMinutes, roundType = 'draw-combo') {
  const { times } = buildSchedule(roundType);
  if (!times.length) return 0;

  for (let i = 0; i < times.length; i += 1) {
    if (currentMinutes < times[i] - BETTING_CUTOFF_MINUTES) {
      return i;
    }
  }

  return 0;
}

export function getActiveRound(date = new Date(), roundType = 'draw-combo') {
  const { year, month, day, hour, minute } = getLagosNowParts(date);
  const currentMinutes = toMinutes(hour, minute);
  const { times, labels, drawTimeStrings } = buildSchedule(roundType);
  const index = getActiveRoundIndex(currentMinutes, roundType);
  const labelHHmm = labels[index];
  const drawMinutes = times[index];

  const firstDraw = times[0];
  const inNightWindowForFirstRound =
    index === 0 && currentMinutes >= firstDraw - BETTING_CUTOFF_MINUTES;

  let drawYear = year;
  let drawMonth = month;
  let drawDay = day;
  if (inNightWindowForFirstRound) {
    const isoLocal = `${year.toString().padStart(4, '0')}-${month
      .toString()
      .padStart(2, '0')}-${day.toString().padStart(2, '0')}T00:00:00`;
    const next = new Date(new Date(isoLocal).getTime() + 24 * 60 * 60 * 1000);
    const np = getLagosNowParts(next);
    drawYear = np.year;
    drawMonth = np.month;
    drawDay = np.day;
  }

  return {
    index,
    labelHHmm,
    drawMinutes,
    roundType,
    drawTime: drawTimeStrings[index],
    roundDate: { year: drawYear, month: drawMonth, day: drawDay },
  };
}

export function generateRoundId(date = new Date(), gameType = null) {
  const roundType = gameType ? getRoundTypeForGame(gameType) : 'draw-combo';
  const { labelHHmm, roundDate } = getActiveRound(date, roundType);
  const y = roundDate.year.toString().padStart(4, '0');
  const m = roundDate.month.toString().padStart(2, '0');
  const d = roundDate.day.toString().padStart(2, '0');
  const base = `${y}${m}${d}-${labelHHmm}`;
  const prefix = getRoundConfig(roundType).prefix;
  return prefix ? `${prefix}-${base}` : base;
}

export function getRoundDrawTimes(roundType = 'draw-combo') {
  return getRoundConfig(roundType).drawTimes;
}

export function getBettingWindowState(date = new Date(), gameType = null) {
  const roundType = gameType ? getRoundTypeForGame(gameType) : 'draw-combo';
  const { times, labels, drawTimeStrings } = buildSchedule(roundType);
  const active = getActiveRound(date, roundType);

  if (!times.length) {
    return {
      isClosed: false,
      cutoffMinutes: BETTING_CUTOFF_MINUTES,
      imminentDrawTime: null,
      openDrawTime: active.drawTime,
      openLabel: active.labelHHmm,
      roundType,
    };
  }

  const { hour, minute } = getLagosNowParts(date);
  const currentMinutes = toMinutes(hour, minute);

  let imminentIndex = times.findIndex((t) => t > currentMinutes);
  const hasImminentToday = imminentIndex !== -1;
  if (!hasImminentToday) imminentIndex = 0;

  const isClosed = hasImminentToday && labels[imminentIndex] !== active.labelHHmm;

  return {
    isClosed,
    cutoffMinutes: BETTING_CUTOFF_MINUTES,
    imminentDrawTime: drawTimeStrings[imminentIndex],
    openDrawTime: active.drawTime,
    openLabel: active.labelHHmm,
    roundType,
  };
}

const roundsApi = {
  getLagosNowParts,
  getActiveRound,
  generateRoundId,
  getRoundDrawTimes,
  getBettingWindowState,
};

export default roundsApi;
