import mongoose from 'mongoose';

const resultSchema = new mongoose.Schema(
  {
    game: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Game',
      required: true,
    },
    drawNumber: {
      type: String,
      required: true,
    },
    winningNumbers: [
      {
        type: Number,
        required: true,
      },
    ],
    drawTime: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'published', 'cancelled'],
      default: 'pending',
    },
    prizeBreakdown: [
      {
        rank: {
          type: Number,
          required: true,
        },
        amount: {
          type: Number,
          required: true,
        },
        winners: {
          type: Number,
          default: 0,
        },
      },
    ],
    isShared: {
      type: Boolean,
      default: false,
    },
    roundId: {
      type: String,
    },
    roundType: {
      type: String,
      default: 'draw-combo',
    },
    winners: [
      {
        displayName: {
          type: String,
          required: true,
        },
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        betId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Bet',
        },
        isBot: {
          type: Boolean,
          default: false,
        },
        matchedNumbers: [
          {
            type: Number,
          },
        ],
        matchCount: {
          type: Number,
          required: true,
        },
        prizeAmount: {
          type: Number,
          required: true,
        },
      },
    ],
    totalWinners: {
      type: Number,
      default: 0,
    },
    totalPrizeAmount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

resultSchema.index({ game: 1, drawTime: 1 });
resultSchema.index({ status: 1 });
resultSchema.index({ createdAt: -1 });
resultSchema.index({ isShared: 1, drawTime: 1 });
resultSchema.index({ roundId: 1 });
resultSchema.index({ roundType: 1 });

const Result = mongoose.models.Result || mongoose.model('Result', resultSchema);

export default Result;
