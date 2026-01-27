const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
    cors: { origin: "*" }
});
const path = require('path');

app.use(express.static(__dirname));

let players = {};
let foods = [];

// Başlangıç yemleri
for(let i=0; i<150; i++) {
    foods.push({ 
        id: i, 
        x: Math.random() * 3000, 
        y: Math.random() * 3000, 
        color: `hsl(${Math.random() * 360}, 70%, 50%)` 
    });
}

io.on('connection', (socket) => {
    players[socket.id] = {
        id: socket.id,
        x: 1500,
        y: 1500,
        radius: 30,
        color: `hsl(${Math.random() * 360}, 80%, 60%)`,
        name: "Oyuncu_" + socket.id.substr(0, 3)
    };

    socket.emit('init', { players, foods });
    socket.broadcast.emit('newPlayer', players[socket.id]);

    socket.on('move', (data) => {
        if (players[socket.id]) {
            players[socket.id].x = data.x;
            players[socket.id].y = data.y;
            socket.broadcast.emit('playerMoved', players[socket.id]);
        }
    });

    socket.on('disconnect', () => {
        delete players[socket.id];
        io.emit('removePlayer', socket.id);
    });
});

http.listen(3000, () => {
    console.log('OYUN SUNUCUSU ÇALIŞIYOR: http://localhost:3000');
});