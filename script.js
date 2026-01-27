const socket = io();
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const overlay = document.getElementById('overlay');
const hud = document.getElementById('hud');

let isPlaying = false;
let otherPlayers = {};
let foods = [];
const worldSize = 3000;
let mousePos = { x: 0, y: 0 };

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

socket.on('initFood', (serverFood) => { foods = serverFood; });

// TİTREMEYİ ENGELLEYEN MANTIK: Gelen veriyi hemen uygulama, hedefe doğru süzül
socket.on('updatePlayers', (players) => {
    Object.keys(players).forEach(id => {
        if (!otherPlayers[id]) {
            otherPlayers[id] = players[id]; // Yeni oyuncuysa ekle
        } else {
            // Mevcut oyuncunun hedefini güncelle, ama x ve y'yi aniden değiştirme
            otherPlayers[id].targetX = players[id].x;
            otherPlayers[id].targetY = players[id].y;
            otherPlayers[id].radius = players[id].radius;
            otherPlayers[id].nick = players[id].nick;
            otherPlayers[id].color = players[id].color;
        }
    });
    // Odadan çıkanları temizle
    Object.keys(otherPlayers).forEach(id => {
        if (!players[id]) delete otherPlayers[id];
    });
});

window.addEventListener('mousemove', (e) => {
    mousePos.x = e.clientX;
    mousePos.y = e.clientY;
});

function join(spectate) {
    const nick = document.getElementById('nick').value || "baro";
    const room = document.getElementById('room').value;
    overlay.style.display = 'none';
    hud.style.display = 'block';
    isPlaying = !spectate;
    socket.emit('join', { room, nick, spectate });
}

window.addEventListener('keydown', (e) => {
    if (e.key === "Escape") overlay.style.display = 'flex';
});

// Sunucuya veri gönderme hızını düşür (Trafiği rahatlatır)
setInterval(() => {
    if (isPlaying && otherPlayers[socket.id] && overlay.style.display === 'none') {
        const me = otherPlayers[socket.id];
        const dx = mousePos.x - canvas.width / 2;
        const dy = mousePos.y - canvas.height / 2;
        
        // Hızı Agarz seviyesine çektik
        const nextX = me.x + (dx * 0.1);
        const nextY = me.y + (dy * 0.1);
        
        socket.emit('move', { 
            x: Math.max(0, Math.min(worldSize, nextX)), 
            y: Math.max(0, Math.min(worldSize, nextY)) 
        });
    }
}, 40); // 25 FPS paket gönderimi

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const me = otherPlayers[socket.id];

    // OYUNCU KONUMLARINI YUMUŞAT (Interpolation)
    Object.keys(otherPlayers).forEach(id => {
        const p = otherPlayers[id];
        if (p.targetX !== undefined) {
            // Bulunduğu yerden hedefe %20 hızla yaklaş (Yumuşak kayma)
            p.x += (p.targetX - p.x) * 0.2;
            p.y += (p.targetY - p.y) * 0.2;
        }
    });

    ctx.save();
    if (me) {
        ctx.translate(canvas.width/2 - me.x, canvas.height/2 - me.y);
    }

    // KIRMIZI SINIR VE GRID
    ctx.strokeStyle = "red"; ctx.lineWidth = 15;
    ctx.strokeRect(0, 0, worldSize, worldSize);
    ctx.strokeStyle = "#111"; ctx.lineWidth = 1;
    for(let i=0; i<=worldSize; i+=50) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, worldSize); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(worldSize, i); ctx.stroke();
    }

    // YEMLER
    foods.forEach(f => {
        ctx.beginPath(); ctx.arc(f.x, f.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = f.color; ctx.fill();
    });

    // OYUNCULAR
    Object.keys(otherPlayers).forEach(id => {
        const p = otherPlayers[id];
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        ctx.font = "bold 14px Arial";
        ctx.fillText(p.nick, p.x, p.y + 5);
    });

    ctx.restore();
    requestAnimationFrame(draw);
}
draw();
