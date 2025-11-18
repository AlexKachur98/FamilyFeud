export const joinGameSession = (socket) => {

    socket.on("joinRoom", async (roomId, user, res) => {
        if (!user || !user._id) {
            return res?.(`Unauthorized join attempt.`, null);
        }
        try {
            const sessionMod = await import('../models/activeSession.model.js');
            const ActiveSession = sessionMod.default;
            const session = await ActiveSession.findOne({ id: roomId }).lean();
            const isMember = session?.teams?.some((t) => (t.players || []).some((p) => p.id?.toString() === user._id?.toString()));
            if (!session) return res?.('Session not found', null);
            // Allow lobby spectators to join the room to receive updates; enforce membership only after lobby?
            if (!isMember && session.status !== 'lobby') {
                return res?.('User not in session.', null);
            }
            socket.join(roomId);
            const fresh = await ActiveSession.findOne({ id: roomId }).lean();
            if (fresh) {
                // broadcast full state to everyone in the room, including the joiner
                socket.to(roomId).emit('session:state', fresh);
                socket.emit('session:state', fresh);
            }
            socket.broadcast.to(roomId).emit("userJoined", user.username);
            res?.(`Joined room ${roomId}.`, user);
        } catch (err) {
            res?.('Failed to join session.', null);
        }
    });

};

export const leaveGameSession = (socket) => {

    socket.on("leaveRoom", (roomId, user) => {
        socket.leave(roomId);
        console.log(`Socket ${socket.id} (${user.username} - ${user._id}) left room ${roomId}`);
        socket.broadcast.to(roomId).emit("userLeft", user.username);
    });

};

export const registerHostActions = (socket) => {
    socket.on("session:action", async (payload, res) => {
        try {
            const mod = await import('../controllers/gameSession.controller.js');
            const { handleSocketAction } = mod;
            const session = await handleSocketAction({
                ...payload,
                actorId: payload?.actorId || socket.id
            });
            res?.({ ok: true, session });
        } catch (err) {
            res?.({ ok: false, error: err.message });
        }
    });
};
