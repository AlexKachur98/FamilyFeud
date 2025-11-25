import leaderboard from "../models/leaderboard.model.js";

// Gets all leader and sorts the by Games Played and Total Points
export const getLeaders = async (req, res) => {
  try {
    const entries = await leaderboard.find().sort({
      played: 1,
      totalPoints: -1,
    });
    res.status(200).json(entries);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export default { getLeaders };
