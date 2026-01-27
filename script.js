const socket = io(); // Sunucuya bağlan
let otherPlayers = {};

// Sunucudan gelen oyuncu listesini al
socket.on('updatePlayers', (serverPlayers) => {
    otherPlayers = serverPlayers;
});

// Mevcut draw fonksiyonunun içine diğer oyuncuları çizmeyi ekle:
// (Draw fonksiyonunun içinde player çizmeden hemen önce şunu ekle)
Object.keys(otherPlayers).forEach((id) => {
    if (id !== socket.id) {
        let p = otherPlayers[id];
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'red'; // Diğerleri kırmızı görünsün
        ctx.fill();
        ctx.closePath();
    }
});

// Mousemove içine şunu ekle:
socket.emit('move', { x: player.x, y: player.y });
