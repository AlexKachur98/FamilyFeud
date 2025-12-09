import { Schema, MapSchema, type } from '@colyseus/schema';

/**
 * BuzzerState schema for Colyseus state synchronization
 * Manages the buzzer during faceoff rounds
 */
export class BuzzerState extends Schema {
    constructor() {
        super();
        this.active = false;     // Is buzzer accepting input?
        this.locked = false;     // Is buzzer locked after winner?
        this.winnerId = '';      // Player ID who buzzed first
        this.timestamps = new MapSchema(); // Player ID -> buzz timestamp
    }
}

type('boolean')(BuzzerState.prototype, 'active');
type('boolean')(BuzzerState.prototype, 'locked');
type('string')(BuzzerState.prototype, 'winnerId');
type({ map: 'number' })(BuzzerState.prototype, 'timestamps');
