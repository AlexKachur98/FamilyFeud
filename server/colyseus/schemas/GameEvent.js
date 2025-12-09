import { Schema, type } from '@colyseus/schema';

/**
 * GameEvent schema for Colyseus state synchronization
 * Used for event logging and replay capability
 */
export class GameEvent extends Schema {
    constructor() {
        super();
        this.timestamp = 0;
        this.type = '';       // 'buzz' | 'answer' | 'strike' | 'reveal' | 'steal' | 'roundEnd' | 'pointsAwarded'
        this.playerId = '';
        this.teamId = '';
        this.data = '';       // JSON stringified payload
    }
}

type('number')(GameEvent.prototype, 'timestamp');
type('string')(GameEvent.prototype, 'type');
type('string')(GameEvent.prototype, 'playerId');
type('string')(GameEvent.prototype, 'teamId');
type('string')(GameEvent.prototype, 'data');
