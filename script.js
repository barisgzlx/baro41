const socket = io();
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const overlay = document.getElementById('overlay');
const hud = document.getElementById('hud');

let isPlaying = false;
let myId = null;
let otherPlayers = {};
const worldSize = 3000; // Geniş harita alanı

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

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
        // Kamera karakteri takip eder (Karakter ortada kalır)
        ctx.translate(canvas.width/2 - me.x, canvas.height/2 - me.y);
    }

    // Harita Sınırı (Kırmızı Çizgi)
    ctx.strokeStyle = "red";
    ctx.lineWidth = 5;
    ctx.strokeRect(0, 0, worldSize, worldSize);

    // Kareli Arkaplan (Grid)
    ctx.strokeStyle = "#111";
    ctx.lineWidth = 1;
    for(let i=0; i<=worldSize; i+=50) {
        ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i,worldSize); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0,i); ctx.lineTo(worldSize,i); ctx.stroke();
    }

    // Oyuncuları Çiz
    Object.keys(otherPlayers).forEach(id => {
        const p = otherPlayers[id];
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
        
        // İsmi Baloncuğun Üzerine Yaz (image_2114f9.png gibi)
        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        ctx.font = "bold 15px Arial";
        ctx.fillText(p.nick, p.x, p.y + 5);
    });

    ctx.restore();
    requestAnimationFrame(draw);
}

window.addEventListener('mousemove', (e) => {
    if (isPlaying && otherPlayers[socket.id]) {
        const me = otherPlayers[socket.id];
        // Fare konumunu dünya koordinatlarına çevir
        const targetX = e.clientX - (canvas.width/2 - me.x);
        const targetY = e.clientY - (canvas.height/2 - me.y);
        socket.emit('move', { x: targetX, y: targetY, radius: me.radius });
    }
});

draw();
