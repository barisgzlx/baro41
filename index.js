// ... (üst kısımdaki sayaç ve room tanımları aynı kalsın)

io.on('connection', (socket) => {
    socket.on('join', (data) => {
        const roomName = data.room || "ffa1";
        socket.join(roomName);
        socket.currentRoom = roomName;
        // Başlangıç değerleri
        rooms[roomName].players[socket.id] = {
            x: worldSize / 2, y: worldSize / 2, 
            score: 100, 
            radius: 45, // sqrt(100) * 4.5 gibi bir oran
            gold: 500, nick: data.nick || "Oyuncu",
            color: `hsl(${Math.random() * 360}, 100%, 50%)`
        };
        socket.emit('initFood', rooms[roomName].food);
    });

    socket.on('move', (data) => {
        const room = socket.currentRoom;
        if (room && rooms[room]?.players[socket.id]) {
            let p = rooms[room].players[socket.id];
            p.x = data.x; p.y = data.y;

            // Yem yeme
            let ate = false;
            rooms[room].food = rooms[room].food.filter(f => {
                let dist = Math.sqrt((p.x - f.x)**2 + (p.y - f.y)**2);
                if (dist < p.radius) { 
                    p.score += 2; 
                    // AGARZ FORMÜLÜ: Boyut skorun kareköküyle artar
                    p.radius = Math.sqrt(p.score) * 4.5; 
                    ate = true; return false; 
                }
                return true;
            });
            if (ate) io.to(room).emit('initFood', rooms[room].food);

            // Oyuncu Yeme
            Object.keys(rooms[room].players).forEach(id => {
                if (id !== socket.id) {
                    let other = rooms[room].players[id];
                    let dist = Math.sqrt((p.x - other.x)**2 + (p.y - other.y)**2);
                    if (dist < p.radius && p.score > other.score * 1.1) {
                        p.score += other.score;
                        p.radius = Math.sqrt(p.score) * 4.5; // Yeniden hesapla
                        other.score = 100; other.radius = 45; 
                        other.x = worldSize/2; other.y = worldSize/2;
                        io.to(id).emit('respawn');
                    }
                }
            });
        }
    });

    socket.on('buyScore', () => {
        const room = socket.currentRoom;
        if (room && rooms[room]?.players[socket.id]) {
            let p = rooms[room].players[socket.id];
            if (p.gold >= 100) { 
                p.gold -= 100; p.score += 200; 
                p.radius = Math.sqrt(p.score) * 4.5;
            }
        }
    });
    // ... (disconnect ve setInterval kısımları aynı)
});
