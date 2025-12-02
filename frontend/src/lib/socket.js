import io from 'socket.io-client';

let socket = null;

export function getSocket() {
    if (!socket) {
        socket = io('http://localhost:5000/nari', {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 10
        });

        socket.on('connect', () => {
            console.log('Socket.IO connected to /nari namespace');
        });

        socket.on('disconnect', () => {
            console.log('Socket.IO disconnected');
        });
    }
    return socket;
}

export default getSocket;
