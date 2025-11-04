/**
 * @file PlayerJoin.jsx
 * @author Alex Kachur
 * @since 2025-11-04
 * @purpose Join surface for contestants entering a Family Feud session.
 */
import PageSection from '../components/PageSection.jsx';

export default function PlayerJoin() {
  return (
    <div className="page page--centered">
      <header className="page__header">
        <p className="eyebrow">Contestant Lobby</p>
        <h2>Join a Game</h2>
        <p>Enter the access code provided by your host to buzz in.</p>
      </header>

      <PageSection title="Access Code" description="Codes refresh for every new lobby to prevent random joins.">
        <form className="form-stack">
          <label>
            Access Code
            <input type="text" inputMode="numeric" placeholder="842159" />
          </label>
          <label>
            Display Name
            <input type="text" placeholder="Team Captain" />
          </label>
          <button type="submit">Request Entry</button>
        </form>
        {/* TODO (Backend Team): POST /api/player-sessions/join should validate code and return player token. */}
      </PageSection>

      <PageSection title="Buzzer" description="Triggers once the host opens the question faceoff.">
        <button type="button" className="buzzer">Buzz</button>
        {/* TODO (Backend Team): open WebSocket channel for near-real-time buzzer latency handling. */}
      </PageSection>
    </div>
  );
}
