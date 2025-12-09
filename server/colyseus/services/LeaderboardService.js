import LeaderboardModel from '../../models/leaderboard.model.js';

/**
 * Leaderboard Service
 * Handles updating player statistics after games complete
 */
export class LeaderboardService {
    /**
     * Update leaderboard entries for all players in a completed game
     * @param {Map} players - Map of sessionId -> Player objects
     * @param {string} winningTeamId - The ID of the winning team
     * @param {Map} teams - Map of teamId -> Team objects
     */
    static async updateGameResults(players, winningTeamId, teams) {
        const winningTeam = teams.get(winningTeamId);
        const losingTeamId = winningTeamId === 'team1' ? 'team2' : 'team1';
        const losingTeam = teams.get(losingTeamId);

        const updates = [];

        // Process each player
        for (const [sessionId, player] of players.entries()) {
            // Skip guests (those without a MongoDB user ID)
            if (!player.odId || player.odId.startsWith('guest_')) {
                continue;
            }

            const isWinner = player.teamId === winningTeamId;
            const teamScore = isWinner ? winningTeam?.totalScore : losingTeam?.totalScore;

            updates.push(
                LeaderboardService.updatePlayerStats(
                    player.odId,
                    player.name,
                    isWinner,
                    teamScore || 0
                )
            );
        }

        // Execute all updates
        try {
            await Promise.all(updates);
            console.log(`Leaderboard updated for ${updates.length} players`);
        } catch (error) {
            console.error('Failed to update leaderboard:', error);
        }
    }

    /**
     * Update a single player's leaderboard stats
     * @param {string} userId - MongoDB user ID
     * @param {string} username - Player's display name
     * @param {boolean} isWinner - Did the player win?
     * @param {number} points - Points earned this game
     */
    static async updatePlayerStats(userId, username, isWinner, points) {
        try {
            const update = {
                $inc: {
                    played: 1,
                    wins: isWinner ? 1 : 0,
                    losses: isWinner ? 0 : 1,
                    totalPoints: points
                },
                $setOnInsert: {
                    userId,
                    username
                }
            };

            await LeaderboardModel.findOneAndUpdate(
                { userId },
                update,
                { upsert: true, new: true }
            );

            console.log(`Updated leaderboard for ${username}: ${isWinner ? 'WIN' : 'LOSS'}, +${points} points`);
        } catch (error) {
            console.error(`Failed to update leaderboard for ${username}:`, error);
            throw error;
        }
    }

    /**
     * Get top players from leaderboard
     * @param {number} limit - Number of top players to return
     * @returns {Promise<Array>} Array of leaderboard entries
     */
    static async getTopPlayers(limit = 10) {
        try {
            return await LeaderboardModel
                .find()
                .sort({ totalPoints: -1, wins: -1 })
                .limit(limit)
                .lean();
        } catch (error) {
            console.error('Failed to get top players:', error);
            return [];
        }
    }

    /**
     * Get a player's rank on the leaderboard
     * @param {string} userId - MongoDB user ID
     * @returns {Promise<{rank: number, entry: object}|null>}
     */
    static async getPlayerRank(userId) {
        try {
            const entry = await LeaderboardModel.findOne({ userId }).lean();
            if (!entry) return null;

            const rank = await LeaderboardModel.countDocuments({
                totalPoints: { $gt: entry.totalPoints }
            });

            return { rank: rank + 1, entry };
        } catch (error) {
            console.error('Failed to get player rank:', error);
            return null;
        }
    }
}

export default LeaderboardService;
