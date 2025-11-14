/**
 * @file gameBoardConstants.js
 * @author Alex Kachur
 * @since 2025-11-12
 * @purpose Centralizes static assets, placeholder data, and timing knobs for the Family Feud board.
 */
export const SLOT_COUNT = 8;
export const QUESTION_CARD_ASSET = '/Question_Card.png';
export const TIMER_CARD_ASSET = '/Answer_Card_0.png';
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
    scoreCard: '/Answer_Card_50.png',
  },
  {
    label: 'Team B',
    playerName: 'Player Two',
    avatar: '/Default_Avatar.jpg',
    scoreCard: '/Answer_Card_50.png',
  },
];

// TODO (Gameplay): Replace this placeholder round data with the real JSON feed once the backend lands.
export const ROUND_DATA = [
  {
    id: 'round-1',
    label: 'Round 1 · Single Points',
    overlayAsset: '/Round_One.png',
    multiplier: 1,
    question: 'Name something people double-check before leaving the house.',
    answers: [
      { answer: 'Lights off', points: 50, aliases: ['turn off lights', 'lights'] },
      { answer: 'Doors locked', points: 40, aliases: ['lock doors', 'doors'] },
      { answer: 'Stove or oven', points: 30, aliases: ['stove', 'oven', 'range'] },
      { answer: 'Wallet or purse', points: 20, aliases: ['wallet', 'purse'] },
      { answer: 'Car keys', points: 10, aliases: ['keys', 'car key'] },
      { answer: 'Phone', points: 5, aliases: ['cellphone', 'cell phone'] },
    ],
  },
  {
    id: 'round-2',
    label: 'Round 2 · Single Points',
    overlayAsset: '/Round_Two.png',
    multiplier: 1,
    question: 'Name a reason people wake up in the middle of the night.',
    answers: [
      { answer: 'Bathroom break', points: 50, aliases: ['use bathroom', 'bathroom'] },
      { answer: 'Noise', points: 40, aliases: ['loud noise', 'noises'] },
      { answer: 'Bad dream', points: 30, aliases: ['nightmare', 'dream'] },
      { answer: 'Thirsty', points: 20, aliases: ['get water', 'water'] },
      { answer: 'Check phone', points: 10, aliases: ['phone', 'texts'] },
      { answer: 'Hunger', points: 5, aliases: ['snack'] },
    ],
  },
  {
    id: 'round-3',
    label: 'Round 3 · Double Points',
    overlayAsset: '/Round_Three.png',
    multiplier: 2,
    question: 'Name something you always pack for a beach trip.',
    answers: [
      { answer: 'Sunscreen', points: 50, aliases: ['sunblock', 'sun screen'] },
      { answer: 'Towel', points: 40, aliases: ['beach towel'] },
      { answer: 'Swimsuit', points: 30, aliases: ['swim suit', 'trunks'] },
      { answer: 'Sunglasses', points: 20, aliases: ['glasses', 'shades'] },
      { answer: 'Flip-flops', points: 10, aliases: ['sandals'] },
      { answer: 'Snacks', points: 5, aliases: ['food'] },
    ],
  },
  {
    id: 'round-4',
    label: 'Round 4 · Triple Points',
    overlayAsset: '/Round_Four.png',
    multiplier: 3,
    question: 'Name something you do right before going to bed.',
    answers: [
      { answer: 'Brush teeth', points: 50, aliases: ['teeth', 'brush'] },
      { answer: 'Set alarm', points: 40, aliases: ['alarm clock', 'set the alarm'] },
      { answer: 'Check phone', points: 30, aliases: ['phone', 'scroll phone'] },
      { answer: 'Drink water', points: 20, aliases: ['glass of water'] },
      { answer: 'Read', points: 10, aliases: ['book', 'reading'] },
      { answer: 'Pray or meditate', points: 5, aliases: ['pray', 'meditate'] },
    ],
  },
];

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
