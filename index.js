const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Oyuncuların konumlarını burada tutacağız
let players = {};

io.on('connection', (socket) => {
    console.log('Bir oyuncu bağlandı:', socket.id);

    // Yeni oyuncuyu oluştur
    players[socket.id] = { x: 500, y: 500, color: 'red' };

    // Diğer herkese yeni oyuncuyu bildir
    io.emit('updatePlayers', players);

    socket.on('disconnect', () => {
        delete players[socket.id];
        io.emit('updatePlayers', players);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Oyun ${PORT} portunda tam kapasite yayında!`);
});
