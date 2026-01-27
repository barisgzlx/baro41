const socket = io();
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const overlay = document.getElementById('overlay');

let otherPlayers = {};
let foods = [];
let myLocalPos = { x: 1500, y: 1500 }; // Yerel konum (Pingi hissettirmez)
let isPlaying = false;
let mousePos = { x: 0, y: 0 };
const worldSize = 3000;

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Sunucudan gelen verileri dinle
socket.on('initFood', (f) => foods = f);
socket.on('updatePlayers', (p) => {
    otherPlayers = p;
    // Eğer sunucu ile yerel konum arasında çok fark varsa düzelt
    if (p[socket.id]) {
        const sP = p[socket.id];
        const dist = Math.sqrt((sP.x - myLocalPos.x)**2 + (sP.y - myLocalPos.y)**2);
        if (dist > 100) { 
            myLocalPos.x = sP.x;
            myLocalPos.y = sP.y;
        }
    }
});

// OYNA BUTONU: FFA odasına girişi sağlar
function join(spectate) {
    const nickVal = document.getElementById('nick').value || "baro";
    const roomVal = document.getElementById('room').value; // FFA-1 veya FFA-2
    
    overlay.style.display = 'none';
    isPlaying = true;
    socket.emit('join', { room: roomVal, nick: nickVal, spectate: spectate });
}

// Fare hareketini takip et
window.addEventListener('mousemove', (e) => {
    mousePos.x = e.clientX;
    mousePos.y = e.clientY;
});

// Klavye kontrolleri
window.addEventListener('keydown', (e) => {
    if (e.key === "Escape") overlay.style.display = (overlay.style.display === 'none') ? 'flex' : 'none';
    if (e.key.toLowerCase() === 's') socket.emit('buyScore'); // Gold ile büyüme
});

// HAREKET DÖNGÜSÜ: Pingi sıfıra indirir
setInterval(() => {
    if (isPlaying && otherPlayers[socket.id]) {
        const dx = mousePos.x - canvas.width / 2;
        const dy = mousePos.y - canvas.height / 2;
        const dist = Math.sqrt(dx*dx + dy*dy);
        
        if (dist > 5) {
            const speed = 4.5;
            myLocalPos.x += (dx / dist) * speed;
            myLocalPos.y += (dy / dist) * speed;
        }

        // Sınırları koru
        myLocalPos.x = Math.max(0, Math.min(worldSize, myLocalPos.x));
        myLocalPos.y = Math.max(0, Math.min(worldSize, myLocalPos.y));

        // Sunucuya "ben buradayım" de
        socket.emit('move', { x: myLocalPos.x, y: myLocalPos.y });
    }
}, 16); // 60 FPS akıcılık

// ÇİZİM DÖNGÜSÜ
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!isPlaying) { requestAnimationFrame(draw); return; }

    const me = otherPlayers[socket.id];
    ctx.save();
    // Kamerayı yerel konuma odakla (Karakterin donmamasını sağlar)
    ctx.translate(canvas.width / 2 - myLocalPos.x, canvas.height / 2 - myLocalPos.y);

    // Kırmızı Sınırlar
    ctx.strokeStyle = "red"; ctx.lineWidth = 15;
    ctx.strokeRect(0, 0, worldSize, worldSize);

    // Yemleri Çiz
    foods.forEach(f => {
        ctx.fillStyle = f.color;
        ctx.beginPath(); ctx.arc(f.x, f.y, 6, 0, Math.PI * 2); ctx.fill();
    });

    // Oyuncuları Çiz
    Object.keys(otherPlayers).forEach(id => {
        const p = otherPlayers[id];
        const dX = (id === socket.id) ? myLocalPos.x : p.x;
        const dY = (id === socket.id) ? myLocalPos.y : p.y;
        
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(dX, dY, p.radius, 0, Math.PI * 2); ctx.fill();
        
        ctx.fillStyle = "white"; ctx.textAlign = "center";
        ctx.font = "bold 16px Arial";
        ctx.fillText(p.nick, dX, dY + 5);
    });

    ctx.restore();

    // HUD: Gold ve Skor Göstergesi
    if (me) {
        ctx.fillStyle = "yellow"; ctx.font = "bold 24px Arial";
        ctx.fillText(`Gold: ${me.gold}`, 30, 50);
        ctx.fillStyle = "white";
        ctx.fillText(`Skor: ${Math.floor(me.score)}`, 30, 85);
    }

    requestAnimationFrame(draw);
}
draw();
