import mongoose from 'mongoose';

const betSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    game: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Game',
      required: true,
    },
    numbers: [
      {
        type: Number,
        required: true,
      },
    ],
    // Stake amount, denominated in USDT.
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      enum: ['USDT'],
      default: 'USDT',
    },
    // On-chain settlement details (Celo).
    chainId: { type: Number, default: null },
    txHash: { type: String, default: null },
    walletAddress: { type: String, default: null, lowercase: true },
    potentialWinnings: {
      type: Number,
      required: true,
    },
    betType: {
      type: String,
      enum: [
        'draw-2', 'draw-3', 'draw-4', 'draw-5',
        'combo-2', 'combo-3', 'combo-4', 'combo-5',
        'lucky-10', 'mega-20', 'turbo-30', 'ultra-40',
      ],
    },
    ticketCost: {
      type: Number,
      default: 0,
    },
    payout: {
      type: Number,
      default: 0,
    },
    payoutTxHash: { type: String, default: null },
    winningCombos: [
      {
        type: [Number],
        default: undefined,
      },
    ],
    roundId: {
      type: String,
    },
    gameType: {
      type: String,
      default: 'shared-round',
    },
    status: {
      type: String,
      enum: ['pending', 'won', 'lost', 'cancelled'],
      default: 'pending',
    },
    result: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Result',
    },
    transaction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction',
    },
  },
  {
    timestamps: true,
  }
);

betSchema.index({ user: 1, status: 1 });
betSchema.index({ game: 1, status: 1 });
betSchema.index({ createdAt: -1 });
betSchema.index({ roundId: 1, status: 1 });
betSchema.index({ roundId: 1, user: 1 });
betSchema.index({ txHash: 1 }, { sparse: true });
betSchema.index({ gameType: 1 });

const Bet = mongoose.models.Bet || mongoose.model('Bet', betSchema);

export default Bet;
