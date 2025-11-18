export const joinGameSession = (socket) => {

    socket.on("joinRoom", (roomId, user, res) => {
        socket.join(roomId);
        socket.broadcast.to(roomId).emit("userJoined", user.username);
        res(`Joined room ${roomId}.`, user);
    });

};

export const leaveGameSession = (socket) => {

    socket.on("leaveRoom", (roomId, user) => {
        socket.leave(roomId);
        console.log(`Socket ${socket.id} (${user.username} - ${user._id}) left room ${roomId}`);
        socket.broadcast.to(roomId).emit("userLeft", user.username);
    });

};