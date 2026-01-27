const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(__dirname));

const worldSize = 4000;
let rooms = { "ffa1": { players: {}, food: [] }, "ffa2": { players: {}, food: [] } };
let lastWinner = "Yok";

let timeLeft = 3600;
setInterval(() => {
    if (timeLeft > 0) {
        timeLeft--;
        io.emit('timerUpdate', timeLeft);
    } else {
        // Süre bitti, kazananı belirle
        Object.keys(rooms).forEach(r => {
            let players = Object.values(rooms[r].players);
            if(players.length > 0) {
                let winner = players.sort((a,b) => b.score - a.score)[0];
                lastWinner = winner.nick;
                io.emit('gameFinished', { winner: lastWinner });
            }
        });
        timeLeft = 3600;
    }
}, 1000);

Object.keys(rooms).forEach(r => {
    for(let i=0; i<300; i++) {
        rooms[r].food.push({ id: Math.random(), x: Math.random() * worldSize, y: Math.random() * worldSize, color: `hsl(${Math.random() * 360}, 100%, 50%)` });
    }
});

io.on('connection', (socket) => {
    socket.on('join', (data) => {
        socket.currentRoom = data.room || "ffa1";
        socket.join(socket.currentRoom);
        
        if (!data.spectate) {
            rooms[socket.currentRoom].players[socket.id] = {
                x: worldSize / 2, y: worldSize / 2,
                score: 100, radius: 40,
                gold: 500, nick: data.nick || "Baro",
                color: `hsl(${Math.random() * 360}, 100%, 50%)`,
                isSpectator: false
            };
        }
        socket.emit('initWinner', lastWinner);
        socket.emit('initFood', rooms[socket.currentRoom].food);
    });

    socket.on('move', (data) => {
        const room = socket.currentRoom;
        const p = rooms[room]?.players[socket.id];
        if (p) {
            p.x = data.x; p.y = data.y;
            // Büyüme ve Yeme Kontrolü (Agarz Formülü)
            rooms[room].food = rooms[room].food.filter(f => {
                let dist = Math.sqrt((p.x - f.x)**2 + (p.y - f.y)**2);
                if (dist < p.radius) {
                    p.score += 1;
                    p.radius = Math.sqrt(p.score) * 4; // Büyüme hızı yavaşlatıldı
                    return false;
                }
                return true;
            });
        }
    });

    socket.on('buyScore', () => {
        const p = rooms[socket.currentRoom]?.players[socket.id];
        if (p && p.gold >= 100) {
            p.gold -= 100; p.score += 200;
            p.radius = Math.sqrt(p.score) * 4;
        }
    });

    socket.on('disconnect', () => { if(socket.currentRoom) delete rooms[socket.currentRoom].players[socket.id]; });
});

setInterval(() => {
    Object.keys(rooms).forEach(r => io.to(r).emit('updatePlayers', rooms[r].players));
}, 35);

server.listen(process.env.PORT || 3000);
