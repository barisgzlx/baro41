const socket = io();
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const overlay = document.getElementById('overlay');

let otherPlayers = {};
let foods = [];
const worldSize = 3000;
let isPlaying = false;
let myLocalPos = { x: 1500, y: 1500 }; // Yerel konum (Pingi gizler)

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

socket.on('initFood', (f) => foods = f);
socket.on('updatePlayers', (p) => {
    otherPlayers = p;
    // Sunucudan gelen konumu yerel konumla eşitle (çok sapma varsa)
    if (p[socket.id]) {
        const serverP = p[socket.id];
        const dist = Math.sqrt((serverP.x - myLocalPos.x)**2 + (serverP.y - myLocalPos.y)**2);
        if (dist > 50) { // Sadece çok büyük fark varsa ışınla
            myLocalPos.x = serverP.x;
            myLocalPos.y = serverP.y;
        }
    }
});

window.addEventListener('keydown', (e) => {
    if (e.key === "Escape") overlay.style.display = (overlay.style.display === 'none') ? 'flex' : 'none';
    if (e.key.toLowerCase() === 's') socket.emit('buyScore');
});

function join(spectate) {
    overlay.style.display = 'none';
    isPlaying = true;
    socket.emit('join', { 
        room: document.getElementById('room').value, 
        nick: document.getElementById('nick').value || "baro", 
        spectate 
    });
}

// PINGİ SIFIRA İNDİREN HAREKET MANTIĞI
setInterval(() => {
    if (isPlaying && otherPlayers[socket.id]) {
        const me = otherPlayers[socket.id];
        // Fare hedefini hesapla
        const targetX = myLocalPos.x + (mousePos.x - canvas.width / 2);
        const targetY = myLocalPos.y + (mousePos.y - canvas.height / 2);
        
        let dx = targetX - myLocalPos.x;
        let dy = targetY - myLocalPos.y;
        let dist = Math.sqrt(dx*dx + dy*dy);
        
        if (dist > 5) {
            let speed = 4;
            myLocalPos.x += (dx/dist) * speed;
            myLocalPos.y += (dy/dist) * speed;
        }

        // Sınırlar
        myLocalPos.x = Math.max(0, Math.min(worldSize, myLocalPos.x));
        myLocalPos.y = Math.max(0, Math.min(worldSize, myLocalPos.y));

        // Sunucuya sadece konumu bildir
        socket.emit('move', { x: myLocalPos.x, y: myLocalPos.y });
    }
}, 16); // 60 FPS Yerel Hareket

let mousePos = { x: 0, y: 0 };
window.addEventListener('mousemove', (e) => {
    mousePos.x = e.clientX;
    mousePos.y = e.clientY;
});

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const me = otherPlayers[socket.id];

    ctx.save();
    // Kamerayı sunucu verisine değil, kendi yerel konumuna (myLocalPos) odakla!
    ctx.translate(canvas.width / 2 - myLocalPos.x, canvas.height / 2 - myLocalPos.y);

    // Grid ve Kırmızı Sınır
    ctx.strokeStyle = "red"; ctx.lineWidth = 15; ctx.strokeRect(0, 0, worldSize, worldSize);
    ctx.strokeStyle = "#111"; ctx.lineWidth = 1;
    for(let i=0; i<=worldSize; i+=50) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, worldSize); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(worldSize, i); ctx.stroke();
    }

    // Yemler
    foods.forEach(f => {
        ctx.fillStyle = f.color;
        ctx.beginPath(); ctx.arc(f.x, f.y, 5, 0, Math.PI * 2); ctx.fill();
    });

    // Oyuncular
    Object.keys(otherPlayers).forEach(id => {
        const p = otherPlayers[id];
        const displayX = (id === socket.id) ? myLocalPos.x : p.x;
        const displayY = (id === socket.id) ? myLocalPos.y : p.y;

        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(displayX, displayY, p.radius, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "white"; ctx.textAlign = "center";
        ctx.font = "bold 14px Arial";
        ctx.fillText(p.nick, displayX, displayY + 5);
    });

    ctx.restore();

    // HUD: Gold ve Skor
    if (me) {
