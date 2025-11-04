/**
 * @file gameSessions.js
 * @author Alex Kachur
 * @since 2025-11-04
 * @purpose Stores placeholder session data representing live Family Feud matches.
 */
export const ACTIVE_SESSIONS = [
  {
    id: 'ffs-301',
    hostName: 'Alex K',
    accessCode: '842159',
    status: 'lobby',
    questionSetId: 'ffq-001',
    teams: [
      { id: 'team-a', name: 'The Smashers', score: 0, strikes: 0 },
      { id: 'team-b', name: 'Quiz Whizzes', score: 0, strikes: 0 },
    ],
    currentRound: 0,
    createdAt: '2025-11-04T21:15:00Z',
    updatedAt: '2025-11-04T21:15:00Z',
  },
];

/**
 * Fetches placeholder session records.
 * @returns {Array<object>} mock session data for UI scaffolding.
 */
export function getActiveSessions() {
  return ACTIVE_SESSIONS;
}
