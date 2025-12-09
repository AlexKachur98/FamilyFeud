import { Server, matchMaker } from 'colyseus';
import { WebSocketTransport } from '@colyseus/ws-transport';
import { monitor } from '@colyseus/monitor';

import { FamilyFeudRoom } from './rooms/FamilyFeudRoom.js';

/**
 * Initialize Colyseus game server
 * @param {import('http').Server} httpServer - The HTTP server instance to attach to
 * @param {import('express').Application} app - Express app for monitor routes
 * @returns {Server} Colyseus game server instance
 */
export function initializeColyseus(httpServer, app) {
    const gameServer = new Server({
        transport: new WebSocketTransport({
            server: httpServer
        })
    });

    // Register the Family Feud game room
    gameServer
        .define('family_feud', FamilyFeudRoom)
        .enableRealtimeListing();

    // API endpoint to find a room by room code
    app.get('/api/v1/rooms/find/:roomCode', async (req, res) => {
        try {
            const { roomCode } = req.params;

            // Query for rooms with matching roomCode in metadata
            const rooms = await matchMaker.query({ name: 'family_feud' });
            const targetRoom = rooms.find(room => room.metadata?.roomCode === roomCode);

            if (!targetRoom) {
                return res.status(404).json({ error: 'Room not found' });
            }

            res.json({
                roomId: targetRoom.roomId,
                roomCode: targetRoom.metadata.roomCode,
                clients: targetRoom.clients,
                maxClients: targetRoom.maxClients
            });
        } catch (err) {
            console.error('Error finding room:', err);
            res.status(500).json({ error: 'Failed to find room' });
        }
    });

    // Mount Colyseus monitor panel for debugging (only in development)
    if (process.env.NODE_ENV !== 'production') {
        app.use('/colyseus', monitor());
    }

    console.log('Colyseus game server initialized');

    return gameServer;
}

export { FamilyFeudRoom };
