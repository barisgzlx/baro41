const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(__dirname));

// 5 adet oda tanımlıyoruz
let rooms = { 
    ffa1: {}, ffa2: {}, ffa3: {}, ffa4: {}, ffa5: {} 
};

io.on('connection', (socket) => {
    socket.on('join', (roomName) => {
        // Geçerli bir oda mı kontrol et
        if (!rooms[roomName]) return;

        socket.join(roomName);
        socket.currentRoom = roomName;
        
        // Oyuncuyu o odaya kaydet
        rooms[roomName][socket.id] = { 
            x: Math.random() * 1000, 
            y: Math.random() * 800, 
            radius: 20, 
            color: `hsl(${Math.random() * 360}, 70%, 50%)` // Her girişte farklı renk
        };
        
        io.to(roomName).emit('updatePlayers', rooms[roomName]);
    });

    socket.on('move', (data) => {
        const room = socket.currentRoom;
        if (room && rooms[room][socket.id]) {
            rooms[room][socket.id].x = data.x;
            rooms[room][socket.id].y = data.y;
            rooms[room][socket.id].radius = data.radius;
            io.to(room).emit('updatePlayers', rooms[room]);
        }
    });

    socket.on('disconnect', () => {
        const room = socket.currentRoom;
        if (room && rooms[room][socket.id]) {
            delete rooms[room][socket.id];
            io.to(room).emit('updatePlayers', rooms[room]);
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log('5 Odalı Sistem Yayında!'));
