/**
 * Game type helpers — Draw / Combo / Special lineup.
 */

export const SPECIAL_TYPES = ['lucky-10', 'mega-20', 'turbo-30', 'ultra-40'];

/**
 * Minutes before a draw time that betting for that round closes.
 * Bets placed inside this window are rolled over to the next round.
 * Override with NEXT_PUBLIC_BETTING_CUTOFF_MINUTES without a code change.
 */
export const BETTING_CUTOFF_MINUTES = (() => {
  const raw = Number(process.env.NEXT_PUBLIC_BETTING_CUTOFF_MINUTES);
  return Number.isFinite(raw) && raw >= 0 ? raw : 10;
})();

export const SPECIAL_ROUND_LABELS = {
  'lucky-10': 'Lucky 10',
  'mega-20': 'Mega 20',
  'turbo-30': 'Turbo 30',
  'ultra-40': 'Ultra 40',
};

/** User-facing label for results broadcast notifications (shared rounds). */
export const RESULTS_ROUND_LABELS = {
  'draw-combo': 'Draw & Combo',
  ...SPECIAL_ROUND_LABELS,
};

export function getResultsRoundLabel(roundType = 'draw-combo') {
  return RESULTS_ROUND_LABELS[roundType] || RESULTS_ROUND_LABELS['draw-combo'];
}

export function isDrawBet(betType) {
  return betType?.startsWith('draw-');
}

export function isComboBet(betType) {
  return betType?.startsWith('combo-');
}

export function isSpecialBet(betType) {
  return SPECIAL_TYPES.includes(betType);
}

export function getDrawLevel(betType) {
  const match = betType?.match(/draw-(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

export function getComboLevel(betType) {
  const match = betType?.match(/combo-(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

/** How many numbers are drawn for results for this game. */
export function getWinningNumberCount(game) {
  if (!game) return 5;
  if (game.validationRules?.winningNumberCount) {
    return game.validationRules.winningNumberCount;
  }
  if (isSpecialBet(game.type)) return 3;
  if (isDrawBet(game.type) || isComboBet(game.type)) return 5;
  return game.maxNumbers || 5;
}

/** Win condition: all picked numbers must hit (draw/combo) or any (special). */
export function getWinCondition(game) {
  if (game?.validationRules?.winCondition) return game.validationRules.winCondition;
  if (isSpecialBet(game?.type)) return 'any';
  return 'all';
}

/**
 * Map an app game type -> the on-chain CbetLotto gameType index.
 * Must stay in sync with CbetLotto._validateGameAndNumbers.
 */
export function getOnChainGameTypeIndex(gameType) {
  switch (gameType) {
    case 'draw-2':
      return 0;
    case 'draw-3':
      return 1;
    case 'draw-4':
      return 2;
    case 'combo-2':
      return 3;
    case 'combo-3':
      return 4;
    case 'draw-5':
      return 5;
    case 'lucky-10':
      return 6;
    case 'mega-20':
      return 7;
    case 'turbo-30':
      return 8;
    case 'ultra-40':
      return 9;
    case 'combo-4':
      return 10;
    case 'combo-5':
      return 11;
    default:
      return null;
  }
}

export const GAME_CATEGORIES = [
  { id: 'special', name: 'Special' },
  { id: 'draw', name: 'Main' },
  { id: 'combo', name: 'Combo' },
  { id: 'all', name: 'All Games' },
];

/** Round pools aligned with the draw schedules. */
export const ROUND_CONFIGS = {
  'draw-combo': {
    drawTimes: [
      '00:00', '02:30', '05:00', '07:30', '10:00',
      '12:30', '15:00', '17:30', '20:00', '22:30',
    ],
    prefix: '',
  },
  'lucky-10': {
    drawTimes: ['00:00', '06:00', '12:00', '18:00'],
    prefix: 'LCK10',
  },
  'mega-20': {
    drawTimes: ['03:00', '09:00', '15:00', '21:00'],
    prefix: 'MEGA20',
  },
  'turbo-30': {
    drawTimes: ['02:00', '06:00', '10:00', '14:00', '18:00', '22:00'],
    prefix: 'TRB30',
  },
  'ultra-40': {
    drawTimes: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'],
    prefix: 'ULT40',
  },
};

export function getRoundTypeForGame(gameType) {
  if (isSpecialBet(gameType)) return gameType;
  return 'draw-combo';
}

export function getRoundConfig(roundType = 'draw-combo') {
  return ROUND_CONFIGS[roundType] || ROUND_CONFIGS['draw-combo'];
}

export function filterGamesByCategory(games, category) {
  if (!Array.isArray(games)) return [];
  if (category === 'all') return games;
  return games.filter((game) => {
    if (!game?.type) return false;
    const t = game.type.toLowerCase();
    if (category === 'draw') return t.startsWith('draw-');
    if (category === 'combo') return t.startsWith('combo-');
    if (category === 'special') return SPECIAL_TYPES.includes(t);
    return false;
  });
}
