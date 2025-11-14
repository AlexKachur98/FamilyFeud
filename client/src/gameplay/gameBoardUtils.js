/**
 * @file gameBoardUtils.js
 * @author Alex Kachur
 * @since 2025-11-12
 * @purpose Helper utilities shared by the Family Feud gameplay engine.
 */
import { BUZZ_KEYS, PLAYER_PLACEHOLDERS, SLOT_COUNT } from './gameBoardConstants.js';

export function normalize(text) {
  return text.trim().toLowerCase();
}

export function buildAnswerSlots(round) {
  const normalized = (round.answers ?? []).map((entry, index) => {
    if (!entry?.answer) return null;
    return {
      answer: entry.answer,
      points: entry.points ?? 0,
      rank: index + 1,
      matchers: [entry.answer, ...(entry.aliases ?? [])].map(normalize),
    };
  });
  return Array.from({ length: SLOT_COUNT }, (_, index) => normalized[index] ?? null);
}

export function getOpponentIndex(playerIndex) {
  return (playerIndex + 1) % PLAYER_PLACEHOLDERS.length;
}

export function isSpaceKey(event) {
  return BUZZ_KEYS.includes(event.code) || BUZZ_KEYS.includes(event.key) || event.key === ' ';
}
