import mongoose from "mongoose";

const leaderboardSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    username: { type: String, required: true, unique: true },
    played: { type: Number, default: 0 },
    wins: { type: Number, default: 0 },
    losses: { type: Number, default: 0 },
    totalPoints: { type: Number, default: 0 },
  },
  {
    collection: "leaderboard",
  }
);

export default mongoose.model("Leaderboard", leaderboardSchema);