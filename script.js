const socket = io();
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const overlay = document.getElementById('overlay');
const hud = document.getElementById('hud');

let isPlaying = false;
let otherPlayers = {};
let foods = [];
const worldSize = 3000;

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Yemleri sunucudan al
socket.on('initFood', (serverFood) => {
    foods = serverFood;
});

socket.on('updatePlayers', (players) => {
    otherPlayers = players;
});

function join(spectate) {
    const nick = document.getElementById('nick').value || "baro";
    const room = document.getElementById('room').value;
    
    overlay.style.display = 'none';
    hud.style.display = 'block';
    isPlaying = !spectate;
    
    socket.emit('join', { room, nick, spectate });
}

// ESC Desteği
window.addEventListener('keydown', (e) => {
    if (e.key === "Escape") overlay.style.display = 'flex';
});

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const me = otherPlayers[socket.id];

    ctx.save();
    if (me) {
        ctx.translate(canvas.width/2 - me.x, canvas.height/2 - me.y);
    }

    // KIRMIZI SINIR
    ctx.strokeStyle = "red";
    ctx.lineWidth = 15;
    ctx.strokeRect(0, 0, worldSize, worldSize);

    // GRID ÇİZGİLERİ
    ctx.strokeStyle = "#111";
    ctx.lineWidth = 1;
    for(let i=0; i<=worldSize; i+=50) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, worldSize); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(worldSize, i); ctx.stroke();
    }

    // YEMLERİ ÇİZ
    foods.forEach(f => {
        ctx.beginPath();
        ctx.arc(f.x, f.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = f.color;
        ctx.fill();
    });

    // OYUNCULARI ÇİZ
    Object.keys(otherPlayers).forEach(id => {
        const p = otherPlayers[id];
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        ctx.font = "bold 15px Arial";
        ctx.fillText(p.nick, p.x, p.y + 5);
    });

    ctx.restore();
    requestAnimationFrame(draw);
}

// HIZLI HAREKET KONTROLÜ
window.addEventListener('mousemove', (e) => {
    if (isPlaying && otherPlayers[socket.id] && overlay.style.display === 'none') {
        const me = otherPlayers[socket.id];
        const dx = e.clientX - canvas.width / 2;
        const dy = e.clientY - canvas.height / 2;
        
        // Hız çarpanı 0.15 olarak güncellendi
        const moveX = me.x + (dx * 0.15);
        const moveY = me.y + (dy * 0.15);
        
        socket.emit('move', { 
            x: Math.max(0, Math.min(worldSize, moveX)), 
            y: Math.max(0, Math.min(worldSize, moveY)) 
        });
    }
});

draw();
