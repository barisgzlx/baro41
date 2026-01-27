const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(__dirname));

const worldSize = 3000;
let rooms = {
    ffa1: { players: {}, food: [] },
    ffa2: { players: {}, food: [] },
    ffa3: { players: {}, food: [] }
};

// Yemleri oluştur
Object.keys(rooms).forEach(r => {
    for(let i=0; i<400; i++) {
        rooms[r].food.push({
            id: i,
            x: Math.random() * worldSize,
            y: Math.random() * worldSize,
            color: `hsl(${Math.random() * 360}, 100%, 50%)`
        });
    }
});

io.on('connection', (socket) => {
    socket.on('join', (data) => {
        socket.join(data.room);
        socket.currentRoom = data.room;

        if (!rooms[data.room].players[socket.id]) {
            rooms[data.room].players[socket.id] = {
                x: worldSize / 2,
                y: worldSize / 2,
                radius: 30,
                color: `hsl(${Math.random() * 360}, 100%, 50%)`,
                nick: data.nick || "baro"
            };
        }
        
        // Önemli: Yemleri sadece katılan kişiye gönder
        socket.emit('initFood', rooms[data.room].food);
        io.to(data.room).emit('updatePlayers', rooms[data.room].players);
    });

    socket.on('move', (data) => {
        const room = socket.currentRoom;
        if (room && rooms[room] && rooms[room].players[socket.id]) {
            rooms[room].players[socket.id].x = data.x;
            rooms[room].players[socket.id].y = data.y;
            io.to(room).emit('updatePlayers', rooms[room].players);
        }
    });

    socket.on('disconnect', () => {
        if (socket.currentRoom && rooms[socket.currentRoom]) {
            delete rooms[socket.currentRoom].players[socket.id];
            io.to(socket.currentRoom).emit('updatePlayers', rooms[socket.currentRoom].players);
        }
    });
});

server.listen(process.env.PORT || 3000);
