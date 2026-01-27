const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(__dirname));

const worldSize = 3000;
let rooms = { "ffa1": { players: {}, food: [] } };
let lastWinner = "Yok";
let timeLeft = 60; 
let winStats = {}; // Galibiyetleri tutacak nesne

for(let i=0; i<200; i++) {
    rooms["ffa1"].food.push({ id: Math.random(), x: Math.random() * worldSize, y: Math.random() * worldSize, color: `hsl(${Math.random() * 360}, 100%, 50%)` });
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
            winStats[lastWinner] = (winStats[lastWinner] || 0) + 1; // Galibiyet ekle
            io.emit('gameFinished', { winner: lastWinner, stats: winStats });
        }
        timeLeft = 60;
    }
}, 1000);

io.on('connection', (socket) => {
    socket.on('join', (data) => {
        socket.join("ffa1");
        // Mevcut oyuncuyu koru, ölme sorununu engelle
        if (!rooms["ffa1"].players[socket.id] && !data.spectate) {
            rooms["ffa1"].players[socket.id] = {
                x: worldSize / 2, y: worldSize / 2,
                score: 100, radius: 45,
                gold: 500, nick: data.nick || "Baro",
                color: `hsl(${Math.random() * 360}, 100%, 50%)`
            };
        }
        socket.emit('initWinner', lastWinner);
        socket.emit('initFood', rooms["ffa1"].food);
        socket.emit('updateWinPage', winStats);
    });

    socket.on('move', (data) => {
        const p = rooms["ffa1"]?.players[socket.id];
        if (p) {
            p.x = data.x; p.y = data.y;
            // Yem ve Oyuncu yeme mantığı aynı kaldı (Bozulmadı)
            rooms["ffa1"].food = rooms["ffa1"].food.filter(f => {
                let dist = Math.sqrt((p.x - f.x)**2 + (p.y - f.y)**2);
                if (dist < p.radius) { p.score += 1.5; p.radius = Math.sqrt(p.score) * 4.5; return false; }
                return true;
            });
            Object.keys(rooms["ffa1"].players).forEach(id => {
                if (id !== socket.id) {
                    let other = rooms["ffa1"].players[id];
                    let dist = Math.sqrt((p.x - other.x)**2 + (p.y - other.y)**2);
                    if (dist < p.radius && p.score > other.score * 1.1) {
                        p.score += other.score; p.radius = Math.sqrt(p.score) * 4.5;
                        other.score = 100; other.radius = 45; other.x = worldSize/2; other.y = worldSize/2;
                        io.to(id).emit('respawn');
                    }
                }
            });
        }
    });

    socket.on('buyScore', () => {
        const p = rooms["ffa1"]?.players[socket.id];
        if (p && p.gold >= 100) { p.gold -= 100; p.score += 200; p.radius = Math.sqrt(p.score) * 4.5; }
    });

    socket.on('disconnect', () => { delete rooms["ffa1"].players[socket.id]; });
});

// Donmayı önlemek için stabilizasyon: 45ms (Render için en uygun hız)
setInterval(() => { io.emit('updatePlayers', rooms["ffa1"].players); }, 45);

const PORT = process.env.PORT || 3000;
server.listen(PORT);
