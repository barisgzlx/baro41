const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(__dirname));

const worldSize = 3000;
let rooms = {
    "FFA-1": { players: {}, food: [] },
    "FFA-2": { players: {}, food: [] }
};

// Yemleri odalara ekle
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
    // OYNA BUTONU BURAYI TETİKLER
    socket.on('join', (data) => {
        const roomName = data.room || "FFA-1";
        
        // Önceki odadan güvenli çıkış
        if (socket.currentRoom && rooms[socket.currentRoom]) {
            delete rooms[socket.currentRoom].players[socket.id];
            socket.leave(socket.currentRoom);
        }

        socket.join(roomName);
        socket.currentRoom = roomName;

        // Karakter verilerini oluştur
        rooms[roomName].players[socket.id] = {
            x: worldSize / 2,
            y: worldSize / 2,
            radius: 30,
            score: 0,
            gold: 500, // Başlangıç parası
            nick: data.nick || "baro",
            color: `hsl(${Math.random() * 360}, 100%, 50%)`
        };

        // Gerekli verileri istemciye yolla
        socket.emit('initFood', rooms[roomName].food);
        io.to(roomName).emit('updatePlayers', rooms[roomName].players);
    });

    // S Tuşu: 100 Gold -> 200 Skor
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

    // Hareket ve Yem Yeme (Ping engellemek için doğrudan konum alır)
    socket.on('move', (data) => {
        const room = socket.currentRoom;
        if (room && rooms[room] && rooms[room].players[socket.id]) {
            let p = rooms[room].players[socket.id];
            p.x = data.x;
            p.y = data.y;

            // Yem yeme kontrolü
            rooms[room].food = rooms[room].food.filter(f => {
                let dist = Math.sqrt((p.x - f.x)**2 + (p.y - f.y)**2);
                if (dist < p.radius) {
                    p.score += 1;
                    p.radius += 0.15;
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

// Saniyede 40 kez güncelleme gönder
setInterval(() => {
    Object.keys(rooms).forEach(r => {
        io.to(r).emit('updatePlayers', rooms[r].players);
    });
}, 25);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Agarz Sunucusu Hazır: ${PORT}`));
