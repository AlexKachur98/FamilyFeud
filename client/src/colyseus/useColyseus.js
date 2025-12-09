/**
 * @file useColyseus.js
 * @author Alex Kachur
 * @since 2025-12-09
 * @description React hook for Colyseus room connection management.
 *
 * Provides:
 * - Room creation and joining (by ID or 6-digit code)
 * - Automatic state synchronization via onStateChange
 * - Reconnection support using localStorage tokens
 * - Clean disconnect handling with proper token cleanup
 */
import { useRef, useState, useEffect, useCallback } from 'react';
import { colyseusClient } from './client';

/** LocalStorage key for reconnection token */
const RECONNECTION_KEY = 'familyfeud_reconnection';
/** LocalStorage key for room ID */
const ROOM_ID_KEY = 'familyfeud_room_id';

/**
 * React hook for Colyseus room connection.
 * Manages room lifecycle, state sync, and automatic reconnection.
 * @returns {Object} Room state and action methods
 */
export function useColyseus() {
    const roomRef = useRef(null);
    const [gameState, setGameState] = useState(null);
    const [error, setError] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (roomRef.current) {
                roomRef.current.leave();
                roomRef.current = null;
            }
        };
    }, []);

    /**
     * Set up room event listeners
     */
    const setupRoomListeners = useCallback((room) => {
        roomRef.current = room;

        // Store reconnection token and room ID
        localStorage.setItem(RECONNECTION_KEY, room.reconnectionToken);
        localStorage.setItem(ROOM_ID_KEY, room.roomId);

        // State change listener - fires on every state update
        room.onStateChange((state) => {
            // Create a plain object snapshot for React
            setGameState(state.toJSON ? state.toJSON() : state);
        });

        // Room leave listener
        room.onLeave((code) => {
            console.log('Left room with code:', code);
            setIsConnected(false);
            roomRef.current = null;

            // Clear reconnection tokens for certain leave codes where reconnection isn't possible
            // 1000 = Normal closure (intentional leave)
            // 4000+ = Application-specific errors (room disposed, kicked, etc.)
            if (code === 1000 || code >= 4000) {
                localStorage.removeItem(RECONNECTION_KEY);
                localStorage.removeItem(ROOM_ID_KEY);
                console.log('Cleared reconnection tokens (room closed or player kicked)');
            } else if (code >= 1001 && code <= 1015) {
                // Abnormal closure - could attempt reconnect
                console.log('Abnormal disconnect, reconnection may be possible');
            }
        });

        // Error listener
        room.onError((code, message) => {
            console.error('Room error:', code, message);
            setError({ code, message });
        });

        setIsConnected(true);
        setIsConnecting(false);
        setError(null);
    }, []);

    /**
     * Create a new game room (host)
     */
    const createRoom = useCallback(async (options = {}) => {
        setIsConnecting(true);
        setError(null);

        try {
            const room = await colyseusClient.create('family_feud', options);
            setupRoomListeners(room);
            return room;
        } catch (err) {
            console.error('Failed to create room:', err);
            setError({ message: err.message || 'Failed to create room' });
            setIsConnecting(false);
            return null;
        }
    }, [setupRoomListeners]);

    /**
     * Join an existing room by room ID
     */
    const joinRoom = useCallback(async (roomId, options = {}) => {
        setIsConnecting(true);
        setError(null);

        try {
            const room = await colyseusClient.joinById(roomId, options);
            setupRoomListeners(room);
            return room;
        } catch (err) {
            console.error('Failed to join room:', err);
            setError({ message: err.message || 'Failed to join room' });
            setIsConnecting(false);
            return null;
        }
    }, [setupRoomListeners]);

    /**
     * Join a room by room code (uses server API to find room)
     */
    const joinByCode = useCallback(async (roomCode, options = {}) => {
        setIsConnecting(true);
        setError(null);

        try {
            // Use server API to find room by code
            const apiUrl = import.meta.env.PROD
                ? (import.meta.env.VITE_SERVER_URL || 'https://familyfeud-server.onrender.com')
                : 'http://localhost:3000';

            const response = await fetch(`${apiUrl}/api/v1/rooms/find/${roomCode}`, {
                credentials: 'include'
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Room not found');
            }

            const { roomId } = await response.json();

            const room = await colyseusClient.joinById(roomId, options);
            setupRoomListeners(room);
            return room;
        } catch (err) {
            console.error('Failed to join room by code:', err);
            setError({ message: err.message || 'Room not found' });
            setIsConnecting(false);
            return null;
        }
    }, [setupRoomListeners]);

    /**
     * Attempt to reconnect using stored token
     */
    const tryReconnect = useCallback(async () => {
        const token = localStorage.getItem(RECONNECTION_KEY);
        if (!token) {
            return false;
        }

        setIsConnecting(true);
        setError(null);

        try {
            const room = await colyseusClient.reconnect(token);
            setupRoomListeners(room);
            console.log('Successfully reconnected');
            return true;
        } catch (err) {
            console.log('Reconnection failed:', err.message);
            // Clear stored tokens on failure
            localStorage.removeItem(RECONNECTION_KEY);
            localStorage.removeItem(ROOM_ID_KEY);
            setIsConnecting(false);
            return false;
        }
    }, [setupRoomListeners]);

    /**
     * Leave the current room
     */
    const leaveRoom = useCallback((consented = true) => {
        if (roomRef.current) {
            roomRef.current.leave(consented);
            roomRef.current = null;
            setIsConnected(false);
            setGameState(null);

            // Clear reconnection data if leaving intentionally
            if (consented) {
                localStorage.removeItem(RECONNECTION_KEY);
                localStorage.removeItem(ROOM_ID_KEY);
            }
        }
    }, []);

    /**
     * Send a message to the room
     */
    const send = useCallback((type, data) => {
        if (roomRef.current) {
            roomRef.current.send(type, data);
        } else {
            console.warn('Cannot send message: not connected to room');
        }
    }, []);

    /**
     * Get the current room instance
     */
    const getRoom = useCallback(() => roomRef.current, []);

    return {
        // State
        room: roomRef.current,
        gameState,
        error,
        isConnected,
        isConnecting,

        // Actions
        createRoom,
        joinRoom,
        joinByCode,
        tryReconnect,
        leaveRoom,
        send,
        getRoom
    };
}

export default useColyseus;
