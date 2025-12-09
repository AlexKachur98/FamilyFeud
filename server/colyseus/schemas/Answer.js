import { Schema, type } from '@colyseus/schema';

/**
 * Answer schema for Colyseus state synchronization
 * Represents a single answer on the board
 */
export class Answer extends Schema {
    constructor() {
        super();
        this.index = 0;
        this.text = '';
        this.points = 0;
        this.revealed = false;
    }
}

type('number')(Answer.prototype, 'index');
type('string')(Answer.prototype, 'text');
type('number')(Answer.prototype, 'points');
type('boolean')(Answer.prototype, 'revealed');
