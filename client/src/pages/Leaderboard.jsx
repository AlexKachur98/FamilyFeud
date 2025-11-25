import { useState, useEffect } from "react";
import backgroundImage from "../assets/FF-Leaderboard.png";
import { getLeaderboard } from "../utils/leaderboardApi";
import "../styles/Leaderboard.css";

export default function Leaderboard(props) {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const data = await getLeaderboard();
      setLeaderboard(data);
      
      setError(null);
    } catch (error) {
      console.error("Failed to fetch leaderboard:", error);
      setError("Failed to fetch leaderboard data. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="game_theme">
        <div
          className="page page--centered leaderboard-page"
          style={{ backgroundImage: `url(${backgroundImage})` }}
        >
          <div className="loading-message">Loading leaderboard...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="game_theme">
        <div
          className="page page--centered leaderboard-page"
          style={{ backgroundImage: `url(${backgroundImage})` }}
        >
          <div className="error-message">{error}</div>
          <button onClick={fetchLeaderboard} className="retry-button">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="game_theme">
      <div
        className="page page--centered leaderboard-page"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      >
        <header className="page__header">
          <p className="eyebrow">Leaderboard</p>
          <h2>Player Rankings</h2>
          <p>
            Congratulations to all participants! Here are the current rankings:
          </p>
        </header>
        <div className="leaderboard-section">
          <div className="ranking-table">
            <div className="ranking-table__row ranking-table__row--head">
              <span>User Name</span>
              <span>Games Played</span>
              <span>Wins</span>
              <span>Losses</span>
              <span>Points</span>
            </div>

            {leaderboard.length === 0 ? (
              <div className="no-data-message">
                No leaderboard data available.
              </div>
            ) : (
              leaderboard.map((user) => (
                <div key={user.userId} className="ranking-table__row">
                  <span>{user.username}</span>
                  <span>{user.played}</span>
                  <span>{user.wins}</span>
                  <span>{user.losses}</span>
                  <span>{user.totalPoints}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
