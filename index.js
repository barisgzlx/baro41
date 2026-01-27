const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(__dirname));

const worldSize = 3000;
// Agarz Oda Sistemi ve Yem Deposu
let rooms = {
    ffa1: { players: {}, food: [] },
    ffa2: { players: {}, food: [] },
    ffa3: { players: {}, food: [] },
    ffa4: { players: {}, food: [] },
    ffa5: { players: {}, food: [] }
};

// Her oda için başlangıç yemlerini oluştur
Object.keys(rooms).forEach(roomName => {
    for(let i=0; i<400; i++) {
        rooms[roomName].food.push({
            id: i,
            x: Math.random() * worldSize,
            y: Math.random() * worldSize,
            color: `hsl(${Math.random() * 360}, 100%, 50%)`
        });
    }
});

io.on('connection', (socket) => {
    console.log('Oyuncu bağlandı:', socket.id);

    socket.on('join', (data) => {
        // Eski odadan temizle
        if (socket.currentRoom && rooms[socket.currentRoom]) {
            delete rooms[socket.currentRoom].players[socket.id];
            socket.leave(socket.currentRoom);
        }

        socket.join(data.room);
        socket.currentRoom = data.room;

        // Karakteri oluştur veya mevcut olanı koru (ESC basınca ölmemesi için)
        if (!data.spectate && !rooms[data.room].players[socket.id]) {
            rooms[data.room].players[socket.id] = {
                x: worldSize / 2,
                y: worldSize / 2,
                radius: 30,
                color: `hsl(${Math.random() * 360}, 100%, 50%)`,
                nick: data.nick || "baro"
            };
        }

        // Katılan kişiye o odadaki yemleri ve oyuncu listesini gönder
        socket.emit('initFood', rooms[data.room].food);
        io.to(data.room).emit('updatePlayers', rooms[data.room].players);
    });

    // KRİTİK: Donmaları engelleyen hareket senkronizasyonu
    socket.on('move', (data) => {
        const room = socket.currentRoom;
        if (room && rooms[room] && rooms[room].players[socket.id]) {
            let p = rooms[room].players[socket.id];
            
            // Yeni koordinatları sunucuya işle
            p.x = data.x;
            p.y = data.y;

            // Sadece bu odadaki kişilere güncel konumları gönder (Trafik tasarrufu)
            io.to(room).emit('updatePlayers', rooms[room].players);
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

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Agarz Sunucusu ${PORT} portunda pürüzsüz çalışıyor...`);
});
