/**
 * @file questionSets.js
 * @author Alex Kachur
 * @since 2025-11-04
 * @purpose Provides placeholder survey data and helpers while backend APIs are wired up.
 */

export const QUESTION_SETS = [
  {
    id: 'ffq-001',
    title: 'Family Dinner Staples',
    category: 'Lifestyle',
    roundType: 'single',
    createdAt: '2025-10-15T17:30:00Z',
    updatedAt: '2025-10-28T21:05:00Z',
    prompt: 'Name something you might find on a traditional family dinner table.',
    answers: [
      { id: 'ans-01', label: 'Mashed potatoes', points: 35, rank: 1 },
      { id: 'ans-02', label: 'Roast turkey', points: 27, rank: 2 },
      { id: 'ans-03', label: 'Stuffing', points: 18, rank: 3 },
      { id: 'ans-04', label: 'Gravy', points: 12, rank: 4 },
      { id: 'ans-05', label: 'Green beans', points: 8, rank: 5 },
    ],
    tags: ['holiday', 'comfort-food'],
    notes: 'Pulled from familyfeudquestions.com sample list, adapted for single round play.',
  },
  {
    id: 'ffq-002',
    title: 'Airport Annoyances',
    category: 'Travel',
    roundType: 'double',
    createdAt: '2025-10-18T15:10:00Z',
    updatedAt: '2025-10-27T19:45:00Z',
    prompt: 'Name something that frustrates people while flying.',
    answers: [
      { id: 'ans-06', label: 'Flight delays', points: 38, rank: 1 },
      { id: 'ans-07', label: 'Lost luggage', points: 24, rank: 2 },
      { id: 'ans-08', label: 'Tight seats', points: 20, rank: 3 },
      { id: 'ans-09', label: 'Security lines', points: 12, rank: 4 },
      { id: 'ans-10', label: 'Crying babies', points: 6, rank: 5 },
    ],
    tags: ['travel', 'double-points'],
    notes: 'Use double multiplier in score calculations.',
  },
];

/**
 * Returns mock survey sets to unblock early UI development.
 * @returns {Array<object>} question set metadata.
 */
export function getQuestionSets() {
  return QUESTION_SETS;
}

/**
 * Locates a survey set by its identifier.
 * @param {string} id - Question set slug/primary key.
 * @returns {object | undefined} matching survey payload.
 */
export function getQuestionSetById(id) {
  return QUESTION_SETS.find((set) => set.id === id);
}
