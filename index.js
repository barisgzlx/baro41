const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(__dirname));

const worldSize = 3000;
let rooms = {
    "ffa1": { players: {}, food: [] },
    "ffa2": { players: {}, food: [] },
    "ffa3": { players: {}, food: [] }
};

// Yemleri azaltılmış şekilde oluştur (250 adet)
Object.keys(rooms).forEach(r => {
    for(let i=0; i<250; i++) {
        rooms[r].food.push({
            id: i + Math.random(), 
            x: Math.random() * worldSize, 
            y: Math.random() * worldSize,
            color: `hsl(${Math.random() * 360}, 100%, 50%)`
        });
    }
});

io.on('connection', (socket) => {
    socket.on('join', (data) => {
        const roomName = data.room || "ffa1";
        socket.join(roomName);
        socket.currentRoom = roomName;
        rooms[roomName].players[socket.id] = {
            x: worldSize / 2, y: worldSize / 2, radius: 30,
            score: 0, gold: 500, nick: data.nick || "baro",
            color: `hsl(${Math.random() * 360}, 100%, 50%)`
        };
        socket.emit('initFood', rooms[roomName].food);
    });

    socket.on('move', (data) => {
        const room = socket.currentRoom;
        if (room && rooms[room]?.players[socket.id]) {
            let p = rooms[room].players[socket.id];
            p.x = data.x; p.y = data.y;

            // YEM YEME VE LİSTEDEN SİLME (Garantili Yöntem)
            const initialFoodCount = rooms[room].food.length;
            rooms[room].food = rooms[room].food.filter(f => {
                let dist = Math.sqrt((p.x - f.x)**2 + (p.y - f.y)**2);
                if (dist < p.radius + 5) {
                    p.score += 2; 
                    p.radius += 0.2;
                    return false; // Yemi sil
                }
                return true;
            });

            // Eğer yem yendiyse tüm odaya yeni yem listesini gönder
            if (rooms[room].food.length !== initialFoodCount) {
                io.to(room).emit('initFood', rooms[room].food);
            }
        }
    });

    socket.on('buyScore', () => {
        const room = socket.currentRoom;
        if (room && rooms[room]?.players[socket.id]) {
            let p = rooms[room].players[socket.id];
            if (p.gold >= 100) { p.gold -= 100; p.score += 200; p.radius += 5; }
        }
    });

    socket.on('disconnect', () => {
        if (socket.currentRoom && rooms[socket.currentRoom]) {
            delete rooms[socket.currentRoom].players[socket.id];
        }
    });
});

setInterval(() => {
    Object.keys(rooms).forEach(r => { 
        io.to(r).emit('updatePlayers', rooms[r].players); 
    });
}, 30);

server.listen(process.env.PORT || 3000);
