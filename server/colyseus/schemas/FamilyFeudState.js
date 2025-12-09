import { Schema, MapSchema, ArraySchema, type } from '@colyseus/schema';
import { Player } from './Player.js';
import { Team } from './Team.js';
import { Answer } from './Answer.js';
import { BuzzerState } from './BuzzerState.js';
import { TimerState } from './TimerState.js';
import { FastMoneyState } from './FastMoneyState.js';
import { GameEvent } from './GameEvent.js';

/**
 * Game phases:
 * - lobby: Players joining and team assignment
 * - faceoff: Two players buzzing in to determine control
 * - play: Controlling team answering questions
 * - steal: Other team attempting to steal points
 * - roundEnd: Round completed, showing scores
 * - fastMoney: Fast Money bonus round
 * - gameOver: Game completed
 */

/**
 * FamilyFeudState - Main game state schema for Colyseus
 * This is the authoritative server state that gets synchronized to all clients
 */
export class FamilyFeudState extends Schema {
    constructor() {
        super();

        // Room metadata
        this.roomCode = '';
        this.phase = 'lobby';   // lobby | faceoff | play | steal | roundEnd | fastMoney | gameOver
        this.hostId = '';       // sessionId of the host player

        // Round state
        this.currentRound = 1;  // 1-4
        this.roundType = 'single'; // single | double | triple | fastMoney
        this.pointMultiplier = 1;  // 1, 2, or 3

        // Question state
        this.questionId = '';
        this.questionText = '';
        this.totalAnswers = 0;

        // Players and teams
        this.players = new MapSchema();  // sessionId -> Player
        this.teams = new MapSchema();    // team1 | team2 -> Team

        // Game board state
        this.answers = new ArraySchema();
        this.strikes = 0;          // 0-3
        this.pointsOnBoard = 0;
        this.controllingTeam = ''; // team1 | team2 | ''
        this.faceoffWinner = '';   // sessionId of faceoff winner

        // Faceoff players for current round
        this.faceoffPlayer1 = '';  // sessionId from team1
        this.faceoffPlayer2 = '';  // sessionId from team2

        // Face-off answer tracking (per official rules)
        this.faceoffAnswer1 = '';      // Answer text from current player 1
        this.faceoffAnswer1Index = -1; // Index of answer (-1 if not on board)
        this.faceoffAnswer2 = '';      // Answer text from current player 2
        this.faceoffAnswer2Index = -1; // Index of answer (-1 if not on board)
        this.faceoffWaitingForSecond = false; // True if waiting for second player's answer
        this.awaitingPlayOrPass = false;  // True if winning team must choose play or pass

        // Alternating face-off (when both miss, go to next teammates)
        this.faceoffTeam1Index = 0;    // Current player index on team1 for face-off
        this.faceoffTeam2Index = 0;    // Current player index on team2 for face-off
        this.faceoffFirstTeam = '';    // Which team answered first in current attempt (team1|team2)
        this.faceoffCurrentAnswerer = ''; // Session ID of current player who should answer

        // Steal attempt tracking (per official rules: only ONE attempt allowed)
        this.stealAttempted = false;

        // Sub-state objects
        this.buzzer = new BuzzerState();
        this.timer = new TimerState();
        this.fastMoney = new FastMoneyState();

        // Event log for replay/audit
        this.eventLog = new ArraySchema();

        // Message for UI feedback
        this.message = '';

        // Game over state
        this.winningTeam = '';     // team1 | team2 | '' (tie)
        this.gameEndReason = '';   // 'rounds' | 'fastMoney' | 'forfeit'
    }

    /**
     * Initialize teams when game starts
     */
    initializeTeams() {
        const team1 = new Team();
        team1.id = 'team1';
        team1.name = 'Team 1';

        const team2 = new Team();
        team2.id = 'team2';
        team2.name = 'Team 2';

        this.teams.set('team1', team1);
        this.teams.set('team2', team2);
    }

    /**
     * Get a player by session ID
     */
    getPlayer(sessionId) {
        return this.players.get(sessionId);
    }

    /**
     * Get team by ID
     */
    getTeam(teamId) {
        return this.teams.get(teamId);
    }

    /**
     * Get the opposing team
     */
    getOpposingTeam(teamId) {
        return teamId === 'team1' ? this.teams.get('team2') : this.teams.get('team1');
    }

    /**
     * Calculate total revealed points on the board
     */
    calculatePointsOnBoard() {
        let total = 0;
        this.answers.forEach(answer => {
            if (answer.revealed) {
                total += answer.points;
            }
        });
        return total * this.pointMultiplier;
    }

    /**
     * Check if all answers are revealed
     */
    allAnswersRevealed() {
        return this.answers.every(answer => answer.revealed);
    }

    /**
     * Add an event to the log (capped at 500 events to prevent memory issues)
     */
    logEvent(type, playerId, teamId, data = {}) {
        const MAX_EVENT_LOG_SIZE = 500;

        const event = new GameEvent();
        event.timestamp = Date.now();
        event.type = type;
        event.playerId = playerId;
        event.teamId = teamId;
        event.data = JSON.stringify(data);
        this.eventLog.push(event);

        // Trim old events if log exceeds max size
        while (this.eventLog.length > MAX_EVENT_LOG_SIZE) {
            this.eventLog.shift();
        }
    }
}

// Define schema types
type('string')(FamilyFeudState.prototype, 'roomCode');
type('string')(FamilyFeudState.prototype, 'phase');
type('string')(FamilyFeudState.prototype, 'hostId');
type('number')(FamilyFeudState.prototype, 'currentRound');
type('string')(FamilyFeudState.prototype, 'roundType');
type('number')(FamilyFeudState.prototype, 'pointMultiplier');
type('string')(FamilyFeudState.prototype, 'questionId');
type('string')(FamilyFeudState.prototype, 'questionText');
type('number')(FamilyFeudState.prototype, 'totalAnswers');
type({ map: Player })(FamilyFeudState.prototype, 'players');
type({ map: Team })(FamilyFeudState.prototype, 'teams');
type([Answer])(FamilyFeudState.prototype, 'answers');
type('number')(FamilyFeudState.prototype, 'strikes');
type('number')(FamilyFeudState.prototype, 'pointsOnBoard');
type('string')(FamilyFeudState.prototype, 'controllingTeam');
type('string')(FamilyFeudState.prototype, 'faceoffWinner');
type('string')(FamilyFeudState.prototype, 'faceoffPlayer1');
type('string')(FamilyFeudState.prototype, 'faceoffPlayer2');
type('string')(FamilyFeudState.prototype, 'faceoffAnswer1');
type('number')(FamilyFeudState.prototype, 'faceoffAnswer1Index');
type('string')(FamilyFeudState.prototype, 'faceoffAnswer2');
type('number')(FamilyFeudState.prototype, 'faceoffAnswer2Index');
type('boolean')(FamilyFeudState.prototype, 'faceoffWaitingForSecond');
type('boolean')(FamilyFeudState.prototype, 'awaitingPlayOrPass');
type('number')(FamilyFeudState.prototype, 'faceoffTeam1Index');
type('number')(FamilyFeudState.prototype, 'faceoffTeam2Index');
type('string')(FamilyFeudState.prototype, 'faceoffFirstTeam');
type('string')(FamilyFeudState.prototype, 'faceoffCurrentAnswerer');
type('boolean')(FamilyFeudState.prototype, 'stealAttempted');
type(BuzzerState)(FamilyFeudState.prototype, 'buzzer');
type(TimerState)(FamilyFeudState.prototype, 'timer');
type(FastMoneyState)(FamilyFeudState.prototype, 'fastMoney');
type([GameEvent])(FamilyFeudState.prototype, 'eventLog');
type('string')(FamilyFeudState.prototype, 'message');
type('string')(FamilyFeudState.prototype, 'winningTeam');
type('string')(FamilyFeudState.prototype, 'gameEndReason');
