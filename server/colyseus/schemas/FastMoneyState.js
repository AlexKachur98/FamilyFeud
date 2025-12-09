import { Schema, ArraySchema, type } from '@colyseus/schema';
import { FastMoneyAnswer } from './FastMoneyAnswer.js';

/**
 * FastMoneyQuestion schema - question text for Fast Money round
 */
export class FastMoneyQuestion extends Schema {
    constructor() {
        super();
        this.questionId = '';
        this.text = '';
    }
}

type('string')(FastMoneyQuestion.prototype, 'questionId');
type('string')(FastMoneyQuestion.prototype, 'text');

/**
 * FastMoneyState schema for Colyseus state synchronization
 * Manages the Fast Money bonus round
 */
export class FastMoneyState extends Schema {
    constructor() {
        super();
        this.player1Id = '';
        this.player2Id = '';
        this.player1Answers = new ArraySchema();
        this.player2Answers = new ArraySchema();
        this.player1Total = 0;
        this.player2Total = 0;
        this.currentPlayer = 1;        // 1 or 2
        this.currentQuestionIndex = 0; // 0-4 (5 questions)
        this.timerSeconds = 20;        // 20 for player 1, 25 for player 2
        this.questions = new ArraySchema();
    }
}

type('string')(FastMoneyState.prototype, 'player1Id');
type('string')(FastMoneyState.prototype, 'player2Id');
type([FastMoneyAnswer])(FastMoneyState.prototype, 'player1Answers');
type([FastMoneyAnswer])(FastMoneyState.prototype, 'player2Answers');
type('number')(FastMoneyState.prototype, 'player1Total');
type('number')(FastMoneyState.prototype, 'player2Total');
type('number')(FastMoneyState.prototype, 'currentPlayer');
type('number')(FastMoneyState.prototype, 'currentQuestionIndex');
type('number')(FastMoneyState.prototype, 'timerSeconds');
type([FastMoneyQuestion])(FastMoneyState.prototype, 'questions');
