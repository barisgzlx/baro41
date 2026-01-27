const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Sunucunun ana dizindeki tüm dosyaları (index.html, script.js vb.) tanımasını sağlar
app.use(express.static(path.join(__dirname, '.')));

// Ana sayfaya girildiğinde index.html dosyasını gönderir
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Oyuncuların konumlarını burada tutacağız
let players = {};

io.on('connection', (socket) => {
    console.log('Bir oyuncu bağlandı:', socket.id);

    // Yeni oyuncuyu oluştur ve listeye ekle
    players[socket.id] = { x: 500, y: 500, color: 'red' };

    // Tüm oyunculara güncel listeyi gönder
    io.emit('updatePlayers', players);

    // Oyuncu ayrıldığında listeden sil
    socket.on('disconnect', () => {
        console.log('Bir oyuncu ayrıldı:', socket.id);
        delete players[socket.id];
        io.emit('updatePlayers', players);
    });
});

// Render'ın vereceği portu kullan, yoksa 3000 portunda çalış
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Oyun ${PORT} portunda tam kapasite yayında!`);
});
