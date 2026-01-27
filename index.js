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

// Başlangıç yemlerini odalara serp
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
    console.log('Yeni bağlantı:', socket.id);

    socket.on('join', (data) => {
        // Eski odadan çıkış yap
        if (socket.currentRoom && rooms[socket.currentRoom]) {
            delete rooms[socket.currentRoom].players[socket.id];
            socket.leave(socket.currentRoom);
        }

        socket.join(data.room);
        socket.currentRoom = data.room;

        // Oyuncuyu oluştur (Gold ve Skor dahil)
        rooms[data.room].players[socket.id] = {
            x: worldSize / 2,
            y: worldSize / 2,
            radius: 30,
            score: 0,
            gold: 500, 
            nick: data.nick || "baro",
            color: `hsl(${Math.random() * 360}, 100%, 50%)`
        };

        socket.emit('initFood', rooms[data.room].food);
    });

    // S Tuşu: 100 Gold harca -> 200 Skor kazan
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

    // PİNGİ BİTİREN HAREKET MANTIĞI: İstemciden gelen konumu onayla
    socket.on('move', (data) => {
        const room = socket.currentRoom;
        if (room && rooms[room] && rooms[room].players[socket.id]) {
            let p = rooms[room].players[socket.id];
            
            // Konumu güncelle
            p.x = data.x;
            p.y = data.y;
            
            // Yem yeme kontrolü (Sunucu güvenliği için burada kalmalı)
            rooms[room].food = rooms[room].food.filter(f => {
                let dist = Math.sqrt((p.x - f.x)**2 + (p.y - f.y)**2);
                if (dist < p.radius) {
                    p.score += 1;
                    p.radius += 0.2;
                    return false;
                }
                return true;
            });
        }
    });

    socket.on('disconnect', () => {
        const room = socket.currentRoom;
        if (room && rooms[room] && rooms[room].players[socket.id]) {
            delete rooms[room].players[socket.id];
            io.to(room).emit('updatePlayers', rooms[room].players);
        }
    });
});

// Broadcast Döngüsü: Saniyede 40 kez tüm oyunculara bilgi gönder
setInterval(() => {
    Object.keys(rooms).forEach(roomName => {
        io.to(roomName).emit('updatePlayers', rooms[roomName].players);
    });
}, 25); 

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Sunucu ${PORT} portunda aktif.`);
});
