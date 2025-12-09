/**
 * @file client.js
 * @author Alex Kachur
 * @since 2025-12-09
 * @description Colyseus client singleton for WebSocket connections.
 * Automatically selects development (ws://localhost:3000) or production endpoint.
 */
import { Client } from 'colyseus.js';

/**
 * Determine WebSocket endpoint based on environment.
 * @returns {string} WebSocket URL for Colyseus server
 */
const getWsEndpoint = () => {
    if (import.meta.env.PROD) {
        // Production: Use secure WebSocket
        return import.meta.env.VITE_WS_URL || 'wss://familyfeud-server.onrender.com';
    }
    // Development: Use local server
    return 'ws://localhost:3000';
};

/**
 * Colyseus client singleton
 * Used to connect to game rooms
 */
export const colyseusClient = new Client(getWsEndpoint());

export default colyseusClient;
