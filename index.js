const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.static(__dirname));

const worldSize = 3000;
let rooms = { "ffa1": { players: {}, food: [] } };
let lastWinner = "Yok";
let timeLeft = 60;
let winStats = {};

// Yem sayısını azaltarak sunucu yükünü hafifletiyoruz
for(let i=0; i<120; i++) {
    rooms["ffa1"].food.push({ id: i, x: Math.random() * worldSize, y: Math.random() * worldSize, color: `hsl(${Math.random() * 360}, 100%, 50%)` });
}

setInterval(() => {
    if (timeLeft > 0) {
        timeLeft--;
        io.emit('timerUpdate', timeLeft);
    } else {
        const players = Object.values(rooms["ffa1"].players);
        if(players.length > 0) {
            let winner = players.sort((a,b) => b.score - a.score)[0];
            lastWinner = winner.nick;
            winStats[lastWinner] = (winStats[lastWinner] || 0) + 1;
            io.emit('gameFinished', { winner: lastWinner, stats: winStats });
        }
        timeLeft = 60;
    }
}, 1000);

io.on('connection', (socket) => {
    socket.on('join', (data) => {
        socket.join("ffa1");
        if (!rooms["ffa1"].players[socket.id] && !data.spectate) {
            rooms["ffa1"].players[socket.id] = {
                id: socket.id, x: worldSize / 2, y: worldSize / 2,
                score: 100, radius: 45, nick: data.nick || "Baro",
                color: `hsl(${Math.random() * 360}, 100%, 50%)`
            };
        }
        socket.emit('initFood', rooms["ffa1"].food);
    });

    socket.on('move', (data) => {
        const p = rooms["ffa1"]?.players[socket.id];
        if (p) {
            p.x = data.x; p.y = data.y;
            // Yem yeme kontrolü
            rooms["ffa1"].food = rooms["ffa1"].food.filter(f => {
                if (Math.hypot(p.x - f.x, p.y - f.y) < p.radius) {
                    p.score += 2; p.radius = Math.sqrt(p.score) * 4.5;
                    return false;
                }
                return true;
            });
        }
    });

    socket.on('disconnect', () => { delete rooms["ffa1"]?.players[socket.id]; });
});

// LAG ÖNLEYİCİ: Saniyede 15 paket (Render için altın oran)
setInterval(() => { 
    io.emit('updatePlayers', rooms["ffa1"].players); 
}, 65); 

const PORT = process.env.PORT || 3000;
server.listen(PORT);
