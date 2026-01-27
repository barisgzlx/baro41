const socket = io();
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const overlay = document.getElementById('overlay');
const hud = document.getElementById('hud');

let isPlaying = false;
let otherPlayers = {};
const worldSize = 3000; 

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Pencere boyutu değişince canvas'ı güncelle
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

function join(spectate) {
    const nick = document.getElementById('nick').value || "Adsız";
    const room = document.getElementById('room').value;
    
    overlay.style.display = 'none';
    hud.style.display = 'block';
    isPlaying = !spectate;
    
    socket.emit('join', { room, nick, spectate });
}

// ESC ile Menüye Dön
window.addEventListener('keydown', (e) => {
    if (e.key === "Escape") {
        overlay.style.display = 'flex';
        hud.style.display = 'none';
        isPlaying = false;
    }
});

socket.on('updatePlayers', (players) => {
    otherPlayers = players;
});

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const me = otherPlayers[socket.id];

    ctx.save();
    
    if (me) {
        // Kamera karakteri merkeze alır
        ctx.translate(canvas.width/2 - me.x, canvas.height/2 - me.y);
    } else {
        // Eğer karakter yoksa (İzle modu veya henüz girilmediyse) haritayı ortala
        ctx.translate(canvas.width/2 - worldSize/2, canvas.height/2 - worldSize/2);
    }

    // 1. Harita Sınırı (Kırmızı Çizgi)
    ctx.strokeStyle = "red";
    ctx.lineWidth = 10;
    ctx.strokeRect(0, 0, worldSize, worldSize);

    // 2. Kareli Arkaplan (Grid)
    ctx.strokeStyle = "#111";
    ctx.lineWidth = 1;
    for(let i=0; i<=worldSize; i+=50) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, worldSize); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(worldSize, i); ctx.stroke();
    }

    // 3. Oyuncuları Çiz
    Object.keys(otherPlayers).forEach(id => {
        const p = otherPlayers[id];
        
        // Baloncuk
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
        ctx.closePath();
        
        // Nickname
        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        ctx.font = `bold ${Math.max(12, p.radius/2)}px Arial`;
        ctx.fillText(p.nick, p.x, p.y + 5);
    });

    ctx.restore();
    requestAnimationFrame(draw);
}

// Hareket Kontrolü
window.addEventListener('mousemove', (e) => {
    if (isPlaying && otherPlayers[socket.id]) {
        const me = otherPlayers[socket.id];
        
        // Fare merkezden ne kadar uzakta?
        const dx = e.clientX - canvas.width / 2;
        const dy = e.clientY - canvas.height / 2;
        
        // Karakteri fare yönüne doğru yumuşakça kaydır
        const moveX = me.x + (dx * 0.1);
        const moveY = me.y + (dy * 0.1);
        
        // Harita sınırlarını kontrol et
        const finalX = Math.max(0, Math.min(worldSize, moveX));
        const finalY = Math.max(0, Math.min(worldSize, moveY));
        
        socket.emit('move', { x: finalX, y: finalY });
    }
});

draw();
