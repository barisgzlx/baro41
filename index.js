const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(__dirname));

const worldSize = 3000;
// HTML İLE TAM UYUMLU ODALAR
let rooms = {
    "FFA-1": { players: {}, food: [] },
    "FFA-2": { players: {}, food: [] }
};

// Odalara yemleri doldur
Object.keys(rooms).forEach(r => {
    for(let i=0; i<350; i++) {
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
        const roomName = data.room || "FFA-1";
        
        if (socket.currentRoom && rooms[socket.currentRoom]) {
            delete rooms[socket.currentRoom].players[socket.id];
            socket.leave(socket.currentRoom);
        }

        if (rooms[roomName]) {
            socket.join(roomName);
            socket.currentRoom = roomName;
            rooms[roomName].players[socket.id] = {
                x: worldSize / 2,
                y: worldSize / 2,
                radius: 30,
                nick: data.nick || "baro",
                color: `hsl(${Math.random() * 360}, 100%, 50%)`,
                score: 0,
                gold: 500 // Başlangıç parası
            };
            socket.emit('initFood', rooms[roomName].food);
        }
    });

    socket.on('move', (data) => {
        const room = socket.currentRoom;
        if (room && rooms[room]?.players[socket.id]) {
            let p = rooms[room].players[socket.id];
            p.x = data.x;
            p.y = data.y;

            // Yem yeme
            rooms[room].food = rooms[room].food.filter(f => {
                let d = Math.sqrt((p.x - f.x)**2 + (p.y - f.y)**2);
                if (d < p.radius) {
                    p.score += 1;
                    p.radius += 0.15;
                    return false;
                }
                return true;
            });
        }
    });

    // S Tuşu: 100 Gold harca -> 200 Skor kazan
    socket.on('buyScore', () => {
        const room = socket.currentRoom;
        if (room && rooms[room]?.players[socket.id]) {
            let p = rooms[room].players[socket.id];
            if (p.gold >= 100) {
                p.gold -= 100;
                p.score += 200;
                p.radius += 5;
            }
        }
    });

    socket.on('disconnect', () => {
        const room = socket.currentRoom;
        if (room && rooms[room]?.players[socket.id]) {
            delete rooms[room].players[socket.id];
        }
    });
});

setInterval(() => {
    Object.keys(rooms).forEach(r => {
        io.to(r).emit('updatePlayers', rooms[r].players);
    });
}, 25);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log("FFA Odalari ve Gold Sistemi Hazir"));
