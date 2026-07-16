/**
 * Combination Generator Utility
 * Generates all possible combinations for combo (perm) bets.
 */

import { isComboBet, getComboLevel } from './gameTypes';

/** Generate all combinations of k elements from array. */
export function generateCombinations(arr, k) {
  if (k > arr.length || k <= 0) return [];
  if (k === arr.length) return [arr];
  if (k === 1) return arr.map((element) => [element]);

  const combinations = [];
  for (let i = 0; i < arr.length - k + 1; i++) {
    const head = arr[i];
    const tailCombinations = generateCombinations(arr.slice(i + 1), k - 1);
    for (const tailCombination of tailCombinations) {
      combinations.push([head, ...tailCombination]);
    }
  }
  return combinations;
}

/** Calculate C(n, k) without generating combinations (for large sets). */
export function calculateCombinationCount(n, k) {
  if (k > n || k < 0) return 0;
  if (k === 0 || k === n) return 1;
  k = Math.min(k, n - k);
  let result = 1;
  for (let i = 1; i <= k; i++) {
    result = (result * (n - k + i)) / i;
  }
  return Math.round(result);
}

/** Combo (perm) bet. */
export function isPermBet(betType) {
  return isComboBet(betType);
}

/** Generate all combinations for a perm bet. */
export function generatePermCombinations(selectedNumbers, betType) {
  if (!isPermBet(betType)) {
    return {
      combinations: [selectedNumbers],
      count: 1,
      permLevel: null,
      isPermBet: false,
    };
  }

  const permLevel = getComboLevel(betType);

  if (!permLevel || permLevel > selectedNumbers.length) {
    return {
      combinations: [],
      count: 0,
      permLevel,
      isPermBet: true,
      error: 'Invalid permutation level for selected numbers',
    };
  }

  const combinations = generateCombinations(selectedNumbers, permLevel);

  return {
    combinations,
    count: combinations.length,
    permLevel,
    isPermBet: true,
  };
}

export function calculateTotalCost(stakePerLine, numberOfCombinations) {
  return stakePerLine * numberOfCombinations;
}

export function calculateStakePerLine(totalStake, numberOfCombinations) {
  return totalStake / numberOfCombinations;
}

export function formatCombination(combination) {
  return combination.sort((a, b) => a - b).join(', ');
}

export function calculatePotentialWinnings(stakePerLine, odds, numberOfCombinations) {
  const winningsPerLine = stakePerLine * odds;
  const totalPotentialWinnings = winningsPerLine * numberOfCombinations;
  return {
    stakePerLine,
    winningsPerLine,
    numberOfCombinations,
    totalPotentialWinnings,
    odds,
  };
}
