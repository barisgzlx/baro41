const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(__dirname));

let rooms = { ffa1: {}, ffa2: {}, ffa3: {} };

io.on('connection', (socket) => {
    socket.on('join', (data) => {
        socket.join(data.room);
        socket.currentRoom = data.room;
        
        // Sadece izleyici değilse oyuncu datası oluştur
        if (!data.spectate) {
            rooms[data.room][socket.id] = {
                x: Math.random() * 2000 + 500,
                y: Math.random() * 2000 + 500,
                radius: 30,
                color: `hsl(${Math.random() * 360}, 100%, 50%)`,
                nick: data.nick
            };
        }
        io.to(data.room).emit('updatePlayers', rooms[data.room]);
    });

    socket.on('move', (data) => {
        const room = socket.currentRoom;
        if (room && rooms[room][socket.id]) {
            rooms[room][socket.id].x = data.x;
            rooms[room][socket.id].y = data.y;
            io.to(room).emit('updatePlayers', rooms[room]);
        }
    });

    socket.on('disconnect', () => {
        const room = socket.currentRoom;
        if (room && rooms[room] && rooms[room][socket.id]) {
            delete rooms[room][socket.id];
            io.to(room).emit('updatePlayers', rooms[room]);
        }
    });
});

server.listen(process.env.PORT || 3000);
