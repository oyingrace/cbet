/**
 * Bet Calculator Service
 * Handles all bet-related calculations including combinations, costs, and winnings.
 * Amounts are denominated in USDT.
 */

import {
  generatePermCombinations,
  calculateTotalCost,
  calculateStakePerLine,
  isPermBet,
  calculateCombinationCount,
} from '../utils/combinationGenerator';
import { isDrawBet, isSpecialBet, getComboLevel } from '../utils/gameTypes';

class BetCalculator {
  static calculateBet({ selectedNumbers, betType, amount, mode = 'total', gameOdds }) {
    const combinationResult = generatePermCombinations(selectedNumbers, betType);

    if (combinationResult.error) {
      throw new Error(combinationResult.error);
    }

    const { combinations, count, permLevel, isPermBet: isPerm } = combinationResult;

    let stakePerLine, totalCost;

    if (mode === 'perLine') {
      stakePerLine = amount;
      totalCost = calculateTotalCost(amount, count);
    } else {
      totalCost = amount;
      stakePerLine = calculateStakePerLine(amount, count);
    }

    const winningsPerLine = stakePerLine * gameOdds;
    const totalPotentialWinnings = winningsPerLine * count;
    const potentialWinnings = totalPotentialWinnings;

    return {
      combinations,
      numberOfCombinations: count,
      permLevel,
      isPermBet: isPerm,
      stakePerLine: Math.round(stakePerLine * 100) / 100,
      totalCost: Math.round(totalCost * 100) / 100,
      winningsPerLine: Math.round(winningsPerLine * 100) / 100,
      totalPotentialWinnings: Math.round(totalPotentialWinnings * 100) / 100,
      potentialWinnings: Math.round(potentialWinnings * 100) / 100,
      gameOdds,
      mode,
    };
  }

  static previewBet({ selectedNumbers, betType, amount, mode = 'total', gameOdds }) {
    const isPerm = isPermBet(betType);

    let numberOfCombinations = 1;
    let permLevel = null;

    if (isPerm) {
      permLevel = getComboLevel(betType);
      if (permLevel) {
        numberOfCombinations = calculateCombinationCount(selectedNumbers.length, permLevel);
      }
    }

    let stakePerLine, totalCost;

    if (mode === 'perLine') {
      stakePerLine = amount;
      totalCost = amount * numberOfCombinations;
    } else {
      totalCost = amount;
      stakePerLine = amount / numberOfCombinations;
    }

    const winningsPerLine = stakePerLine * gameOdds;
    const totalPotentialWinnings = winningsPerLine * numberOfCombinations;
    const potentialWinnings = totalPotentialWinnings;

    return {
      numberOfCombinations,
      permLevel,
      isPermBet: isPerm,
      stakePerLine: Math.round(stakePerLine * 100) / 100,
      totalCost: Math.round(totalCost * 100) / 100,
      winningsPerLine: Math.round(winningsPerLine * 100) / 100,
      totalPotentialWinnings: Math.round(totalPotentialWinnings * 100) / 100,
      potentialWinnings: Math.round(potentialWinnings * 100) / 100,
      gameOdds,
      mode,
    };
  }

  static validateBet({
    selectedNumbers,
    betType,
    amount,
    minBetAmount,
    maxBetAmount,
    mode = 'total',
  }) {
    if (!selectedNumbers || selectedNumbers.length === 0) {
      return { valid: false, error: 'Please select at least one number' };
    }

    if (!amount || amount <= 0) {
      return { valid: false, error: 'Please enter a valid bet amount' };
    }

    const isPerm = isPermBet(betType);

    if (isPerm) {
      const permLevel = getComboLevel(betType);

      if (!permLevel) {
        return { valid: false, error: 'Invalid combo type' };
      }

      if (permLevel > selectedNumbers.length) {
        return { valid: false, error: `Select at least ${permLevel} numbers` };
      }

      const numberOfCombinations = calculateCombinationCount(
        selectedNumbers.length,
        permLevel
      );
      const totalCost = mode === 'perLine' ? amount * numberOfCombinations : amount;
      const stakePerLine = mode === 'perLine' ? amount : amount / numberOfCombinations;

      if (stakePerLine < minBetAmount) {
        const minTotal = Math.round(minBetAmount * numberOfCombinations * 100) / 100;
        return {
          valid: false,
          error:
            mode === 'total'
              ? `Minimum total stake is ${minTotal} USDT (${minBetAmount} USDT × ${numberOfCombinations} lines)`
              : `Minimum stake per line is ${minBetAmount} USDT`,
        };
      }

      if (totalCost > maxBetAmount) {
        return { valid: false, error: `maximum bet is ${maxBetAmount} USDT` };
      }
    } else {
      if (amount < minBetAmount) {
        return { valid: false, error: `Minimum bet is ${minBetAmount} USDT` };
      }

      if (amount > maxBetAmount) {
        return { valid: false, error: `Maximum bet is ${maxBetAmount} USDT` };
      }
    }

    return { valid: true };
  }

  static isCombinationWinner(betCombination, winningNumbers, betType, winCondition = 'all') {
    const matches = betCombination.filter((num) => winningNumbers.includes(num));

    if (winCondition === 'any') {
      return matches.length >= 1;
    }

    const isPerm = isPermBet(betType);
    const isDraw = isDrawBet(betType);

    if (isPerm || isDraw) {
      return betCombination.every((num) => winningNumbers.includes(num));
    }
    if (isSpecialBet(betType)) {
      return matches.length >= 1;
    }
    return betCombination.every((num) => winningNumbers.includes(num));
  }

  static calculateWinnings({ combinations, winningNumbers, betType, stakePerLine, gameOdds }) {
    const winningCombinations = combinations.filter((combo) =>
      this.isCombinationWinner(combo, winningNumbers, betType)
    );

    const numberOfWins = winningCombinations.length;
    const winningsPerLine = stakePerLine * gameOdds;
    const totalWinnings = winningsPerLine * numberOfWins;

    return {
      winningCombinations,
      numberOfWins,
      totalCombinations: combinations.length,
      winningsPerLine,
      totalWinnings: Math.round(totalWinnings * 100) / 100,
      isWinner: numberOfWins > 0,
    };
  }
}

export default BetCalculator;
