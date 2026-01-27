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
    ffa2: { players: {}, food: [] }
};

// Başlangıç yemleri
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
                score: 0,
                gold: 500, // Başlangıç altını
                nick: data.nick || "baro",
                color: `hsl(${Math.random() * 360}, 100%, 50%)`,
                mouseX: worldSize / 2,
                mouseY: worldSize / 2
            };
        }
        socket.emit('initFood', rooms[data.room].food);
    });

    // S Tuşu: 100 Gold harca -> 200 Skor al
    socket.on('buyScore', () => {
        const room = socket.currentRoom;
        const p = rooms[room]?.players[socket.id];
        if (p && p.gold >= 100) {
            p.gold -= 100;
            p.score += 200;
            p.radius += 5;
            io.to(room).emit('updatePlayers', rooms[room].players);
        }
    });

    socket.on('move', (data) => {
        const room = socket.currentRoom;
        if (room && rooms[room].players[socket.id]) {
            rooms[room].players[socket.id].mouseX = data.x;
            rooms[room].players[socket.id].mouseY = data.y;
        }
    });

    socket.on('disconnect', () => {
        if (socket.currentRoom && rooms[socket.currentRoom]) {
            delete rooms[socket.currentRoom].players[socket.id];
        }
    });
});

// Agarz Döngüsü (Hareket ve Yem Yeme)
setInterval(() => {
    Object.keys(rooms).forEach(roomName => {
        const room = rooms[roomName];
        Object.keys(room.players).forEach(id => {
            let p = room.players[id];
            let dx = p.mouseX - p.x;
            let dy = p.mouseY - p.y;
            let dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist > 5) {
                p.x += (dx / dist) * 4;
                p.y += (dy / dist) * 4;
            }

            // Sınır kontrolü
            p.x = Math.max(0, Math.min(worldSize, p.x));
            p.y = Math.max(0, Math.min(worldSize, p.y));

            // Yem yeme
            room.food = room.food.filter(f => {
                let fDist = Math.sqrt((p.x - f.x)**2 + (p.y - f.y)**2);
                if (fDist < p.radius) {
                    p.score += 1;
                    p.radius += 0.2;
                    return false;
                }
                return true;
            });
        });
        io.to(roomName).emit('updatePlayers', room.players);
    });
}, 16);

server.listen(process.env.PORT || 3000);
