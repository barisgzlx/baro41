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

function join(spectate) {
    const nick = document.getElementById('nick').value || "Adsız";
    const room = document.getElementById('room').value;
    
    overlay.style.display = 'none';
    hud.style.display = 'block';
    isPlaying = !spectate;
    
    // Sunucuya katılma isteği gönder (Eğer varsak sunucu bizi öldürmeyecek)
    socket.emit('join', { room, nick, spectate });
}

// ESC Tuşu Kontrolü
window.addEventListener('keydown', (e) => {
    if (e.key === "Escape") {
        overlay.style.display = 'flex'; // Menüyü aç
        // NOT: isPlaying'i false yapmıyoruz ki karakterimiz arkada durmaya devam etsin
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
        ctx.translate(canvas.width/2 - me.x, canvas.height/2 - me.y);
    }

    // Harita Sınırı ve Grid
    ctx.strokeStyle = "red"; ctx.lineWidth = 10;
    ctx.strokeRect(0, 0, worldSize, worldSize);
    ctx.strokeStyle = "#111"; ctx.lineWidth = 1;
    for(let i=0; i<=worldSize; i+=50) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, worldSize); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(worldSize, i); ctx.stroke();
    }

    // Oyuncuları Çiz
    Object.keys(otherPlayers).forEach(id => {
        const p = otherPlayers[id];
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        ctx.font = `bold ${Math.max(12, p.radius/2)}px Arial`;
        ctx.fillText(p.nick, p.x, p.y + 5);
    });
    ctx.restore();
    requestAnimationFrame(draw);
}

// Yumuşak Hareket Kontrolü
window.addEventListener('mousemove', (e) => {
    // Menü açık olsa bile karakterimiz hareket etmesin istiyorsan isPlaying && overlay.style.display === 'none' yapabilirsin
    if (isPlaying && otherPlayers[socket.id] && overlay.style.display === 'none') {
        const me = otherPlayers[socket.id];
        const dx = e.clientX - canvas.width / 2;
        const dy = e.clientY - canvas.height / 2;
        
        const newX = Math.max(0, Math.min(worldSize, me.x + (dx * 0.1)));
        const newY = Math.max(0, Math.min(worldSize, me.y + (dy * 0.1)));
        
        socket.emit('move', { x: newX, y: newY });
    }
});

draw();
