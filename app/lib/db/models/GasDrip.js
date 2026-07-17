import mongoose from 'mongoose';

/**
 * Tracks CELO gas top-ups sent to player wallets by the relayer, so
 * /api/wallet/ensure-gas can enforce a cooldown per address (abuse/drain
 * protection) independent of the on-chain balance check.
 */
const gasDripSchema = new mongoose.Schema(
  {
    walletAddress: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
    },
    lastDripAt: {
      type: Date,
      required: true,
    },
    txHash: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

const GasDrip = mongoose.models.GasDrip || mongoose.model('GasDrip', gasDripSchema);

export default GasDrip;
