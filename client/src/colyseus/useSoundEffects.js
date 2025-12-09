import { useCallback, useRef, useEffect } from 'react';

/**
 * Sound effect types for Family Feud game
 */
const SOUND_URLS = {
    // Game sounds (using free sound URLs - replace with actual sounds in production)
    buzzer: 'https://www.soundjay.com/button/sounds/button-09.mp3',
    correct: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3',
    wrong: 'https://www.soundjay.com/misc/sounds/fail-buzzer-03.mp3',
    strike: 'https://www.soundjay.com/misc/sounds/fail-buzzer-01.mp3',
    reveal: 'https://www.soundjay.com/misc/sounds/magic-chime-02.mp3',
    timer: 'https://www.soundjay.com/clock/sounds/clock-ticking-2.mp3',
    timerEnd: 'https://www.soundjay.com/misc/sounds/bell-ringing-01.mp3',
    win: 'https://www.soundjay.com/misc/sounds/fanfare-3.mp3',
    lose: 'https://www.soundjay.com/misc/sounds/sad-trombone.mp3',
    roundStart: 'https://www.soundjay.com/misc/sounds/magic-chime-01.mp3',
    steal: 'https://www.soundjay.com/misc/sounds/drama-01.mp3',
    fastMoney: 'https://www.soundjay.com/misc/sounds/drum-roll-01.mp3'
};

/**
 * Custom hook for playing game sound effects
 * Provides memoized play functions for each sound type
 */
export function useSoundEffects() {
    const audioCache = useRef(new Map());
    const enabledRef = useRef(true);

    // Preload sounds on mount
    useEffect(() => {
        Object.entries(SOUND_URLS).forEach(([key, url]) => {
            const audio = new Audio();
            audio.preload = 'auto';
            audio.src = url;
            audioCache.current.set(key, audio);
        });

        return () => {
            // Cleanup audio elements
            audioCache.current.forEach((audio) => {
                audio.pause();
                audio.src = '';
            });
            audioCache.current.clear();
        };
    }, []);

    /**
     * Play a sound effect by type
     */
    const playSound = useCallback((type, volume = 0.5) => {
        if (!enabledRef.current) return;

        const audio = audioCache.current.get(type);
        if (audio) {
            // Clone audio for overlapping sounds
            const clone = audio.cloneNode();
            clone.volume = Math.max(0, Math.min(1, volume));
            clone.play().catch(() => {
                // Ignore autoplay errors (user hasn't interacted yet)
            });
        }
    }, []);

    /**
     * Toggle sound effects on/off
     */
    const toggleSound = useCallback(() => {
        enabledRef.current = !enabledRef.current;
        return enabledRef.current;
    }, []);

    /**
     * Set sound enabled state
     */
    const setSoundEnabled = useCallback((enabled) => {
        enabledRef.current = enabled;
    }, []);

    /**
     * Check if sound is enabled
     */
    const isSoundEnabled = useCallback(() => enabledRef.current, []);

    // Convenience functions for each sound type
    const playBuzzer = useCallback(() => playSound('buzzer', 0.7), [playSound]);
    const playCorrect = useCallback(() => playSound('correct', 0.6), [playSound]);
    const playWrong = useCallback(() => playSound('wrong', 0.5), [playSound]);
    const playStrike = useCallback(() => playSound('strike', 0.6), [playSound]);
    const playReveal = useCallback(() => playSound('reveal', 0.5), [playSound]);
    const playTimer = useCallback(() => playSound('timer', 0.3), [playSound]);
    const playTimerEnd = useCallback(() => playSound('timerEnd', 0.6), [playSound]);
    const playWin = useCallback(() => playSound('win', 0.7), [playSound]);
    const playLose = useCallback(() => playSound('lose', 0.5), [playSound]);
    const playRoundStart = useCallback(() => playSound('roundStart', 0.5), [playSound]);
    const playSteal = useCallback(() => playSound('steal', 0.5), [playSound]);
    const playFastMoney = useCallback(() => playSound('fastMoney', 0.5), [playSound]);

    return {
        // Generic play function
        playSound,

        // Individual sound functions
        playBuzzer,
        playCorrect,
        playWrong,
        playStrike,
        playReveal,
        playTimer,
        playTimerEnd,
        playWin,
        playLose,
        playRoundStart,
        playSteal,
        playFastMoney,

        // Sound control
        toggleSound,
        setSoundEnabled,
        isSoundEnabled
    };
}

export default useSoundEffects;
