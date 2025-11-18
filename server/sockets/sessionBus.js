let ioRef = null;

export function setIo(io) {
  ioRef = io;
}

export function broadcastSession(sessionId, payload) {
  if (!ioRef || !sessionId) return;
  ioRef.to(sessionId).emit('session:state', payload);
}
