const socket = io();
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const overlay = document.getElementById('overlay');

let otherPlayers = {};
let foods = [];
const worldSize = 3000;
let isPlaying = false;
let myLocalPos = { x: 1500, y: 1500 }; 
let mousePos = { x: 0, y: 0 };

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

socket.on('initFood', (f) => foods = f);
socket.on('updatePlayers', (p) => {
    otherPlayers = p;
    // Ping/Zıplama kontrolü
    if (p[socket.id]) {
        const sP = p[socket.id];
        const dist = Math.sqrt((sP.x - myLocalPos.x)**2 + (sP.y - myLocalPos.y)**2);
        if (dist > 100) { // Çok büyük fark varsa senkronla
            myLocalPos.x = sP.x;
            myLocalPos.y = sP.y;
        }
    }
});

// OYNA BUTONUNU ÇALIŞTIRAN KISIM
function join(spectate) {
    const nickInput = document.getElementById('nick').value || "baro";
    const roomSelect = document.getElementById('room').value; // HTML'deki ID ile aynı olmalı
    
    overlay.style.display = 'none';
    isPlaying = true;
    socket.emit('join', { room: roomSelect, nick: nickInput, spectate: spectate });
}

window.addEventListener('mousemove', (e) => {
    mousePos.x = e.clientX;
    mousePos.y = e.clientY;
});

// Yerel Hareket Döngüsü (Hassas Fare ve Sıfır Gecikme)
setInterval(() => {
    if (isPlaying && otherPlayers[socket.id]) {
        const dx = mousePos.x - canvas.width / 2;
        const dy = mousePos.y - canvas.height / 2;
        const dist = Math.sqrt(dx*dx + dy*dy);
        
        if (dist > 5) {
            const speed = 4;
            myLocalPos.x += (dx / dist) * speed;
            myLocalPos.y += (dy / dist) * speed;
        }

        // Sınırlar
        myLocalPos.x = Math.max(0, Math.min(worldSize, myLocalPos.x));
        myLocalPos.y = Math.max(0, Math.min(worldSize, myLocalPos.y));

        socket.emit('move', { x: myLocalPos.x, y: myLocalPos.y });
    }
}, 16);

window.addEventListener('keydown', (e) => {
    if (e.key === "Escape") overlay.style.display = (overlay.style.display === 'none') ? 'flex' : 'none';
    if (e.key.toLowerCase() === 's') socket.emit('buyScore');
});

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const me = otherPlayers[socket.id];

    ctx.save();
    ctx.translate(canvas.width / 2 - myLocalPos.x, canvas.height / 2 - myLocalPos.y);

    // Kırmızı Sınırlar
    ctx.strokeStyle = "red"; ctx.lineWidth = 15; ctx.strokeRect(0, 0, worldSize, worldSize);

    // Yemler
    foods.forEach(f => {
        ctx.fillStyle = f.color;
        ctx.beginPath(); ctx.arc(f.x, f.y, 5, 0, Math.PI * 2); ctx.fill();
    });

    // Oyuncular
    Object.keys(otherPlayers).forEach(id => {
        const p = otherPlayers[id];
        const drawX = (id === socket.id) ? myLocalPos.x : p.x;
        const drawY = (id === socket.id) ? myLocalPos.y : p.y;
        
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(drawX, drawY, p.radius, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "white"; ctx.textAlign = "center";
        ctx.fillText(p.nick, drawX, drawY + 5);
    });

    ctx.restore();

    // HUD
    if (me) {
        ctx.fillStyle = "yellow"; ctx.font = "bold 22px Arial";
        ctx.fillText(`Gold: ${me.gold}`, 20, 40);
        ctx.fillStyle = "white";
        ctx.fillText(`Skor: ${Math.floor(me.score)}`, 20, 70);
    }
    requestAnimationFrame(draw);
}
draw();
