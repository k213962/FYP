// STUB: This file replaces the previous socket.js implementation with dummy functions
// to maintain compatibility while we migrate to a polling-based approach

const stubSocketService = {
  // Stub method for joining a room
  joinRoom: (socketId, roomId) => {
    console.log(`[SOCKET-STUB] Ignoring joinRoom request: ${socketId} to ${roomId}`);
    return null;
  },
  
  // Stub method for leaving a room
  leaveRoom: (socketId, roomId) => {
    console.log(`[SOCKET-STUB] Ignoring leaveRoom request: ${socketId} from ${roomId}`);
    return null;
  },
  
  // Stub method for sending a message to a room
  emitToRoom: (roomId, event, data) => {
    console.log(`[SOCKET-STUB] Ignoring emitToRoom request to ${roomId} with event ${event}`);
    return null;
  },
  
  // Stub method for sending a message to a specific socket
  emitToSocket: (socketId, event, data) => {
    console.log(`[SOCKET-STUB] Ignoring emitToSocket request to ${socketId} with event ${event}`);
    return null;
  },
  
  // Stub method for broadcasting to all clients
  broadcast: (event, data) => {
    console.log(`[SOCKET-STUB] Ignoring broadcast request with event ${event}`);
    return null;
  },
  
  // Stub method to initialize socket.io
  initialize: (server) => {
    console.log('[SOCKET-STUB] Socket.io initialization bypassed - using polling instead');
            return {
      on: () => console.log('[SOCKET-STUB] Ignoring socket.on call')
            };
    }
}; 

module.exports = stubSocketService; 