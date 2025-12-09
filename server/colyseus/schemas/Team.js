import { Schema, ArraySchema, type } from '@colyseus/schema';
import { Player } from './Player.js';

/**
 * Team schema for Colyseus state synchronization
 * Represents a team in the game
 */
export class Team extends Schema {
    constructor() {
        super();
        this.id = '';
        this.name = '';
        this.score = 0;          // Points for current round
        this.totalScore = 0;     // Total accumulated points
        this.hasControl = false; // Does this team have control of the board?
        this.players = new ArraySchema();
    }
}

type('string')(Team.prototype, 'id');
type('string')(Team.prototype, 'name');
type('number')(Team.prototype, 'score');
type('number')(Team.prototype, 'totalScore');
type('boolean')(Team.prototype, 'hasControl');
type([Player])(Team.prototype, 'players');
