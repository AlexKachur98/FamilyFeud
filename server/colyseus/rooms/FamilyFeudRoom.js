/**
 * @file FamilyFeudRoom.js
 * @author Alex Kachur
 * @since 2025-12-09
 * @description Main Colyseus room implementing Family Feud game logic.
 *
 * Implements official Family Feud rules:
 * - Face-off: Two players buzz in, higher-ranked answer wins
 * - Play/Pass: Winning team chooses to play or pass control
 * - Play phase: Team answers until 3 strikes or all revealed
 * - Steal: One attempt for opposing team after 3 strikes
 * - Point multipliers: 1x (rounds 1-2), 2x (round 3), 3x (round 4)
 * - Auto-advance: Rounds automatically progress after 5 second delay
 * - Fast Money: Bonus round with timed questions
 *
 * Message handlers are prefixed:
 * - host: Actions only the host can perform
 * - player: Actions any player can perform
 */
import { Room } from 'colyseus';
import jwt from 'jsonwebtoken';

import { FamilyFeudState } from '../schemas/FamilyFeudState.js';
import { Player } from '../schemas/Player.js';
import { Answer } from '../schemas/Answer.js';
import { FastMoneyAnswer } from '../schemas/FastMoneyAnswer.js';
import { FastMoneyQuestion } from '../schemas/FastMoneyState.js';
import QuestionModel from '../../models/question.model.js';
import { AIValidationService } from '../services/AIValidationService.js';
import { LeaderboardService } from '../services/LeaderboardService.js';

/**
 * Round configurations per official Family Feud rules
 * Rounds 1-2: Single points, Rounds 3: Double, Round 4: Triple
 */
const ROUND_CONFIG = {
    1: { type: 'single', multiplier: 1 },
    2: { type: 'single', multiplier: 1 },
    3: { type: 'double', multiplier: 2 },
    4: { type: 'triple', multiplier: 3 }
};

/**
 * Generate a random 6-digit room code
 */
function generateRoomCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * FamilyFeudRoom - Main game room for Family Feud
 * Handles all game logic and state synchronization
 */
export class FamilyFeudRoom extends Room {
    maxClients = 12;
    autoDispose = true;

    /**
     * Room initialization
     */
    onCreate(options) {
        console.log('FamilyFeudRoom created:', this.roomId);

        // Initialize game state
        this.setState(new FamilyFeudState());
        this.state.roomCode = generateRoomCode();
        this.state.initializeTeams();

        // Set room metadata for matchmaking (allows finding room by code)
        this.setMetadata({ roomCode: this.state.roomCode });

        // Register message handlers
        this.registerMessageHandlers();

        console.log(`Room code: ${this.state.roomCode}`);
    }

    /**
     * Authentication - validates JWT token
     * In Colyseus 0.16, onAuth receives (client, options, context)
     */
    async onAuth(client, options, context) {
        const { token, displayName } = options;

        // Guest players don't need a token
        if (!token && displayName) {
            return { guest: true, displayName };
        }

        // Validate JWT token for authenticated users
        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                return {
                    userId: decoded._id,
                    username: decoded.username || displayName,
                    guest: false
                };
            } catch (err) {
                console.error('JWT verification failed:', err.message);
                // Allow as guest if token is invalid but displayName provided
                if (displayName) {
                    return { guest: true, displayName };
                }
                throw new Error('Invalid authentication token');
            }
        }

        throw new Error('Authentication required: provide token or displayName');
    }

    /**
     * Player joins the room
     */
    onJoin(client, options, auth) {
        console.log(`Player ${client.sessionId} joined:`, auth);

        // Create player object
        const player = new Player();
        player.odId = auth.userId || `guest_${client.sessionId}`;
        player.name = auth.username || auth.displayName || `Player ${this.state.players.size + 1}`;
        player.isConnected = true;

        // First player becomes host
        if (this.state.players.size === 0) {
            player.isHost = true;
            this.state.hostId = client.sessionId;
        }

        // Auto-assign to team with fewer players
        const team1 = this.state.teams.get('team1');
        const team2 = this.state.teams.get('team2');

        if (team1.players.length <= team2.players.length) {
            player.teamId = 'team1';
            team1.players.push(player);
        } else {
            player.teamId = 'team2';
            team2.players.push(player);
        }

        // Add to players map
        this.state.players.set(client.sessionId, player);

        // Log event
        this.state.logEvent('join', client.sessionId, player.teamId, { name: player.name });

        // Notify room
        this.broadcast('playerJoined', {
            sessionId: client.sessionId,
            name: player.name,
            teamId: player.teamId
        });
    }

    /**
     * Player leaves the room
     */
    async onLeave(client, consented) {
        const player = this.state.players.get(client.sessionId);

        if (!player) return;

        console.log(`Player ${client.sessionId} leaving (consented: ${consented})`);

        // Mark as disconnected
        player.isConnected = false;

        // If not consented (unexpected disconnect), allow reconnection
        if (!consented) {
            try {
                // Wait for reconnection (2 minutes)
                await this.allowReconnection(client, 120);

                // Player reconnected
                player.isConnected = true;
                console.log(`Player ${client.sessionId} reconnected`);
                return;
            } catch (e) {
                // Reconnection timed out
                console.log(`Player ${client.sessionId} reconnection timed out`);
            }
        }

        // Remove player from team
        const team = this.state.teams.get(player.teamId);
        if (team) {
            const index = team.players.findIndex(p => p.odId === player.odId);
            if (index !== -1) {
                team.players.splice(index, 1);
            }
        }

        // Remove from players map
        this.state.players.delete(client.sessionId);

        // If host left, assign new host
        if (this.state.hostId === client.sessionId) {
            this.assignNewHost();
        }

        // Log event
        this.state.logEvent('leave', client.sessionId, player.teamId, { name: player.name });
    }

    /**
     * Room is being disposed - save game results
     */
    async onDispose() {
        console.log(`Room ${this.roomId} disposing`);

        // Only save results if game was actually played (not just lobby)
        if (this.state.phase === 'gameOver' || this.state.currentRound > 1) {
            try {
                // Determine winning team
                const team1 = this.state.teams.get('team1');
                const team2 = this.state.teams.get('team2');

                let winningTeamId = null;
                if (team1 && team2) {
                    if (team1.totalScore > team2.totalScore) {
                        winningTeamId = 'team1';
                    } else if (team2.totalScore > team1.totalScore) {
                        winningTeamId = 'team2';
                    }
                    // If tied, winningTeamId remains null
                }

                // Convert players MapSchema to array for LeaderboardService
                const playersArray = [];
                for (const [sessionId, player] of this.state.players.entries()) {
                    playersArray.push({
                        odId: player.odId,
                        name: player.name,
                        teamId: player.teamId,
                        score: player.score || 0
                    });
                }

                // Convert teams MapSchema to object
                const teamsObj = {
                    team1: team1 ? { totalScore: team1.totalScore } : { totalScore: 0 },
                    team2: team2 ? { totalScore: team2.totalScore } : { totalScore: 0 }
                };

                // Update leaderboard
                await LeaderboardService.updateGameResults(playersArray, winningTeamId, teamsObj);
                console.log('Game results saved to leaderboard');
            } catch (err) {
                console.error('Failed to save game results:', err);
            }
        }
    }

    /**
     * Assign a new host when current host leaves
     */
    assignNewHost() {
        const players = Array.from(this.state.players.values());
        const connectedPlayers = players.filter(p => p.isConnected);

        if (connectedPlayers.length > 0) {
            const newHost = connectedPlayers[0];
            newHost.isHost = true;

            // Find session ID for this player
            for (const [sessionId, player] of this.state.players.entries()) {
                if (player.odId === newHost.odId) {
                    this.state.hostId = sessionId;
                    break;
                }
            }

            this.broadcast('hostChanged', { hostId: this.state.hostId });
        }
    }

    /**
     * Register all message handlers
     */
    registerMessageHandlers() {
        // Host controls
        this.onMessage('host:startGame', this.handleStartGame.bind(this));
        this.onMessage('host:nextRound', this.handleNextRound.bind(this));
        this.onMessage('host:revealAnswer', this.handleRevealAnswer.bind(this));
        this.onMessage('host:addStrike', this.handleAddStrike.bind(this));
        this.onMessage('host:passControl', this.handlePassControl.bind(this));
        this.onMessage('host:startFaceoff', this.handleStartFaceoff.bind(this));
        this.onMessage('host:endRound', this.handleEndRound.bind(this));
        this.onMessage('host:setTeamName', this.handleSetTeamName.bind(this));

        // Player actions
        this.onMessage('player:buzz', this.handleBuzz.bind(this));
        this.onMessage('player:submitAnswer', this.handleSubmitAnswer.bind(this));
        this.onMessage('player:ready', this.handlePlayerReady.bind(this));
        this.onMessage('player:switchTeam', this.handleSwitchTeam.bind(this));

        // Face-off play/pass decision (per official rules - winning PLAYER decides)
        this.onMessage('player:playOrPass', this.handlePlayOrPass.bind(this));

        // Fast Money controls
        this.onMessage('host:startFastMoney', this.handleStartFastMoney.bind(this));
        this.onMessage('host:selectFastMoneyPlayers', this.handleSelectFastMoneyPlayers.bind(this));
        this.onMessage('host:startFastMoneyTimer', this.handleStartFastMoneyTimer.bind(this));
        this.onMessage('host:revealFastMoneyAnswer', this.handleRevealFastMoneyAnswer.bind(this));
        this.onMessage('host:nextFastMoneyQuestion', this.handleNextFastMoneyQuestion.bind(this));
        this.onMessage('host:endFastMoney', this.handleEndFastMoney.bind(this));
        this.onMessage('player:fastMoneyAnswer', this.handleFastMoneyAnswer.bind(this));

        // Game completion controls
        this.onMessage('host:playAgain', this.handlePlayAgain.bind(this));
        this.onMessage('host:endGame', this.handleEndGame.bind(this));

        // Spectator controls
        this.onMessage('player:toggleSpectator', this.handleToggleSpectator.bind(this));

        // Lobby management controls
        this.onMessage('host:kickPlayer', this.handleKickPlayer.bind(this));
        this.onMessage('host:shuffleTeams', this.handleShuffleTeams.bind(this));
    }

    /**
     * Verify sender is the host
     */
    isHost(client) {
        return client.sessionId === this.state.hostId;
    }

    // ==================== HOST MESSAGE HANDLERS ====================

    /**
     * Host starts the game
     */
    async handleStartGame(client, message) {
        if (!this.isHost(client)) return;
        if (this.state.phase !== 'lobby') return;

        // Ensure we have at least 1 player per team
        const team1 = this.state.teams.get('team1');
        const team2 = this.state.teams.get('team2');

        if (team1.players.length === 0 || team2.players.length === 0) {
            this.state.message = 'Each team needs at least one player';
            return;
        }

        // Load first question
        await this.loadQuestion();

        // Set up round 1
        this.state.currentRound = 1;
        const config = ROUND_CONFIG[1];
        this.state.roundType = config.type;
        this.state.pointMultiplier = config.multiplier;

        // Start with faceoff
        this.state.phase = 'faceoff';
        this.state.message = 'Round 1 - Faceoff!';

        // Enable buzzer
        this.state.buzzer.active = true;
        this.state.buzzer.locked = false;
        this.state.buzzer.winnerId = '';

        // Reset face-off state
        this.resetFaceoffState();

        this.state.logEvent('gameStart', client.sessionId, '', { round: 1 });
    }

    /**
     * Host advances to next round
     */
    async handleNextRound(client, message) {
        if (!this.isHost(client)) return;
        if (this.state.phase !== 'roundEnd') return;

        this.state.currentRound++;

        // Check if game should end
        if (this.state.currentRound > 4) {
            this.endGameWithWinner('rounds');
            return;
        }

        // Check if a team reached 300 points (Fast Money threshold)
        const team1 = this.state.teams.get('team1');
        const team2 = this.state.teams.get('team2');

        if (team1.totalScore >= 300 || team2.totalScore >= 300) {
            // Could trigger Fast Money here
            this.state.message = 'A team has reached 300 points!';
        }

        // Set up next round
        const config = ROUND_CONFIG[this.state.currentRound];
        this.state.roundType = config.type;
        this.state.pointMultiplier = config.multiplier;

        // Reset round state
        this.state.strikes = 0;
        this.state.stealAttempted = false;
        this.state.pointsOnBoard = 0;
        this.state.controllingTeam = '';
        this.state.faceoffWinner = '';
        this.state.answers.clear();

        // Reset team round scores
        team1.score = 0;
        team2.score = 0;
        team1.hasControl = false;
        team2.hasControl = false;

        // Load new question
        await this.loadQuestion();

        // Start faceoff
        this.state.phase = 'faceoff';
        this.state.buzzer.active = true;
        this.state.buzzer.locked = false;
        this.state.buzzer.winnerId = '';
        this.state.buzzer.timestamps.clear();

        // Reset face-off state
        this.resetFaceoffState();

        this.state.message = `Round ${this.state.currentRound} - ${config.type.charAt(0).toUpperCase() + config.type.slice(1)} points!`;
        this.state.logEvent('roundStart', client.sessionId, '', { round: this.state.currentRound });
    }

    /**
     * Host reveals a specific answer
     */
    handleRevealAnswer(client, message) {
        if (!this.isHost(client)) return;

        const { index } = message;
        if (index === undefined || index < 0 || index >= this.state.answers.length) return;

        const answer = this.state.answers[index];
        if (answer.revealed) return;

        answer.revealed = true;
        this.state.pointsOnBoard = this.state.calculatePointsOnBoard();

        this.state.logEvent('reveal', client.sessionId, this.state.controllingTeam, {
            index,
            answer: answer.text,
            points: answer.points
        });

        // Check if all answers revealed
        if (this.state.allAnswersRevealed()) {
            this.awardPoints();
        }
    }

    /**
     * Host adds a strike
     */
    handleAddStrike(client, message) {
        if (!this.isHost(client)) return;
        if (this.state.phase !== 'play') return;

        this.state.strikes++;
        this.state.logEvent('strike', client.sessionId, this.state.controllingTeam, {
            strikes: this.state.strikes
        });

        // Three strikes - other team can steal
        if (this.state.strikes >= 3) {
            this.state.phase = 'steal';
            const opposingTeamId = this.state.controllingTeam === 'team1' ? 'team2' : 'team1';
            this.state.message = `Three strikes! ${this.state.teams.get(opposingTeamId).name} can steal!`;
        }
    }

    /**
     * Host passes control to other team
     */
    handlePassControl(client, message) {
        if (!this.isHost(client)) return;

        const currentTeam = this.state.teams.get(this.state.controllingTeam);
        const opposingTeamId = this.state.controllingTeam === 'team1' ? 'team2' : 'team1';
        const opposingTeam = this.state.teams.get(opposingTeamId);

        if (currentTeam) currentTeam.hasControl = false;
        if (opposingTeam) opposingTeam.hasControl = true;

        this.state.controllingTeam = opposingTeamId;
        this.state.strikes = 0;
        this.state.stealAttempted = false;

        this.state.logEvent('passControl', client.sessionId, opposingTeamId, {});
    }

    /**
     * Host starts a faceoff between selected players
     */
    handleStartFaceoff(client, message) {
        if (!this.isHost(client)) return;

        const { player1Id, player2Id } = message;

        // Validate players exist and are on different teams
        const player1 = this.state.players.get(player1Id);
        const player2 = this.state.players.get(player2Id);

        if (!player1 || !player2) {
            this.state.message = 'Invalid players selected for faceoff';
            return;
        }

        if (player1.teamId === player2.teamId) {
            this.state.message = 'Faceoff players must be on different teams';
            return;
        }

        this.state.faceoffPlayer1 = player1Id || '';
        this.state.faceoffPlayer2 = player2Id || '';

        this.state.buzzer.active = true;
        this.state.buzzer.locked = false;
        this.state.buzzer.winnerId = '';
        this.state.buzzer.timestamps.clear();

        this.state.phase = 'faceoff';
        this.state.message = 'Faceoff! Buzz in with your answer!';
    }

    /**
     * Host ends the current round
     */
    handleEndRound(client, message) {
        if (!this.isHost(client)) return;

        this.awardPoints();
    }

    /**
     * Host sets team name
     */
    handleSetTeamName(client, message) {
        if (!this.isHost(client)) return;

        const { teamId, name } = message;
        const team = this.state.teams.get(teamId);
        if (team && name) {
            team.name = name;
        }
    }

    // ==================== PLAYER MESSAGE HANDLERS ====================

    /**
     * Player buzzes in during faceoff
     */
    handleBuzz(client, message) {
        if (this.state.phase !== 'faceoff') return;
        if (!this.state.buzzer.active || this.state.buzzer.locked) return;

        const player = this.state.players.get(client.sessionId);
        if (!player) return;

        // Record timestamp (server-side for fairness)
        const timestamp = Date.now();
        this.state.buzzer.timestamps.set(client.sessionId, timestamp);

        // Check if this is the first buzz
        if (!this.state.buzzer.winnerId) {
            this.state.buzzer.winnerId = client.sessionId;
            this.state.buzzer.locked = true;
            this.state.faceoffWinner = client.sessionId;

            this.state.logEvent('buzz', client.sessionId, player.teamId, { timestamp });
            this.broadcast('buzzerWinner', {
                sessionId: client.sessionId,
                name: player.name,
                teamId: player.teamId
            });
        }
    }

    /**
     * Player submits an answer
     */
    async handleSubmitAnswer(client, message) {
        const { answer } = message;
        if (!answer) return;

        const player = this.state.players.get(client.sessionId);
        if (!player) return;

        // Different handling based on phase
        if (this.state.phase === 'faceoff') {
            await this.handleFaceoffAnswer(client, player, answer);
        } else if (this.state.phase === 'play' || this.state.phase === 'steal') {
            await this.handlePlayAnswer(client, player, answer);
        }
    }

    /**
     * Handle answer during faceoff (per official Family Feud rules)
     *
     * Official Rules:
     * 1. First player to buzz answers first
     * 2. If their answer is #1, they win and choose to play or pass
     * 3. If not #1, the second player gets a chance to give a BETTER (higher-ranked) answer
     * 4. Whoever has the higher-ranked answer wins the face-off
     * 5. If BOTH miss, it alternates to next teammates on each team
     * 6. The winning team then chooses to PLAY or PASS
     */
    async handleFaceoffAnswer(client, player, answer) {
        // Check if we're in alternating mode or initial buzzer mode
        const isAlternatingMode = this.state.faceoffCurrentAnswerer !== '';
        const buzzWinnerId = this.state.buzzer.winnerId;

        if (!isAlternatingMode) {
            // INITIAL BUZZER MODE - Only buzzer winner or opponent can answer
            if (!buzzWinnerId) return;

            const buzzWinner = this.state.players.get(buzzWinnerId);
            if (!buzzWinner) return;

            const isFirstPlayer = client.sessionId === buzzWinnerId;
            const isSecondPlayer = player.teamId !== buzzWinner.teamId && this.state.faceoffWaitingForSecond;

            if (!isFirstPlayer && !isSecondPlayer) return;

            // Validate answer using AI
            const result = await this.validateAnswer(answer);

            if (isFirstPlayer && !this.state.faceoffWaitingForSecond) {
                // FIRST PLAYER'S ANSWER (buzzer winner)
                this.state.faceoffAnswer1 = answer;
                this.state.faceoffAnswer1Index = result.index;
                this.state.faceoffPlayer1 = client.sessionId;

                this.state.logEvent('faceoffAnswer', client.sessionId, player.teamId, {
                    answer,
                    matched: result.answer,
                    index: result.index,
                    points: result.points,
                    playerNum: 1
                });

                if (result.index === 0) {
                    // GOT THE #1 ANSWER! They win face-off outright
                    this.declareFaceoffWinner(client.sessionId, player, result);
                } else if (result.index > 0) {
                    // Got an answer, but not #1 - give other team a chance
                    this.state.faceoffWaitingForSecond = true;
                    this.state.message = `${player.name} said "${result.answer}" (#${result.index + 1})! Other team can try for a better answer!`;

                    // Reveal the answer they got
                    this.state.answers[result.index].revealed = true;
                    this.state.pointsOnBoard = this.state.calculatePointsOnBoard();
                } else {
                    // Not on the board - give other team a chance
                    this.state.faceoffWaitingForSecond = true;
                    this.state.message = `"${answer}" is not on the board! Other team's turn!`;
                }
            } else if (isSecondPlayer) {
                // SECOND PLAYER'S ANSWER (opponent)
                await this.handleSecondFaceoffAnswer(client, player, answer, buzzWinnerId, buzzWinner);
            }
        } else {
            // ALTERNATING MODE - specific players take turns
            if (client.sessionId !== this.state.faceoffCurrentAnswerer) {
                // Not this player's turn
                return;
            }

            // Validate answer using AI
            const result = await this.validateAnswer(answer);

            if (!this.state.faceoffWaitingForSecond) {
                // First player in this alternating round
                this.state.faceoffAnswer1 = answer;
                this.state.faceoffAnswer1Index = result.index;
                this.state.faceoffPlayer1 = client.sessionId;

                this.state.logEvent('faceoffAnswer', client.sessionId, player.teamId, {
                    answer,
                    matched: result.answer,
                    index: result.index,
                    points: result.points,
                    alternating: true,
                    playerNum: 1
                });

                if (result.index === 0) {
                    // Got #1 - they win!
                    this.declareFaceoffWinner(client.sessionId, player, result);
                } else if (result.index > 0) {
                    // Got an answer, but not #1 - other team gets a chance
                    this.state.faceoffWaitingForSecond = true;
                    this.state.answers[result.index].revealed = true;
                    this.state.pointsOnBoard = this.state.calculatePointsOnBoard();

                    // Set up the other team's player
                    const otherTeamId = player.teamId === 'team1' ? 'team2' : 'team1';
                    const otherTeamPlayers = this.getTeamPlayers(otherTeamId);
                    const otherTeamIndex = otherTeamId === 'team1' ? this.state.faceoffTeam1Index : this.state.faceoffTeam2Index;
                    const nextPlayer = otherTeamPlayers[otherTeamIndex];

                    if (nextPlayer) {
                        this.state.faceoffCurrentAnswerer = nextPlayer.sessionId;
                        this.state.message = `${player.name} said "${result.answer}" (#${result.index + 1})! ${nextPlayer.player.name}, try to beat it!`;
                    }
                } else {
                    // Missed - other team's turn
                    this.state.faceoffWaitingForSecond = true;

                    const otherTeamId = player.teamId === 'team1' ? 'team2' : 'team1';
                    const otherTeamPlayers = this.getTeamPlayers(otherTeamId);
                    const otherTeamIndex = otherTeamId === 'team1' ? this.state.faceoffTeam1Index : this.state.faceoffTeam2Index;
                    const nextPlayer = otherTeamPlayers[otherTeamIndex];

                    if (nextPlayer) {
                        this.state.faceoffCurrentAnswerer = nextPlayer.sessionId;
                        this.state.message = `"${answer}" is not on the board! ${nextPlayer.player.name}, your turn!`;
                    }
                }
            } else {
                // Second player in alternating round
                const firstPlayer = this.state.players.get(this.state.faceoffPlayer1);
                await this.handleSecondFaceoffAnswer(client, player, answer, this.state.faceoffPlayer1, firstPlayer);
            }
        }
    }

    /**
     * Handle the second player's answer in a face-off (either initial or alternating)
     */
    async handleSecondFaceoffAnswer(client, player, answer, firstPlayerId, firstPlayer) {
        const result = await this.validateAnswer(answer);

        this.state.faceoffAnswer2 = answer;
        this.state.faceoffAnswer2Index = result.index;
        this.state.faceoffPlayer2 = client.sessionId;

        this.state.logEvent('faceoffAnswer', client.sessionId, player.teamId, {
            answer,
            matched: result.answer,
            index: result.index,
            points: result.points,
            playerNum: 2
        });

        const firstAnswerIndex = this.state.faceoffAnswer1Index;
        const secondAnswerIndex = result.index;

        if (secondAnswerIndex >= 0 && (firstAnswerIndex < 0 || secondAnswerIndex < firstAnswerIndex)) {
            // Second player wins - they got a BETTER (higher-ranked) answer
            if (!this.state.answers[secondAnswerIndex].revealed) {
                this.state.answers[secondAnswerIndex].revealed = true;
                this.state.pointsOnBoard = this.state.calculatePointsOnBoard();
            }
            this.declareFaceoffWinner(client.sessionId, player, result);
        } else if (secondAnswerIndex >= 0) {
            // Second player got an answer but not better than first
            this.state.message = `${player.name} said "${result.answer}" (#${secondAnswerIndex + 1}), but that's not higher than #${firstAnswerIndex + 1}!`;
            if (!this.state.answers[secondAnswerIndex].revealed) {
                this.state.answers[secondAnswerIndex].revealed = true;
                this.state.pointsOnBoard = this.state.calculatePointsOnBoard();
            }
            // First player wins
            this.declareFaceoffWinner(firstPlayerId, firstPlayer, {
                index: firstAnswerIndex,
                answer: this.state.answers[firstAnswerIndex]?.text,
                points: this.state.answers[firstAnswerIndex]?.points
            });
        } else {
            // Second player missed
            this.state.message = `"${answer}" is not on the board!`;
            if (firstAnswerIndex >= 0) {
                // First player had an answer, they win
                this.declareFaceoffWinner(firstPlayerId, firstPlayer, {
                    index: firstAnswerIndex,
                    answer: this.state.answers[firstAnswerIndex]?.text,
                    points: this.state.answers[firstAnswerIndex]?.points
                });
            } else {
                // BOTH MISSED! Per official rules, go to next teammates
                this.state.message = 'Both missed! Next players, get ready...';
                // Brief delay then start next attempt
                setTimeout(() => {
                    this.startNextFaceoffAttempt();
                }, 2000);
            }
        }
    }

    /**
     * Declare a face-off winner and prompt for play/pass decision
     */
    declareFaceoffWinner(winnerId, winnerPlayer, result) {
        const winningTeam = this.state.teams.get(winnerPlayer.teamId);

        this.state.faceoffWinner = winnerId;
        this.state.buzzer.active = false;
        this.state.buzzer.locked = true;
        this.state.faceoffWaitingForSecond = false;
        this.state.awaitingPlayOrPass = true;

        // Add points to player's individual score if they got an answer
        if (result.index >= 0) {
            const earnedPoints = result.points * this.state.pointMultiplier;
            winnerPlayer.score = (winnerPlayer.score || 0) + earnedPoints;
        }

        this.state.message = `${winnerPlayer.name} wins the face-off! ${winningTeam.name}: PLAY or PASS?`;

        this.state.logEvent('faceoffWin', winnerId, winnerPlayer.teamId, {
            answer: result.answer,
            index: result.index,
            points: result.points
        });

        // Broadcast that play/pass decision is needed
        this.broadcast('awaitingPlayOrPass', {
            winningTeamId: winnerPlayer.teamId,
            winningTeamName: winningTeam.name,
            winnerId: winnerId,
            winnerName: winnerPlayer.name
        });
    }

    /**
     * Handle the play or pass decision after winning face-off
     * Per official Family Feud rules: the WINNING PLAYER (or their team) decides
     */
    handlePlayOrPass(client, message) {
        if (!this.state.awaitingPlayOrPass) return;

        const { choice } = message; // 'play' or 'pass'
        const faceoffWinner = this.state.players.get(this.state.faceoffWinner);
        if (!faceoffWinner) return;

        // Verify the player is on the winning team (the team that won the face-off)
        const player = this.state.players.get(client.sessionId);
        if (!player) return;
        if (player.teamId !== faceoffWinner.teamId) {
            // Only the winning team can make this decision
            return;
        }

        const winningTeamId = faceoffWinner.teamId;
        const winningTeam = this.state.teams.get(winningTeamId);
        const opposingTeamId = winningTeamId === 'team1' ? 'team2' : 'team1';
        const opposingTeam = this.state.teams.get(opposingTeamId);

        this.state.awaitingPlayOrPass = false;

        if (choice === 'play') {
            // Winning team plays
            winningTeam.hasControl = true;
            opposingTeam.hasControl = false;
            this.state.controllingTeam = winningTeamId;
            this.state.message = `${winningTeam.name} will PLAY!`;
        } else {
            // Pass to opposing team
            opposingTeam.hasControl = true;
            winningTeam.hasControl = false;
            this.state.controllingTeam = opposingTeamId;
            this.state.message = `${winningTeam.name} PASSES! ${opposingTeam.name} must play!`;
        }

        // Move to play phase
        this.state.phase = 'play';
        this.state.strikes = 0;
        this.state.stealAttempted = false;

        this.state.logEvent('playOrPass', client.sessionId, this.state.controllingTeam, {
            choice,
            faceoffWinner: faceoffWinner.name,
            controllingTeam: this.state.controllingTeam
        });
    }

    /**
     * Reset face-off state for a new round
     */
    resetFaceoffState() {
        this.state.faceoffPlayer1 = '';
        this.state.faceoffPlayer2 = '';
        this.state.faceoffAnswer1 = '';
        this.state.faceoffAnswer1Index = -1;
        this.state.faceoffAnswer2 = '';
        this.state.faceoffAnswer2Index = -1;
        this.state.faceoffWaitingForSecond = false;
        this.state.awaitingPlayOrPass = false;
        this.state.faceoffWinner = '';
        // Reset alternating face-off state
        this.state.faceoffTeam1Index = 0;
        this.state.faceoffTeam2Index = 0;
        this.state.faceoffFirstTeam = '';
        this.state.faceoffCurrentAnswerer = '';
    }

    /**
     * Get players on a team sorted by join order (for alternating face-off)
     */
    getTeamPlayers(teamId) {
        const players = [];
        this.state.players.forEach((player, sessionId) => {
            if (player.teamId === teamId && !player.isSpectator) {
                players.push({ sessionId, player });
            }
        });
        return players;
    }

    /**
     * Start the next alternating face-off attempt after both teams miss
     * Per official rules: alternates between teams, moving to next player
     */
    startNextFaceoffAttempt() {
        // Move to next player on each team
        this.state.faceoffTeam1Index++;
        this.state.faceoffTeam2Index++;

        const team1Players = this.getTeamPlayers('team1');
        const team2Players = this.getTeamPlayers('team2');

        // Wrap around if we've gone through all players
        if (this.state.faceoffTeam1Index >= team1Players.length) {
            this.state.faceoffTeam1Index = 0;
        }
        if (this.state.faceoffTeam2Index >= team2Players.length) {
            this.state.faceoffTeam2Index = 0;
        }

        // Reset answer tracking for this new attempt
        this.state.faceoffAnswer1 = '';
        this.state.faceoffAnswer1Index = -1;
        this.state.faceoffAnswer2 = '';
        this.state.faceoffAnswer2Index = -1;
        this.state.faceoffWaitingForSecond = false;

        // Determine which team goes first (alternates - opposite of who buzzed first originally)
        // The original buzzer winner's team went first, so now the other team goes first
        const originalBuzzerWinner = this.state.players.get(this.state.buzzer.winnerId);
        const firstTeam = originalBuzzerWinner?.teamId === 'team1' ? 'team2' : 'team1';
        this.state.faceoffFirstTeam = firstTeam;

        const firstTeamPlayers = firstTeam === 'team1' ? team1Players : team2Players;
        const firstTeamIndex = firstTeam === 'team1' ? this.state.faceoffTeam1Index : this.state.faceoffTeam2Index;
        const nextPlayer = firstTeamPlayers[firstTeamIndex];

        if (nextPlayer) {
            this.state.faceoffCurrentAnswerer = nextPlayer.sessionId;
            this.state.message = `${nextPlayer.player.name}, your turn to answer!`;
        }

        this.state.logEvent('faceoffAlternate', '', '', {
            team1Index: this.state.faceoffTeam1Index,
            team2Index: this.state.faceoffTeam2Index,
            firstTeam
        });
    }

    /**
     * Handle answer during play phase
     */
    async handlePlayAnswer(client, player, answer) {
        // Only controlling team can answer during play
        if (this.state.phase === 'play' && player.teamId !== this.state.controllingTeam) {
            return;
        }

        // During steal, only opposing team can answer AND only ONE attempt allowed
        if (this.state.phase === 'steal') {
            if (player.teamId === this.state.controllingTeam) {
                return; // Controlling team can't steal
            }
            if (this.state.stealAttempted) {
                return; // Only one steal attempt allowed per official rules
            }
            // Mark steal as attempted immediately to prevent race conditions
            this.state.stealAttempted = true;
        }

        const result = await this.validateAnswer(answer);

        if (result.index >= 0 && !this.state.answers[result.index].revealed) {
            // Correct answer
            this.state.answers[result.index].revealed = true;
            this.state.pointsOnBoard = this.state.calculatePointsOnBoard();

            // Add points to player's individual score
            const earnedPoints = result.points * this.state.pointMultiplier;
            player.score = (player.score || 0) + earnedPoints;

            this.state.message = `${result.answer} - ${result.points} points!`;

            this.state.logEvent('answer', client.sessionId, player.teamId, {
                answer,
                matched: result.answer,
                points: result.points,
                correct: true
            });

            // Check if stealing team got it right
            if (this.state.phase === 'steal') {
                // Successful steal - award all points to stealing team
                this.state.controllingTeam = player.teamId;
                this.awardPoints();
                return;
            }

            // Check if all answers revealed
            if (this.state.allAnswersRevealed()) {
                this.awardPoints();
            }
        } else {
            // Wrong answer
            if (this.state.phase === 'steal') {
                // Failed steal - points stay with original controlling team (who got 3 strikes)
                // Per official rules: only ONE steal attempt is allowed
                this.state.message = 'Steal failed! Points go to ' + this.state.teams.get(this.state.controllingTeam)?.name + '!';
                // controllingTeam is still the original team, award them the points
                this.awardPoints();
            } else {
                // Regular play - automatic strike per official Family Feud rules
                this.state.strikes++;
                this.state.message = `"${answer}" is not on the board! Strike ${this.state.strikes}!`;

                this.state.logEvent('strike', client.sessionId, this.state.controllingTeam, {
                    strikes: this.state.strikes,
                    wrongAnswer: answer
                });

                // Three strikes - other team can steal
                if (this.state.strikes >= 3) {
                    this.state.phase = 'steal';
                    const opposingTeamId = this.state.controllingTeam === 'team1' ? 'team2' : 'team1';
                    this.state.message = `Three strikes! ${this.state.teams.get(opposingTeamId).name} can steal!`;
                }
            }

            this.state.logEvent('answer', client.sessionId, player.teamId, {
                answer,
                correct: false
            });
        }
    }

    /**
     * Player toggles ready state
     */
    handlePlayerReady(client, message) {
        const player = this.state.players.get(client.sessionId);
        if (player) {
            player.isReady = !player.isReady;
        }
    }

    /**
     * Player switches teams
     */
    handleSwitchTeam(client, message) {
        if (this.state.phase !== 'lobby') return;

        const player = this.state.players.get(client.sessionId);
        if (!player) return;

        const currentTeam = this.state.teams.get(player.teamId);
        const newTeamId = player.teamId === 'team1' ? 'team2' : 'team1';
        const newTeam = this.state.teams.get(newTeamId);

        // Remove from current team
        const index = currentTeam.players.findIndex(p => p.odId === player.odId);
        if (index !== -1) {
            currentTeam.players.splice(index, 1);
        }

        // Add to new team
        player.teamId = newTeamId;
        newTeam.players.push(player);
    }

    // ==================== HELPER METHODS ====================

    /**
     * Load a random question from the database
     */
    async loadQuestion() {
        try {
            // Get answer count based on round
            const minAnswers = 3;
            const maxAnswers = 8;

            const count = await QuestionModel.countDocuments({});
            if (count === 0) {
                console.error('No questions in database');
                return;
            }

            const random = Math.floor(Math.random() * count);
            const question = await QuestionModel.findOne().skip(random);

            if (!question) {
                console.error('Failed to load question');
                return;
            }

            // Set question in state
            this.state.questionId = question._id.toString();
            this.state.questionText = question.text || question.question;
            this.state.totalAnswers = question.answers.length;

            // Clear and populate answers
            this.state.answers.clear();
            question.answers.forEach((ans, idx) => {
                const answer = new Answer();
                answer.index = idx;
                answer.text = ans.text || ans.answer;
                answer.points = ans.points;
                answer.revealed = false;
                this.state.answers.push(answer);
            });

            console.log(`Loaded question: ${this.state.questionText}`);
        } catch (err) {
            console.error('Error loading question:', err);
        }
    }

    /**
     * Validate an answer using AI service
     */
    async validateAnswer(userAnswer) {
        try {
            // Convert state answers to format expected by AIValidationService
            const answers = [];
            for (let i = 0; i < this.state.answers.length; i++) {
                const ans = this.state.answers[i];
                answers.push({
                    text: ans.text,
                    points: ans.points,
                    revealed: ans.revealed
                });
            }

            // Use AI service for fuzzy matching
            const result = await AIValidationService.validateAnswer(
                this.state.questionText,
                answers,
                userAnswer
            );

            return result;
        } catch (err) {
            console.error('Answer validation error:', err);
            return { index: -1, answer: null, points: null };
        }
    }

    /**
     * Award points to the controlling team and end the round.
     * Points = sum of revealed answers × round multiplier.
     * Triggers 5-second auto-advance to next round or game over.
     */
    awardPoints() {
        const team = this.state.teams.get(this.state.controllingTeam);
        if (!team) return;

        const points = this.state.pointsOnBoard;
        team.score = points;
        team.totalScore += points;

        this.state.phase = 'roundEnd';
        this.state.message = `${team.name} wins ${points} points!`;

        this.state.logEvent('pointsAwarded', '', this.state.controllingTeam, {
            points,
            totalScore: team.totalScore
        });

        // Automatically advance to next round after showing results (5 seconds)
        setTimeout(() => {
            this.autoAdvanceRound();
        }, 5000);
    }

    /**
     * Automatically advance to next round or end game.
     * Called 5 seconds after round ends. Checks if we've completed
     * all 4 rounds to determine winner, otherwise starts next round.
     */
    autoAdvanceRound() {
        // Only advance if still in roundEnd phase (host hasn't manually intervened)
        if (this.state.phase !== 'roundEnd') return;

        const maxRounds = 4;

        if (this.state.currentRound >= maxRounds) {
            // Game over - determine winner
            const team1 = this.state.teams.get('team1');
            const team2 = this.state.teams.get('team2');

            if (team1.totalScore > team2.totalScore) {
                this.state.winningTeam = 'team1';
            } else if (team2.totalScore > team1.totalScore) {
                this.state.winningTeam = 'team2';
            } else {
                this.state.winningTeam = ''; // Tie
            }

            this.state.phase = 'gameOver';
            this.state.gameEndReason = 'All rounds completed';
            this.state.message = this.state.winningTeam
                ? `${this.state.teams.get(this.state.winningTeam).name} wins the game!`
                : "It's a tie!";

            this.state.logEvent('gameOver', '', this.state.winningTeam, {
                team1Score: team1.totalScore,
                team2Score: team2.totalScore,
                reason: 'rounds_completed'
            });
        } else {
            // Advance to next round
            this.startNextRound();
        }
    }

    /**
     * Start the next round with a fresh face-off.
     * Resets all round state including buzzer, strikes, and team control.
     * Each round behaves identically: face-off → play/pass → play → steal → round end.
     * Only difference is the point multiplier (1x, 2x, or 3x).
     */
    startNextRound() {
        this.state.currentRound++;

        const team1 = this.state.teams.get('team1');
        const team2 = this.state.teams.get('team2');

        // Set up next round config (multiplier applies to points)
        const config = ROUND_CONFIG[this.state.currentRound];
        this.state.roundType = config.type;
        this.state.pointMultiplier = config.multiplier;

        // Reset round state
        this.state.strikes = 0;
        this.state.stealAttempted = false;
        this.state.pointsOnBoard = 0;
        this.state.controllingTeam = '';
        this.state.faceoffWinner = '';
        this.state.answers.clear();

        // Reset team round scores and control flags
        team1.score = 0;
        team2.score = 0;
        team1.hasControl = false;
        team2.hasControl = false;

        // Reset face-off state (clears all faceoff-related fields)
        this.resetFaceoffState();

        // Reset buzzer for new faceoff (same as round 1)
        this.state.buzzer.active = false; // Will be activated after question loads
        this.state.buzzer.locked = false;
        this.state.buzzer.winnerId = '';
        this.state.buzzer.timestamps.clear();

        // Load new question and start faceoff
        this.loadQuestion().then(() => {
            this.state.phase = 'faceoff';
            this.state.buzzer.active = true; // Activate buzzer after question is ready

            const multiplierText = this.state.pointMultiplier > 1
                ? ` (${this.state.pointMultiplier}x points!)`
                : '';
            this.state.message = `Round ${this.state.currentRound} - Face off!${multiplierText}`;

            this.state.logEvent('roundStart', '', '', {
                round: this.state.currentRound,
                type: this.state.roundType,
                multiplier: this.state.pointMultiplier
            });
        });
    }

    // ==================== FAST MONEY HANDLERS ====================

    /**
     * Host starts Fast Money round
     */
    async handleStartFastMoney(client, message) {
        if (!this.isHost(client)) return;

        // Determine winning team (team with higher score)
        const team1 = this.state.teams.get('team1');
        const team2 = this.state.teams.get('team2');
        const winningTeamId = team1.totalScore >= team2.totalScore ? 'team1' : 'team2';

        // Store winning team for Fast Money
        this.state.controllingTeam = winningTeamId;

        // Load 5 questions for Fast Money
        await this.loadFastMoneyQuestions();

        // Initialize Fast Money state
        this.state.fastMoney.currentPlayer = 1;
        this.state.fastMoney.currentQuestionIndex = 0;
        this.state.fastMoney.player1Total = 0;
        this.state.fastMoney.player2Total = 0;
        this.state.fastMoney.player1Answers.clear();
        this.state.fastMoney.player2Answers.clear();
        this.state.fastMoney.timerSeconds = 20;

        // Set phase
        this.state.phase = 'fastMoney';
        this.state.roundType = 'fastMoney';
        this.state.message = `Fast Money! ${this.state.teams.get(winningTeamId).name} select two players!`;

        this.state.logEvent('fastMoneyStart', client.sessionId, winningTeamId, {});
    }

    /**
     * Host selects players for Fast Money
     */
    handleSelectFastMoneyPlayers(client, message) {
        if (!this.isHost(client)) return;
        if (this.state.phase !== 'fastMoney') return;

        const { player1Id, player2Id } = message;

        this.state.fastMoney.player1Id = player1Id;
        this.state.fastMoney.player2Id = player2Id;

        const player1 = this.state.players.get(player1Id);
        const player2 = this.state.players.get(player2Id);

        this.state.message = `${player1?.name || 'Player 1'} goes first! ${player2?.name || 'Player 2'} please look away.`;

        this.state.logEvent('fastMoneyPlayersSelected', client.sessionId, '', {
            player1Id,
            player2Id
        });
    }

    /**
     * Host starts the Fast Money timer
     */
    handleStartFastMoneyTimer(client, message) {
        if (!this.isHost(client)) return;
        if (this.state.phase !== 'fastMoney') return;

        const currentPlayer = this.state.fastMoney.currentPlayer;

        // Player 1 gets 20 seconds, Player 2 gets 25 seconds
        this.state.fastMoney.timerSeconds = currentPlayer === 1 ? 20 : 25;

        // Start timer
        this.state.timer.active = true;
        this.state.timer.endTime = Date.now() + (this.state.fastMoney.timerSeconds * 1000);

        // Set current question
        if (this.state.fastMoney.questions.length > 0) {
            const question = this.state.fastMoney.questions[0];
            this.state.questionText = question.text;
            this.state.questionId = question.questionId;
        }

        const playerId = currentPlayer === 1
            ? this.state.fastMoney.player1Id
            : this.state.fastMoney.player2Id;
        const player = this.state.players.get(playerId);

        this.state.message = `GO! ${player?.name || `Player ${currentPlayer}`}!`;

        // Set up timer interval
        this.startFastMoneyTimer();

        this.state.logEvent('fastMoneyTimerStart', client.sessionId, '', {
            player: currentPlayer,
            seconds: this.state.fastMoney.timerSeconds
        });
    }

    /**
     * Start the Fast Money countdown timer
     */
    startFastMoneyTimer() {
        if (this.fastMoneyTimerInterval) {
            clearInterval(this.fastMoneyTimerInterval);
        }

        this.fastMoneyTimerInterval = setInterval(() => {
            if (!this.state.timer.active) {
                clearInterval(this.fastMoneyTimerInterval);
                return;
            }

            const remaining = Math.max(0, Math.ceil((this.state.timer.endTime - Date.now()) / 1000));
            this.state.fastMoney.timerSeconds = remaining;

            if (remaining <= 0) {
                clearInterval(this.fastMoneyTimerInterval);
                this.state.timer.active = false;
                this.state.message = "Time's up!";

                // Fill in any unanswered questions with empty answers
                this.fillEmptyFastMoneyAnswers();
            }
        }, 100);
    }

    /**
     * Fill empty answers for unanswered Fast Money questions
     */
    fillEmptyFastMoneyAnswers() {
        const currentPlayer = this.state.fastMoney.currentPlayer;
        const answers = currentPlayer === 1
            ? this.state.fastMoney.player1Answers
            : this.state.fastMoney.player2Answers;

        // Fill remaining questions with empty answers
        for (let i = answers.length; i < 5; i++) {
            const emptyAnswer = new FastMoneyAnswer();
            emptyAnswer.questionIndex = i;
            emptyAnswer.answer = '';
            emptyAnswer.points = 0;
            emptyAnswer.revealed = false;
            answers.push(emptyAnswer);
        }
    }

    /**
     * Player submits a Fast Money answer
     */
    async handleFastMoneyAnswer(client, message) {
        if (this.state.phase !== 'fastMoney') return;
        if (!this.state.timer.active) return;

        const { answer } = message;
        const currentPlayer = this.state.fastMoney.currentPlayer;
        const expectedPlayerId = currentPlayer === 1
            ? this.state.fastMoney.player1Id
            : this.state.fastMoney.player2Id;

        // Only the current Fast Money player can answer
        if (client.sessionId !== expectedPlayerId) return;

        const answers = currentPlayer === 1
            ? this.state.fastMoney.player1Answers
            : this.state.fastMoney.player2Answers;

        const questionIndex = this.state.fastMoney.currentQuestionIndex;

        // Don't allow answering same question twice
        if (answers.some(a => a.questionIndex === questionIndex)) return;

        // Get current question from loaded questions
        const currentQuestion = this.state.fastMoney.questions[questionIndex];
        if (!currentQuestion) return;

        // Validate answer against question's answers
        const result = await this.validateFastMoneyAnswer(currentQuestion.questionId, answer);

        // Create answer record
        const fmAnswer = new FastMoneyAnswer();
        fmAnswer.questionIndex = questionIndex;
        fmAnswer.answer = answer;
        fmAnswer.points = result.points || 0;
        fmAnswer.revealed = false;
        answers.push(fmAnswer);

        // Move to next question
        this.state.fastMoney.currentQuestionIndex++;

        if (this.state.fastMoney.currentQuestionIndex < 5) {
            // Load next question text
            const nextQuestion = this.state.fastMoney.questions[this.state.fastMoney.currentQuestionIndex];
            this.state.questionText = nextQuestion.text;
            this.state.questionId = nextQuestion.questionId;
        } else {
            // All 5 questions answered - stop timer
            clearInterval(this.fastMoneyTimerInterval);
            this.state.timer.active = false;
            this.state.message = currentPlayer === 1
                ? 'Player 1 finished! Time for reveals.'
                : 'Player 2 finished! Time for final reveals.';
        }

        this.state.logEvent('fastMoneyAnswer', client.sessionId, '', {
            questionIndex,
            answer,
            points: result.points
        });
    }

    /**
     * Validate a Fast Money answer
     */
    async validateFastMoneyAnswer(questionId, userAnswer) {
        try {
            // Load the question from database
            const question = await QuestionModel.findById(questionId);
            if (!question) {
                return { index: -1, answer: null, points: 0 };
            }

            // Convert answers to format for validation
            const answers = question.answers.map(a => ({
                text: a.text || a.answer,
                points: a.points
            }));

            // Use AI validation
            const result = await AIValidationService.validateAnswer(
                question.text || question.question,
                answers,
                userAnswer
            );

            return result;
        } catch (err) {
            console.error('Fast Money validation error:', err);
            return { index: -1, answer: null, points: 0 };
        }
    }

    /**
     * Host reveals a Fast Money answer
     */
    handleRevealFastMoneyAnswer(client, message) {
        if (!this.isHost(client)) return;
        if (this.state.phase !== 'fastMoney') return;

        const { playerNum, questionIndex } = message;

        const answers = playerNum === 1
            ? this.state.fastMoney.player1Answers
            : this.state.fastMoney.player2Answers;

        const answer = answers.find(a => a.questionIndex === questionIndex);
        if (answer && !answer.revealed) {
            answer.revealed = true;

            // Update total
            if (playerNum === 1) {
                this.state.fastMoney.player1Total += answer.points;
            } else {
                this.state.fastMoney.player2Total += answer.points;
            }

            this.state.logEvent('fastMoneyReveal', client.sessionId, '', {
                playerNum,
                questionIndex,
                points: answer.points
            });
        }
    }

    /**
     * Host moves to next Fast Money question (for reveals) or player 2
     */
    handleNextFastMoneyQuestion(client, message) {
        if (!this.isHost(client)) return;
        if (this.state.phase !== 'fastMoney') return;

        // If player 1 just finished, switch to player 2
        if (this.state.fastMoney.currentPlayer === 1 &&
            this.state.fastMoney.player1Answers.length >= 5) {

            // Check if all answers are revealed
            const allRevealed = this.state.fastMoney.player1Answers.every(a => a.revealed);

            if (allRevealed) {
                // Switch to player 2
                this.state.fastMoney.currentPlayer = 2;
                this.state.fastMoney.currentQuestionIndex = 0;
                this.state.fastMoney.timerSeconds = 25;

                const player2 = this.state.players.get(this.state.fastMoney.player2Id);
                this.state.message = `${player2?.name || 'Player 2'}'s turn! Get ready...`;

                this.state.logEvent('fastMoneyPlayer2Start', client.sessionId, '', {});
            }
        }
    }

    /**
     * Host ends Fast Money round
     */
    handleEndFastMoney(client, message) {
        if (!this.isHost(client)) return;
        if (this.state.phase !== 'fastMoney') return;

        // Stop any running timer
        if (this.fastMoneyTimerInterval) {
            clearInterval(this.fastMoneyTimerInterval);
        }
        this.state.timer.active = false;

        // Calculate final total
        const totalPoints = this.state.fastMoney.player1Total + this.state.fastMoney.player2Total;

        // Check if they won (200+ points)
        const winningTeam = this.state.teams.get(this.state.controllingTeam);
        const won = totalPoints >= 200;

        if (won) {
            // Award bonus points to team
            winningTeam.totalScore += totalPoints;
        }

        this.state.logEvent('fastMoneyEnd', client.sessionId, this.state.controllingTeam, {
            totalPoints,
            won,
            player1Total: this.state.fastMoney.player1Total,
            player2Total: this.state.fastMoney.player2Total
        });

        // End the game with proper winner determination
        this.endGameWithWinner('fastMoney');
    }

    /**
     * Load 5 random questions for Fast Money
     */
    async loadFastMoneyQuestions() {
        try {
            this.state.fastMoney.questions.clear();

            // Get 5 random questions
            const questions = await QuestionModel.aggregate([
                { $sample: { size: 5 } }
            ]);

            questions.forEach((q, idx) => {
                const fmQuestion = new FastMoneyQuestion();
                fmQuestion.questionId = q._id.toString();
                fmQuestion.text = q.text || q.question;
                this.state.fastMoney.questions.push(fmQuestion);
            });

            console.log(`Loaded ${questions.length} Fast Money questions`);
        } catch (err) {
            console.error('Error loading Fast Money questions:', err);
        }
    }

    // ==================== GAME COMPLETION HANDLERS ====================

    /**
     * Determine and set the winning team
     */
    endGameWithWinner(reason) {
        const team1 = this.state.teams.get('team1');
        const team2 = this.state.teams.get('team2');

        // Determine winner
        if (team1.totalScore > team2.totalScore) {
            this.state.winningTeam = 'team1';
            this.state.message = `🎉 ${team1.name} WINS with ${team1.totalScore} points!`;
        } else if (team2.totalScore > team1.totalScore) {
            this.state.winningTeam = 'team2';
            this.state.message = `🎉 ${team2.name} WINS with ${team2.totalScore} points!`;
        } else {
            this.state.winningTeam = '';
            this.state.message = `It's a TIE! Both teams have ${team1.totalScore} points!`;
        }

        this.state.gameEndReason = reason;
        this.state.phase = 'gameOver';

        this.state.logEvent('gameEnd', this.state.hostId, this.state.winningTeam, {
            reason,
            team1Score: team1.totalScore,
            team2Score: team2.totalScore,
            winner: this.state.winningTeam
        });
    }

    /**
     * Host initiates a new game with the same players
     */
    async handlePlayAgain(client, message) {
        if (!this.isHost(client)) return;
        if (this.state.phase !== 'gameOver') return;

        // Reset game state while keeping players and teams
        this.state.phase = 'lobby';
        this.state.currentRound = 1;
        this.state.roundType = 'single';
        this.state.pointMultiplier = 1;
        this.state.questionId = '';
        this.state.questionText = '';
        this.state.totalAnswers = 0;
        this.state.strikes = 0;
        this.state.stealAttempted = false;
        this.state.pointsOnBoard = 0;
        this.state.controllingTeam = '';
        this.state.faceoffWinner = '';
        this.state.faceoffPlayer1 = '';
        this.state.faceoffPlayer2 = '';
        this.state.winningTeam = '';
        this.state.gameEndReason = '';
        this.state.message = 'New game! Waiting for host to start...';

        // Reset team scores
        const team1 = this.state.teams.get('team1');
        const team2 = this.state.teams.get('team2');
        if (team1) {
            team1.score = 0;
            team1.totalScore = 0;
            team1.hasControl = false;
        }
        if (team2) {
            team2.score = 0;
            team2.totalScore = 0;
            team2.hasControl = false;
        }

        // Reset player scores and ready states
        for (const player of this.state.players.values()) {
            player.score = 0;
            player.isReady = false;
        }

        // Clear answers
        this.state.answers.clear();

        // Reset buzzer
        this.state.buzzer.active = false;
        this.state.buzzer.locked = false;
        this.state.buzzer.winnerId = '';
        this.state.buzzer.timestamps.clear();

        // Reset timer
        this.state.timer.active = false;
        this.state.timer.endTime = 0;

        // Reset Fast Money
        this.state.fastMoney.player1Id = '';
        this.state.fastMoney.player2Id = '';
        this.state.fastMoney.player1Answers.clear();
        this.state.fastMoney.player2Answers.clear();
        this.state.fastMoney.player1Total = 0;
        this.state.fastMoney.player2Total = 0;
        this.state.fastMoney.currentPlayer = 1;
        this.state.fastMoney.currentQuestionIndex = 0;
        this.state.fastMoney.timerSeconds = 20;
        this.state.fastMoney.questions.clear();

        this.state.logEvent('playAgain', client.sessionId, '', {});

        this.broadcast('playAgain', {});
    }

    /**
     * Host ends the game session (kicks everyone)
     */
    handleEndGame(client, message) {
        if (!this.isHost(client)) return;

        this.state.message = 'Game ended by host. Thanks for playing!';
        this.state.logEvent('gameEnded', client.sessionId, '', {});

        // Broadcast final message then disconnect all clients
        this.broadcast('gameEnded', { message: 'Game ended by host' });

        // Disconnect all clients gracefully after a short delay
        setTimeout(() => {
            this.disconnect();
        }, 2000);
    }

    // ==================== SPECTATOR HANDLERS ====================

    /**
     * Toggle spectator mode for a player
     * Spectators can watch but not participate
     */
    handleToggleSpectator(client) {
        const player = this.state.players.get(client.sessionId);
        if (!player) return;

        // Can't toggle spectator mode during active game (only in lobby)
        if (this.state.phase !== 'lobby' && this.state.phase !== 'gameOver') {
            return;
        }

        // Host cannot become spectator
        if (player.isHost) {
            return;
        }

        // Toggle spectator status
        player.isSpectator = !player.isSpectator;

        if (player.isSpectator) {
            // Remove from team when becoming spectator
            const team = this.state.teams.get(player.teamId);
            if (team) {
                const index = team.players.findIndex(p => p.odId === player.odId);
                if (index !== -1) {
                    team.players.splice(index, 1);
                }
            }
            player.teamId = '';
            player.isReady = false;
        } else {
            // Assign to team with fewer players when joining game
            const team1 = this.state.teams.get('team1');
            const team2 = this.state.teams.get('team2');

            if (team1.players.length <= team2.players.length) {
                player.teamId = 'team1';
                team1.players.push(player);
            } else {
                player.teamId = 'team2';
                team2.players.push(player);
            }
        }

        this.state.logEvent('spectatorToggle', client.sessionId, player.teamId, {
            isSpectator: player.isSpectator
        });
    }

    // ==================== LOBBY MANAGEMENT HANDLERS ====================

    /**
     * Host kicks a player from the game
     */
    handleKickPlayer(client, message) {
        if (!this.isHost(client)) return;

        // Can only kick during lobby phase
        if (this.state.phase !== 'lobby') {
            return;
        }

        const { sessionId } = message;
        if (!sessionId) return;

        // Can't kick yourself (the host)
        if (sessionId === client.sessionId) {
            return;
        }

        const player = this.state.players.get(sessionId);
        if (!player) return;

        // Remove from team
        const team = this.state.teams.get(player.teamId);
        if (team) {
            const index = team.players.findIndex(p => p.odId === player.odId);
            if (index !== -1) {
                team.players.splice(index, 1);
            }
        }

        // Remove from players map
        this.state.players.delete(sessionId);

        // Log event
        this.state.logEvent('kickPlayer', client.sessionId, player.teamId, {
            kickedPlayer: player.name,
            kickedSessionId: sessionId
        });

        // Notify the kicked player
        const kickedClient = this.clients.find(c => c.sessionId === sessionId);
        if (kickedClient) {
            kickedClient.send('kicked', { reason: 'Removed by host' });
            kickedClient.leave(1000); // Normal close
        }

        // Broadcast to room
        this.broadcast('playerKicked', {
            sessionId,
            name: player.name
        });
    }

    /**
     * Host shuffles team assignments randomly
     */
    handleShuffleTeams(client) {
        if (!this.isHost(client)) return;

        // Can only shuffle during lobby phase
        if (this.state.phase !== 'lobby') {
            return;
        }

        const team1 = this.state.teams.get('team1');
        const team2 = this.state.teams.get('team2');

        // Collect all non-spectator players
        const allPlayers = [];
        this.state.players.forEach((player, sessionId) => {
            if (!player.isSpectator) {
                allPlayers.push({ sessionId, player });
            }
        });

        // Clear current team rosters
        team1.players.clear();
        team2.players.clear();

        // Shuffle players using Fisher-Yates algorithm
        for (let i = allPlayers.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [allPlayers[i], allPlayers[j]] = [allPlayers[j], allPlayers[i]];
        }

        // Distribute shuffled players evenly
        allPlayers.forEach(({ player }, index) => {
            if (index % 2 === 0) {
                player.teamId = 'team1';
                team1.players.push(player);
            } else {
                player.teamId = 'team2';
                team2.players.push(player);
            }
            // Reset ready state after shuffle
            player.isReady = false;
        });

        // Log event
        this.state.logEvent('shuffleTeams', client.sessionId, '', {
            team1Count: team1.players.length,
            team2Count: team2.players.length
        });

        // Broadcast to room
        this.broadcast('teamsShuffled', {});
    }
}
