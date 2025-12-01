import "../styles/Leaderboard.css";
import { useState, useEffect } from "react";
import { getLeaderboard } from "../api/leaderboard.api";

import backgroundImage from "../assets/FF-Leaderboard.png";

export default function Leaderboard(props) {

  // Temporary: Mock data for testing/demo purposes - set to false to fetch real data
  const USE_MOCK_DATA = true;
  const mockLeaderboard = [
    { userId: "1", username: "QuizMaster", played: 15, wins: 12, losses: 3, totalPoints: 1250 },
    { userId: "2", username: "Brainiac", played: 14, wins: 10, losses: 4, totalPoints: 1100 },
    { userId: "3", username: "FastFinger", played: 13, wins: 9, losses: 4, totalPoints: 980 },
    { userId: "4", username: "FeudChamp", played: 12, wins: 7, losses: 5, totalPoints: 850 },
    { userId: "5", username: "SmartPlayer", played: 10, wins: 5, losses: 5, totalPoints: 720 },
    { userId: "6", username: "QuickThinker", played: 8, wins: 4, losses: 4, totalPoints: 600 },
    { userId: "7", username: "GameExpert", played: 7, wins: 3, losses: 4, totalPoints: 480 },
    { userId: "8", username: "PuzzleSolver", played: 6, wins: 2, losses: 4, totalPoints: 350 },
    { userId: "9", username: "TriviaKing", played: 5, wins: 1, losses: 4, totalPoints: 220 },
    { userId: "10", username: "NewPlayer", played: 3, wins: 0, losses: 3, totalPoints: 100 }
  ];

  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);

      if (USE_MOCK_DATA) {
        // Use mock data for testing/demo purposes
        setLeaderboard(mockLeaderboard);
        setError(null);
      } else {
        // Fetch real data from the API
        const data = await getLeaderboard();
        setLeaderboard(data);
        setError(null);
      }
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
        <div className="page page--centered leaderboard-page">
          <div className="loading-message">Loading leaderboard...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="game_theme">
        <div
          className="page page--centered leaderboard-page">
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
      <div className="page page--wide leaderboard-page">
        <header className="page__header">
          <img src={logo} alt="Family Feud Logo" className='page__logo' />
          <p className="eyebrow">Leaderboard</p>
          <h2>Player Rankings</h2>
          <p>
            Congratulations to all participants! Here are the current rankings:
          </p>
        </header>
        <div className="leaderboard-section">
          <div className="ranking-table">
            <div className="ranking-table__row ranking-table__row--head">
              <span>Rank</span>
              <span>Username</span>
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
              leaderboard.map((user, index) => (
                <div key={user.userId} className="ranking-table__row">
                  <span>#{index + 1}</span>
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
