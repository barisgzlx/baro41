const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(__dirname));

const worldSize = 4000;
let rooms = { "ffa1": { players: {}, food: [] } };
let lastWinner = "Henüz Yok";
let timeLeft = 3600;

// Yemleri Başlat
for(let i=0; i<300; i++) {
    rooms["ffa1"].food.push({ id: Math.random(), x: Math.random() * worldSize, y: Math.random() * worldSize, color: `hsl(${Math.random() * 360}, 100%, 50%)` });
}

// Sayaç ve Galibiyet
setInterval(() => {
    if (timeLeft > 0) {
        timeLeft--;
        io.emit('timerUpdate', timeLeft);
    } else {
        const players = Object.values(rooms["ffa1"].players);
        if(players.length > 0) {
            lastWinner = players.sort((a,b) => b.score - a.score)[0].nick;
            io.emit('gameFinished', { winner: lastWinner });
        }
        timeLeft = 3600;
    }
}, 1000);

io.on('connection', (socket) => {
    socket.on('join', (data) => {
        socket.currentRoom = "ffa1";
        socket.join("ffa1");
        if (!data.spectate) {
            rooms["ffa1"].players[socket.id] = {
                x: worldSize / 2, y: worldSize / 2,
                score: 100, radius: 45,
                gold: 500, nick: data.nick || "Baro",
                color: `hsl(${Math.random() * 360}, 100%, 50%)`
            };
        }
        socket.emit('initWinner', lastWinner);
        socket.emit('initFood', rooms["ffa1"].food);
    });

    socket.on('move', (data) => {
        const p = rooms["ffa1"]?.players[socket.id];
        if (p) {
            p.x = data.x; p.y = data.y;
            // Yem yeme (Agarz dengesi)
            rooms["ffa1"].food = rooms["ffa1"].food.filter(f => {
                let dist = Math.sqrt((p.x - f.x)**2 + (p.y - f.y)**2);
                if (dist < p.radius) {
                    p.score += 1.5;
                    p.radius = Math.sqrt(p.score) * 4.5;
                    return false;
                }
                return true;
            });

            // Oyuncu yeme
            Object.keys(rooms["ffa1"].players).forEach(id => {
                if (id !== socket.id) {
                    let other = rooms["ffa1"].players[id];
                    let dist = Math.sqrt((p.x - other.x)**2 + (p.y - other.y)**2);
                    if (dist < p.radius && p.score > other.score * 1.1) {
                        p.score += other.score;
                        p.radius = Math.sqrt(p.score) * 4.5;
                        other.score = 100; other.radius = 45;
                        other.x = worldSize/2; other.y = worldSize/2;
                        io.to(id).emit('respawn');
                    }
                }
            });
        }
    });

    socket.on('buyScore', () => {
        const p = rooms["ffa1"]?.players[socket.id];
        if (p && p.gold >= 100) {
            p.gold -= 100; p.score += 200;
            p.radius = Math.sqrt(p.score) * 4.5;
        }
    });

    socket.on('disconnect', () => { delete rooms["ffa1"].players[socket.id]; });
});

setInterval(() => { io.emit('updatePlayers', rooms["ffa1"].players); }, 35);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => { console.log("Sunucu hazir: " + PORT); });
