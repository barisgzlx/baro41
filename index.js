const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(__dirname));

let rooms = { ffa1: {}, ffa2: {} };

io.on('connection', (socket) => {
    socket.on('join', (roomName) => {
        socket.join(roomName);
        socket.currentRoom = roomName;
        rooms[roomName][socket.id] = { 
            x: 500, y: 500, radius: 20, 
            color: roomName === 'ffa1' ? 'dodgerblue' : 'limegreen' 
        };
        io.to(roomName).emit('updatePlayers', rooms[roomName]);
    });

    socket.on('move', (data) => {
        const room = socket.currentRoom;
        if (room && rooms[room][socket.id]) {
            rooms[room][socket.id].x = data.x;
            rooms[room][socket.id].y = data.y;
            rooms[room][socket.id].radius = data.radius;
            io.to(room).emit('updatePlayers', rooms[room]);
        }
    });

    socket.on('disconnect', () => {
        const room = socket.currentRoom;
        if (room && rooms[room][socket.id]) {
            delete rooms[room][socket.id];
            io.to(room).emit('updatePlayers', rooms[room]);
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log('Sistem Hazir!'));
