import crypto from 'crypto';

/**
 * Draw `count` unique random numbers in [min, max] using a CSPRNG.
 * @returns {number[]} sorted ascending
 */
export function drawNumbers({ count, min, max }) {
  const numbers = new Set();
  const span = max - min + 1;
  const safeCount = Math.min(count, span);
  while (numbers.size < safeCount) {
    numbers.add(crypto.randomInt(min, max + 1));
  }
  return Array.from(numbers).sort((a, b) => a - b);
}
