/**
 * @file gameBoardConstants.js
 * @author Alex Kachur
 * @since 2025-11-12
 * @purpose Centralizes static assets, placeholder data, and timing knobs for the Family Feud board.
 */
export const SLOT_COUNT = 8;
export const QUESTION_CARD_ASSET = '/Question_Card.png';
export const ANSWER_CARD_ASSET = '/Answer_Card.png';
export const TIMER_CARD_ASSET = ANSWER_CARD_ASSET;
export const EMPTY_CARD_ASSET = '/Hidden_Card_Empty.png';
export const HIDDEN_CARD_ASSETS = [
  '/Hidden_Card_1.png',
  '/Hidden_Card_2.png',
  '/Hidden_Card_3.png',
  '/Hidden_Card_4.png',
  '/Hidden_Card_5.png',
  '/Hidden_Card_6.png',
  '/Hidden_Card_7.png',
  '/Hidden_Card_8.png',
];

// Card slots are locked to their TV positions. Pair top rows as 1/4, 2/5, 3/6, then append leftover slots.
export const DISPLAY_ORDER = (() => {
  const desiredPairings = [
    [0, 3], // 1 / 4
    [1, 4], // 2 / 5
    [2, 5], // 3 / 6
  ];
  const order = [];
  const used = new Set();

  desiredPairings.forEach(([leftIndex, rightIndex]) => {
    if (leftIndex < SLOT_COUNT && rightIndex < SLOT_COUNT) {
      order.push(leftIndex, rightIndex);
      used.add(leftIndex);
      used.add(rightIndex);
    }
  });

  for (let slotIndex = 0; slotIndex < SLOT_COUNT; slotIndex += 1) {
    if (!used.has(slotIndex)) {
      order.push(slotIndex);
    }
  }

  return order;
})();

// TODO (Gameplay): Hydrate these placeholders with real lobby/team assignments once auth/session wiring lands.
export const PLAYER_PLACEHOLDERS = [
  {
    label: 'Team A',
    playerName: 'Player One',
    avatar: '/Default_Avatar.jpg',
    scoreCard: ANSWER_CARD_ASSET,
  },
  {
    label: 'Team B',
    playerName: 'Player Two',
    avatar: '/Default_Avatar.jpg',
    scoreCard: ANSWER_CARD_ASSET,
  },
];

// Round themes provide overlay + multiplier context per round index.
export const ROUND_THEMES = [
  { id: 'round-1', label: 'Round 1 · Single Points', overlayAsset: '/Round_One.png', multiplier: 1 },
  { id: 'round-2', label: 'Round 2 · Single Points', overlayAsset: '/Round_Two.png', multiplier: 1 },
  { id: 'round-3', label: 'Round 3 · Double Points', overlayAsset: '/Round_Three.png', multiplier: 2 },
  { id: 'round-4', label: 'Round 4 · Triple Points', overlayAsset: '/Round_Four.png', multiplier: 3 },
];

export const QUESTION_ROUND_BUCKETS = [
  { minAnswers: 5, maxAnswers: 6 },
  { minAnswers: 5, maxAnswers: 6 },
  { minAnswers: 7, maxAnswers: 8 },
  { maxAnswers: 4 },
];

export const getRoundBucket = (roundIndex = 0) => (
  QUESTION_ROUND_BUCKETS[roundIndex % QUESTION_ROUND_BUCKETS.length] ?? null
);

export const TIMER_CONFIG = {
  faceoffBuzz: 6,
  faceoffAnswer: 6,
  playGuess: 8,
  steal: 7,
  countdownGrace: 0.5,
};

export const TIMER_LABELS = {
  faceoffBuzz: 'Face-off',
  faceoffAnswer: 'Answer',
  playGuess: 'Guess',
  steal: 'Steal',
};

export const BUZZ_KEYS = ['Space', 'Spacebar'];

export const ANSWERING_PHASES = new Set(['faceoffAnswer', 'faceoffChallenger', 'playing', 'steal']);
