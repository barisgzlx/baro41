// ... (Başlangıç aynı)
io.on('connection', (socket) => {
    socket.on('join', (data) => {
        socket.join(data.room);
        socket.currentRoom = data.room;
        rooms[data.room].players[socket.id] = {
            x: worldSize/2, y: worldSize/2, radius: 30,
            score: 0, gold: 500, // Başlangıç parası
            nick: data.nick || "baro", color: `hsl(${Math.random()*360},100%,50%)`,
            mouseX: worldSize/2, mouseY: worldSize/2
        };
        socket.emit('initFood', rooms[data.room].food);
    });

    // Altın harcayıp büyüme (S Tuşu)
    socket.on('buyScore', () => {
        const room = socket.currentRoom;
        const p = rooms[room]?.players[socket.id];
        if (p && p.gold >= 100) {
            p.gold -= 100;
            p.score += 200;
            p.radius += 5; // Görsel büyüme
            io.to(room).emit('updatePlayers', rooms[room].players);
        }
    });

    socket.on('move', (data) => {
        const room = socket.currentRoom;
        if (room && rooms[room].players[socket.id]) {
            rooms[room].players[socket.id].mouseX = data.x;
            rooms[room].players[socket.id].mouseY = data.y;
        }
    });
});

// ANA DÖNGÜ (Yem yeme ve Hareket)
setInterval(() => {
    Object.keys(rooms).forEach(roomName => {
        const room = rooms[roomName];
        Object.keys(room.players).forEach(id => {
            let p = room.players[id];
            let dx = p.mouseX - p.x;
            let dy = p.mouseY - p.y;
            let dist = Math.sqrt(dx*dx + dy*dy);
            if(dist > 5) {
                p.x += (dx/dist) * 4;
                p.y += (dy/dist) * 4;
            }

            // YEM YEME KONTROLÜ
            room.food = room.food.filter(f => {
                let fDist = Math.sqrt((p.x-f.x)**2 + (p.y-f.y)**2);
                if(fDist < p.radius) {
                    p.score += 1;
                    p.radius += 0.2; // Yedikçe büyü
                    return false;
                }
                return true;
            });
        });
        io.to(roomName).emit('updatePlayers', room.players);
    });
}, 16);
// ...
