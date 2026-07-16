import mongoose from 'mongoose';

/**
 * A record of on-chain USDT activity tied to a user. Unlike the source app,
 * cbet has no app-managed balance ledger and no off-chain Wallet document —
 * stakes and payouts are USDT transfers on Celo, so every money-moving
 * transaction carries a `txHash` and originating `walletAddress`.
 */
const transactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['TICKET_PURCHASE', 'WINNING_PAYOUT', 'REFUND', 'REFERRAL_BONUS'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      enum: ['USDT'],
      default: 'USDT',
    },
    chainId: { type: Number, default: null },
    txHash: { type: String, default: null },
    walletAddress: { type: String, default: null, lowercase: true },
    status: {
      type: String,
      enum: ['PENDING', 'COMPLETED', 'FAILED', 'CANCELLED'],
      default: 'PENDING',
    },
    reference: {
      type: String,
      required: true,
      unique: true,
    },
    description: String,
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

transactionSchema.index({ user: 1 });
transactionSchema.index({ type: 1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ createdAt: -1 });
transactionSchema.index({ txHash: 1 }, { sparse: true });

const Transaction =
  mongoose.models.Transaction || mongoose.model('Transaction', transactionSchema);

export default Transaction;
