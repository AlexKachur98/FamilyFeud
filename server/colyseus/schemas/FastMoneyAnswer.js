import { Schema, type } from '@colyseus/schema';

/**
 * FastMoneyAnswer schema for Colyseus state synchronization
 * Represents a single Fast Money answer
 */
export class FastMoneyAnswer extends Schema {
    constructor() {
        super();
        this.questionIndex = 0;
        this.answer = '';
        this.points = 0;
        this.revealed = false;
    }
}

type('number')(FastMoneyAnswer.prototype, 'questionIndex');
type('string')(FastMoneyAnswer.prototype, 'answer');
type('number')(FastMoneyAnswer.prototype, 'points');
type('boolean')(FastMoneyAnswer.prototype, 'revealed');
