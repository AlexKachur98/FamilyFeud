/**
 * @file PlayerJoin.jsx
 * @author Alex Kachur
 * @since 2025-11-04
 * @purpose Join surface for contestants entering a Family Feud session.
 */
import { useNavigate, useParams } from 'react-router-dom';

import PageSection from '../components/PageSection.jsx';
import { checkSessionAccessCode } from '../api/sessions.api.js';

export default function PlayerJoin() {
  const navigate = useNavigate();

  const { sessionId } = useParams();

  const handleJoin = async(e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    const accessCode = formData.get('accessCode');

    const response = await checkSessionAccessCode(sessionId, accessCode);

    if (response.ok) {
      const returnedSessionId = await response.json();
      navigate(`/game-board/${returnedSessionId}`);
    } else alert('Invalid access code. Please try again.');
    
  };

  return (
    <div className="game_theme">

      <div className="page page--centered">
        <header className="page__header">
          <p className="eyebrow">Contestant Lobby</p>
          <h2>Join a Game</h2>
          <p>Enter the access code provided by your host to buzz in.</p>
        </header>

        <PageSection title="Access Code" description="Codes refresh for every new lobby to prevent random joins.">
          <form
            className="form-stack"
            onSubmit={handleJoin}
          >
            <label htmlFor="join-access-code">
              Access Code
              <input
                id="join-access-code"
                name="accessCode"
                type="text"
                inputMode="numeric"
                placeholder="842159"
              />
            </label>
            <label htmlFor="join-display-name">
              Display Name
              <input
                id="join-display-name"
                name="displayName"
                type="text"
                placeholder="Team Captain"
              />
            </label>
            <button type="submit" className="primary-button">Request Entry</button>
          </form>
          {/* TODO (Backend Team): POST /api/player-sessions/join should validate code and return player token. */}
        </PageSection>

        <PageSection title="Buzzer" description="Triggers once the host opens the question faceoff.">
          <button type="button" className="buzzer" onClick={() => navigate('/under-construction')}>Buzz</button>
          {/* TODO (Backend Team): open WebSocket channel for near-real-time buzzer latency handling. */}
        </PageSection>
      </div>
    </div>
  );
}
