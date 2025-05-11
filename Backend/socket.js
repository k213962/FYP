const socketIO = require('socket.io');
let io;

module.exports = {
    init: (server) => {
        io = socketIO(server, {
            cors: {
                origin: process.env.FRONTEND_URL || "http://localhost:3000",
                methods: ["GET", "POST"],
                credentials: true
            }
        });

        io.on('connection', (socket) => {
            console.log('New client connected');

            // Handle captain authentication
            socket.on('authenticate', (captainId) => {
                socket.join(captainId);
                console.log(`Captain ${captainId} authenticated`);
            });

            socket.on('disconnect', () => {
                console.log('Client disconnected');
            });
        });

        return io;
    },
    getIO: () => {
        if (!io) {
            throw new Error('Socket.io not initialized!');
        }
        return io;
    }
}; 