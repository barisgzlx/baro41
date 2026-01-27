const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Dosyaları dışarı aç
app.use(express.static(__dirname));

// Tüm oyuncuları burada tutacağız
let players = {};

io.on('connection', (socket) => {
    console.log('Bir oyuncu bağlandı:', socket.id);
    
    // Yeni bağlanan oyuncuya rastgele bir başlangıç yeri ver
    players[socket.id] = { 
        x: Math.random() * 800, 
        y: Math.random() * 600, 
        radius: 20, 
        color: 'dodgerblue' 
    };

    // Herkese güncel oyuncu listesini duyur
    io.emit('updatePlayers', players);

    // Bir oyuncu faresini oynattığında gelen veriyi al
    socket.on('move', (data) => {
        if (players[socket.id]) {
            players[socket.id].x = data.x;
            players[socket.id].y = data.y;
            players[socket.id].radius = data.radius; // Büyüme bilgisini de alalım
            
            // Yeni pozisyonu diğer tüm oyunculara gönder
            io.emit('updatePlayers', players);
        }
    });

    // Oyuncu sayfayı kapattığında listeden sil
    socket.on('disconnect', () => {
        console.log('Oyuncu ayrıldı:', socket.id);
        delete players[socket.id];
        io.emit('updatePlayers', players);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log('Sunucu multiplayer modunda hazir!');
});
