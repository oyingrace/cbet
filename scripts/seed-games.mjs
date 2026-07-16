/**
 * Seed the games collection with cbet's lottery lineup (USDT stakes).
 *
 * Usage:
 *   node --env-file=.env.local scripts/seed-games.mjs
 *
 * Uses a loose inline schema so it doesn't need to import the app's ESM model
 * files. Upserts by game `type`, so it is safe to re-run.
 */
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('MONGODB_URI is not set. Run with: node --env-file=.env.local scripts/seed-games.mjs');
  process.exit(1);
}

const DRAW_COMBO_SCHEDULE = [
  { time: '09:00', isActive: true },
  { time: '11:15', isActive: true },
  { time: '14:00', isActive: true },
  { time: '17:00', isActive: true },
  { time: '20:30', isActive: true },
];

const SPECIAL_SCHEDULE_A = [
  { time: '10:00', isActive: true },
  { time: '22:00', isActive: true },
];

const SPECIAL_SCHEDULE_B = [
  { time: '12:00', isActive: true },
  { time: '16:00', isActive: true },
  { time: '20:00', isActive: true },
];

const range = { min: 1, max: 90 };

const games = [
  // Main (draw) — pick exactly N; all must match the 5 winning numbers.
  { name: 'Draw 2', type: 'draw-2', description: 'Pick 2 numbers. Both must match the 5 winning numbers.', minNumbers: 2, maxNumbers: 2, odds: 240, drawSchedule: DRAW_COMBO_SCHEDULE },
  { name: 'Draw 3', type: 'draw-3', description: 'Pick 3 numbers. All must match the 5 winning numbers.', minNumbers: 3, maxNumbers: 3, odds: 2100, drawSchedule: DRAW_COMBO_SCHEDULE },
  { name: 'Draw 4', type: 'draw-4', description: 'Pick 4 numbers. All must match the 5 winning numbers.', minNumbers: 4, maxNumbers: 4, odds: 6000, drawSchedule: DRAW_COMBO_SCHEDULE },
  { name: 'Draw 5', type: 'draw-5', description: 'Pick 5 numbers. All must match the 5 winning numbers.', minNumbers: 5, maxNumbers: 5, odds: 44000, drawSchedule: DRAW_COMBO_SCHEDULE },

  // Combo — pick more numbers to cover every N-combination.
  { name: 'Combo 2', type: 'combo-2', description: 'Cover every 2-number combination from your picks.', minNumbers: 2, maxNumbers: 10, odds: 240, drawSchedule: DRAW_COMBO_SCHEDULE },
  { name: 'Combo 3', type: 'combo-3', description: 'Cover every 3-number combination from your picks.', minNumbers: 3, maxNumbers: 10, odds: 2100, drawSchedule: DRAW_COMBO_SCHEDULE },
  { name: 'Combo 4', type: 'combo-4', description: 'Cover every 4-number combination from your picks.', minNumbers: 4, maxNumbers: 10, odds: 6000, drawSchedule: DRAW_COMBO_SCHEDULE },
  { name: 'Combo 5', type: 'combo-5', description: 'Cover every 5-number combination from your picks.', minNumbers: 5, maxNumbers: 10, odds: 44000, drawSchedule: DRAW_COMBO_SCHEDULE },

  // Special — pick 2; win if any of your numbers match the draw.
  { name: 'Lucky 10', type: 'lucky-10', description: 'Pick 2 numbers. Win if any match the draw.', minNumbers: 2, maxNumbers: 2, odds: 10, drawSchedule: SPECIAL_SCHEDULE_A },
  { name: 'Mega 20', type: 'mega-20', description: 'Pick 2 numbers. Win if any match the draw.', minNumbers: 2, maxNumbers: 2, odds: 20, drawSchedule: SPECIAL_SCHEDULE_A },
  { name: 'Turbo 30', type: 'turbo-30', description: 'Pick 2 numbers. Win if any match the draw.', minNumbers: 2, maxNumbers: 2, odds: 30, drawSchedule: SPECIAL_SCHEDULE_B },
  { name: 'Ultra 40', type: 'ultra-40', description: 'Pick 2 numbers. Win if any match the draw.', minNumbers: 2, maxNumbers: 2, odds: 40, drawSchedule: SPECIAL_SCHEDULE_B },
].map((g) => ({
  ...g,
  numberRange: range,
  minBetAmount: 1,
  maxBetAmount: 100,
  validationRules: {},
  currentDraw: { status: 'pending' },
  isActive: true,
}));

async function main() {
  await mongoose.connect(MONGODB_URI);
  const Game = mongoose.model(
    'Game',
    new mongoose.Schema({}, { strict: false, timestamps: true })
  );

  for (const game of games) {
    await Game.findOneAndUpdate({ type: game.type }, { $set: game }, { upsert: true, new: true });
    console.log(`Seeded game: ${game.name} (${game.type})`);
  }

  console.log(`Done. Seeded ${games.length} games.`);
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error('Error seeding games:', err);
  process.exit(1);
});
