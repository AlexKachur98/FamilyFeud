import { Schema, type } from '@colyseus/schema';

/**
 * Player schema for Colyseus state synchronization
 * Represents a player in the game room
 */
export class Player extends Schema {
    constructor() {
        super();
        this.odId = '';
        this.name = '';
        this.teamId = '';
        this.isHost = false;
        this.isConnected = true;
        this.isReady = false;
        this.isSpectator = false;
        this.score = 0;
    }
}

// Define schema types using decorators alternative (Colyseus 0.16 compatible)
type('string')(Player.prototype, 'odId');      // MongoDB userId or guest UUID
type('string')(Player.prototype, 'name');       // Display name
type('string')(Player.prototype, 'teamId');     // team1 or team2
type('boolean')(Player.prototype, 'isHost');    // Is this player the host?
type('boolean')(Player.prototype, 'isConnected'); // Connection status
type('boolean')(Player.prototype, 'isReady');   // Ready to start?
type('boolean')(Player.prototype, 'isSpectator'); // Is spectating (not playing)?
type('number')(Player.prototype, 'score');      // Individual points this game
