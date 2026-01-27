const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(__dirname));

const worldSize = 3000;
let players = {};
let food = [];

// Yemleri oluştur
for(let i=0; i<300; i++) {
    food.push({
        id: i,
        x: Math.random() * worldSize,
        y: Math.random() * worldSize,
        color: `hsl(${Math.random() * 360}, 100%, 50%)`
    });
}

io.on('connection', (socket) => {
    socket.on('join', (data) => {
        players[socket.id] = {
            x: worldSize / 2,
            y: worldSize / 2,
            radius: 30,
            nick: data.nick || "baro",
            color: `hsl(${Math.random() * 360}, 100%, 50%)`,
            score: 0,
            gold: 500
        };
        socket.emit('initFood', food);
    });

    socket.on('move', (data) => {
        if (players[socket.id]) {
            players[socket.id].x = data.x;
            players[socket.id].y = data.y;
            
            // Basit yem yeme kontrolü
            food = food.filter(f => {
                let dist = Math.sqrt((players[socket.id].x - f.x)**2 + (players[socket.id].y - f.y)**2);
                if (dist < players[socket.id].radius) {
                    players[socket.id].score += 1;
                    players[socket.id].radius += 0.1;
                    return false;
                }
                return true;
            });
        }
    });

    socket.on('disconnect', () => { delete players[socket.id]; });
});

setInterval(() => { io.emit('updatePlayers', players); }, 20);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log("Sistem Aktif"));
