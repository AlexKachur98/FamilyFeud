import GameLog from '../models/gameLog.model.js';

/**
 * Appends a structured event to the session log.
 * @param {string} sessionId
 * @param {object} entry
 */
export async function logSessionEvent(sessionId, entry) {
  if (!sessionId) return;
  await GameLog.updateOne(
    { sessionId },
    {
      $push: { entries: { ts: new Date(), actorRole: 'system', ...entry } }
    }
  ).catch((err) => {
    console.error('Failed to append session log', sessionId, err);
  });
}

/**
 * Seeds a new log record for a session.
 */
export async function seedSessionLog(sessionId, { hostId, settings, teams }) {
  if (!sessionId) return null;
  try {
    const doc = await GameLog.create({
      sessionId,
      hostId,
      settings,
      entries: [
        { event: 'SESSION_CREATED', payload: { settings, teams } }
      ]
    });
    return doc;
  } catch (err) {
    console.error('Failed to seed session log', sessionId, err);
    return null;
  }
}
