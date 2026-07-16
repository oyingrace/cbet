import mongoose from 'mongoose';

/**
 * User identity in cbet is the player's Celo wallet address, provided by
 * MiniPay. There is no Telegram id, PIN, or email/password — MiniPay is the
 * wallet and the identity provider.
 */
const userSchema = new mongoose.Schema(
  {
    walletAddress: {
      type: String,
      required: [true, 'Please provide a wallet address'],
      trim: true,
      lowercase: true,
    },
    username: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    referredBy: {
      type: String,
      default: null,
      trim: true,
      lowercase: true,
    },
    referralRewardEnabled: {
      type: Boolean,
      default: true,
    },
    hasPlacedFirstBet: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

userSchema.index({ walletAddress: 1 }, { unique: true });

if (mongoose.models.User) {
  delete mongoose.models.User;
}

const User = mongoose.model('User', userSchema);

export default User;
