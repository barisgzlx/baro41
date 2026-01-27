const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(__dirname));

const worldSize = 3000;
let rooms = { ffa1: { players: {}, food: [] }, ffa2: { players: {}, food: [] } };

// Yemleri oluştur
Object.keys(rooms).forEach(r => {
    for(let i=0; i<400; i++) {
        rooms[r].food.push({ id: i, x: Math.random()*worldSize, y: Math.random()*worldSize, color: `hsl(${Math.random()*360},100%,50%)` });
    }
});

io.on('connection', (socket) => {
    socket.on('join', (data) => {
        socket.join(data.room);
        socket.currentRoom = data.room;
        rooms[data.room].players[socket.id] = {
            x: worldSize/2, y: worldSize/2, radius: 30,
            nick: data.nick || "baro", color: `hsl(${Math.random()*360},100%,50%)`,
            mouseX: 0, mouseY: 0 // Fare hedefini burada tutuyoruz
        };
        socket.emit('initFood', rooms[data.room].food);
    });

    // Sadece fare hedefini güncelle
    socket.on('move', (data) => {
        const room = socket.currentRoom;
        if (room && rooms[room].players[socket.id]) {
            rooms[room].players[socket.id].mouseX = data.x;
            rooms[room].players[socket.id].mouseY = data.y;
        }
    });

    socket.on('disconnect', () => {
        if (socket.currentRoom) delete rooms[socket.currentRoom].players[socket.id];
    });
});

// AGARZ DÖNGÜSÜ: Sunucu saniyede 60 kez tüm oyuncuları farenin yönüne doğru kaydırır
setInterval(() => {
    Object.keys(rooms).forEach(roomName => {
        const room = rooms[roomName];
        Object.keys(room.players).forEach(id => {
            let p = room.players[id];
            // Fareye olan mesafe ve açı hesabı
            let dx = p.mouseX - p.x;
            let dy = p.mouseY - p.y;
            let dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist > 5) { // Eğer fare karakterin çok yakınında değilse yürü
                let speed = 4; // Agarz başlangıç hızı
                p.x += (dx / dist) * speed;
                p.y += (dy / dist) * speed;
            }
            
            // Sınır kontrolü
            p.x = Math.max(0, Math.min(worldSize, p.x));
            p.y = Math.max(0, Math.min(worldSize, p.y));
        });
        io.to(roomName).emit('updatePlayers', room.players);
    });
}, 16); // 60 FPS Sunucu hesaplaması

server.listen(process.env.PORT || 3000);
