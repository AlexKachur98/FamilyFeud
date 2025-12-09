import { useEffect, useRef } from 'react';
import { useSoundEffects } from './useSoundEffects';

/**
 * Hook that automatically plays sound effects based on game state changes
 * Should be used within a component that has access to game state
 */
export function useGameSounds(gameState) {
    const sounds = useSoundEffects();
    const prevState = useRef({});

    useEffect(() => {
        if (!gameState) return;

        const prev = prevState.current;

        // Phase changes
        if (gameState.phase !== prev.phase) {
            switch (gameState.phase) {
                case 'faceoff':
                    sounds.playRoundStart();
                    break;
                case 'steal':
                    sounds.playSteal();
                    break;
                case 'fastMoney':
                    sounds.playFastMoney();
                    break;
                case 'gameOver':
                    // Play win/lose based on context (handled in component)
                    break;
            }
        }

        // Strike changes
        if (gameState.strikes > (prev.strikes || 0)) {
            sounds.playStrike();
        }

        // Buzzer winner
        if (gameState.buzzer?.winnerId && gameState.buzzer.winnerId !== prev.buzzerWinnerId) {
            sounds.playBuzzer();
        }

        // Answer revealed
        if (gameState.answers) {
            const currentRevealed = gameState.answers.filter(a => a.revealed).length;
            const prevRevealed = prev.revealedCount || 0;
            if (currentRevealed > prevRevealed) {
                sounds.playReveal();
            }
        }

        // Update previous state
        prevState.current = {
            phase: gameState.phase,
            strikes: gameState.strikes,
            buzzerWinnerId: gameState.buzzer?.winnerId,
            revealedCount: gameState.answers?.filter(a => a.revealed).length || 0
        };
    }, [gameState, sounds]);

    return sounds;
}

export default useGameSounds;
