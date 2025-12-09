import { Schema, type } from '@colyseus/schema';

/**
 * TimerState schema for Colyseus state synchronization
 * Manages countdown timers during gameplay
 */
export class TimerState extends Schema {
    constructor() {
        super();
        this.active = false;
        this.seconds = 0;
        this.type = '';  // 'answer' | 'fastMoney' | 'faceoff'
    }
}

type('boolean')(TimerState.prototype, 'active');
type('number')(TimerState.prototype, 'seconds');
type('string')(TimerState.prototype, 'type');
