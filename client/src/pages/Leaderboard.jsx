/**
 * @file Leaderboard.jsx
 * @author Ali Graham
 * @since 2025-11-11
 * @purpose Display the leaderboard for the Family Feud game.
 */
import { useNavigate } from 'react-router-dom';
import backgroundImage from '../assets/FF-Leaderboard.png';
import '../styles/Leaderboard.css';

export default function Leaderboard(props) {
  const navigate = useNavigate();
  
  // Placeholder data for testing

  {/* TODO: Placeholders to be replaced with real data fetching logic */}
  const placeholderTeams = [
    { id: 1, teamName: "Lightning Strikers", members: "John, Sarah, Mike", gamesPlayed: 15, wins: 12, loses: 3, points: 1250 },
    { id: 2, teamName: "Thunder Bolts", members: "Emma, David, Lisa", gamesPlayed: 14, wins: 10, loses: 4, points: 1100 },
    { id: 3, teamName: "Quiz Masters", members: "Alex, Ryan, Kate", gamesPlayed: 13, wins: 9, loses: 4, points: 980 },
    { id: 4, teamName: "Brain Trust", members: "Nina, Tom, Amy", gamesPlayed: 12, wins: 7, loses: 5, points: 850 },
    { id: 5, teamName: "Smart Cookies", members: "Chris, Julia, Mark", gamesPlayed: 10, wins: 5, loses: 5, points: 720 },
  ];

  return (
    <div className="page page--centered leaderboard-page" style={{ backgroundImage: `url(${backgroundImage})` }}>
      <header className="page__header">
        <p className="eyebrow">Leaderboard</p>
        <h2>3v3 Rankings</h2>
        <p>Congratulations to all participants! Here are the current rankings:</p>
      </header>
      <div className="leaderboard-section">
        <div className="ranking-table">
          <div className="ranking-table__row ranking-table__row--head">
            <span>Team Name</span>
            <span>Members</span>
            <span>Games Played</span>
            <span>Wins</span>
            <span>Loses</span>
            <span>Points</span>
          </div>
          {placeholderTeams.map((team) => (
            <div key={team.id} className="ranking-table__row">
              <span>{team.teamName}</span>
              <span>{team.members}</span>
              <span>{team.gamesPlayed}</span>
              <span>{team.wins}</span>
              <span>{team.loses}</span>
              <span>{team.points}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}