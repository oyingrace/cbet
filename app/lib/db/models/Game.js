//app/lib/db/models/Game.js
import mongoose from 'mongoose';

const gameSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      enum: [
        'draw-2', 'draw-3', 'draw-4', 'draw-5',
        'combo-2', 'combo-3', 'combo-4', 'combo-5',
        'lucky-10', 'mega-20', 'turbo-30', 'ultra-40',
      ],
    },
    description: {
      type: String,
      required: true,
    },
    minNumbers: {
      type: Number,
      required: true,
    },
    maxNumbers: {
      type: Number,
      required: true,
    },
    numberRange: {
      min: {
        type: Number,
        required: true,
        default: 1,
      },
      max: {
        type: Number,
        required: true,
        default: 90,
      },
    },
    odds: {
      type: Number,
      required: true,
    },
    // Stake bounds are denominated in USDT.
    minBetAmount: {
      type: Number,
      required: true,
      default: 1,
    },
    maxBetAmount: {
      type: Number,
      required: true,
      default: 1000,
    },
    validationRules: {
      allowRepeatedNumbers: {
        type: Boolean,
        default: false,
      },
      requireSequential: {
        type: Boolean,
        default: false,
      },
      specialRules: {
        type: String,
      },
    },
    drawSchedule: [
      {
        time: {
          type: String,
          required: true,
          // Format: "HH:mm" in 24-hour format
        },
        isActive: {
          type: Boolean,
          default: true,
        },
      },
    ],
    currentDraw: {
      drawNumber: {
        type: String,
      },
      drawTime: {
        type: Date,
      },
      status: {
        type: String,
        enum: ['pending', 'drawing', 'completed', 'cancelled'],
        default: 'pending',
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

gameSchema.index({ type: 1, isActive: 1 });
gameSchema.index({ 'currentDraw.drawTime': 1 });
gameSchema.index({ 'currentDraw.status': 1 });

gameSchema.virtual('nextDrawTime').get(function () {
  if (!this.drawSchedule || this.drawSchedule.length === 0) return null;
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();
  const nextDraw = this.drawSchedule
    .filter((schedule) => schedule.isActive)
    .map((schedule) => {
      const [hours, minutes] = schedule.time.split(':').map(Number);
      return hours * 60 + minutes;
    })
    .find((time) => time > currentTime);
  if (nextDraw) {
    const nextDrawDate = new Date(now);
    nextDrawDate.setHours(Math.floor(nextDraw / 60), nextDraw % 60, 0, 0);
    return nextDrawDate;
  }
  const firstDraw = this.drawSchedule
    .filter((schedule) => schedule.isActive)
    .map((schedule) => {
      const [hours, minutes] = schedule.time.split(':').map(Number);
      return hours * 60 + minutes;
    })
    .sort((a, b) => a - b)[0];
  if (firstDraw != null) {
    const nextDrawDate = new Date(now);
    nextDrawDate.setDate(nextDrawDate.getDate() + 1);
    nextDrawDate.setHours(Math.floor(firstDraw / 60), firstDraw % 60, 0, 0);
    return nextDrawDate;
  }
  return null;
});

const Game = mongoose.models.Game || mongoose.model('Game', gameSchema);

export default Game;
