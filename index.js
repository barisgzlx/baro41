const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(__dirname));

// Agarz Oda Sistemi
let rooms = { ffa1: {}, ffa2: {}, ffa3: {}, ffa4: {}, ffa5: {} };

io.on('connection', (socket) => {
    console.log('Yeni bağlantı:', socket.id);

    socket.on('join', (data) => {
        // Eğer oyuncu oda değiştirdiyse eski odadan sil
        if (socket.currentRoom && socket.currentRoom !== data.room) {
            if (rooms[socket.currentRoom]) {
                delete rooms[socket.currentRoom][socket.id];
                io.to(socket.currentRoom).emit('updatePlayers', rooms[socket.currentRoom]);
            }
            socket.leave(socket.currentRoom);
        }

        socket.join(data.room);
        socket.currentRoom = data.room;

        // KRİTİK NOKTA: Eğer oyuncu zaten bu odadaysa yeniden oluşturma (Ölmez)
        if (!data.spectate && rooms[data.room] && !rooms[data.room][socket.id]) {
            rooms[data.room][socket.id] = {
                x: Math.random() * 2500 + 250,
                y: Math.random() * 2500 + 250,
                radius: 30, // Başlangıç boyutu
                color: `hsl(${Math.random() * 360}, 100%, 50%)`, // Rastgele renk
                nick: data.nick || "Adsız"
            };
        }

        // Güncel oyuncu listesini odaya gönder
        if (rooms[data.room]) {
            io.to(data.room).emit('updatePlayers', rooms[data.room]);
        }
    });

    socket.on('move', (data) => {
        const room = socket.currentRoom;
        if (room && rooms[room] && rooms[room][socket.id]) {
            // Karakterin konumunu güncelle
            rooms[room][socket.id].x = data.x;
            rooms[room][socket.id].y = data.y;
            
            // Sadece o odadaki oyunculara veriyi bas
            io.to(room).emit('updatePlayers', rooms[room]);
        }
    });

    socket.on('disconnect', () => {
        const room = socket.currentRoom;
        if (room && rooms[room] && rooms[room][socket.id]) {
            delete rooms[room][socket.id];
            io.to(room).emit('updatePlayers', rooms[room]);
        }
        console.log('Bağlantı kesildi:', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Sunucu ${PORT} portunda çalışıyor...`);
});
