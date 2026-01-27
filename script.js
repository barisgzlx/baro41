const socket = io();
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const overlay = document.getElementById('overlay');
const lbList = document.getElementById('lb-list'); // HTML'deki liste alanı

let otherPlayers = {};
let foods = [];
let myLocalPos = { x: 1500, y: 1500 }; 
let isPlaying = false;
let mousePos = { x: 0, y: 0 };
const worldSize = 3000;

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Sunucudan güncel yem listesi gelince hemen güncelle
socket.on('initFood', (f) => { foods = f; });

socket.on('updatePlayers', (p) => {
    otherPlayers = p;
    if (p[socket.id]) {
        const sP = p[socket.id];
        // Sarsıntıyı bitirmek için yumuşak takip
        myLocalPos.x += (sP.x - myLocalPos.x) * 0.4;
        myLocalPos.y += (sP.y - myLocalPos.y) * 0.4;
    }
    
    // OYUNCU TABLOSU GÜNCELLEME
    if (lbList) {
        let listHTML = "";
        const sortedPlayers = Object.values(p).sort((a,b) => b.score - a.score).slice(0, 10);
        sortedPlayers.forEach((player, index) => {
            listHTML += `<div style="color: ${player.color}; font-weight: bold; font-size: 14px; margin-bottom: 5px;">
                ${index + 1}. ${player.nick}: ${Math.floor(player.score)}
            </div>`;
        });
        lbList.innerHTML = listHTML;
    }
});

// Başlığı "Oyuncu Tablosu" yap
const leaderboardTitle = document.querySelector('#leaderboard h3');
if (leaderboardTitle) leaderboardTitle.innerText = "Oyuncu Tablosu";

window.addEventListener('keydown', (e) => {
    if (e.key === "Escape") overlay.style.display = (overlay.style.display === 'none') ? 'flex' : 'none';
    if (e.key.toLowerCase() === 's') socket.emit('buyScore');
});

function join(spectate) {
    const nickVal = document.getElementById('nick').value || "baro";
    const roomVal = document.getElementById('room').value;
    overlay.style.display = 'none';
    isPlaying = true;
    socket.emit('join', { room: roomVal, nick: nickVal, spectate: spectate });
}

window.addEventListener('mousemove', (e) => {
    mousePos.x = e.clientX;
    mousePos.y = e.clientY;
});

// Akıcı hareket döngüsü
setInterval(() => {
    if (isPlaying && otherPlayers[socket.id]) {
        const dx = mousePos.x - canvas.width / 2;
        const dy = mousePos.y - canvas.height / 2;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist > 5) {
            myLocalPos.x += (dx / dist) * 4.5;
            myLocalPos.y += (dy / dist) * 4.5;
        }
        myLocalPos.x = Math.max(0, Math.min(worldSize, myLocalPos.x));
        myLocalPos.y = Math.max(0, Math.min(worldSize, myLocalPos.y));
        socket.emit('move', { x: myLocalPos.x, y: myLocalPos.y });
    }
}, 16);

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!isPlaying) { requestAnimationFrame(draw); return; }

    const me = otherPlayers[socket.id];
    ctx.save();
    ctx.translate(canvas.width / 2 - myLocalPos.x, canvas.height / 2 - myLocalPos.y);

    // Kırmızı Sınır
    ctx.strokeStyle = "red"; ctx.lineWidth = 15; ctx.strokeRect(0, 0, worldSize, worldSize);

    // Yemleri Çiz
    foods.forEach(f => {
        ctx.fillStyle = f.color;
        ctx.beginPath(); ctx.arc(f.x, f.y, 6, 0, Math.PI * 2); ctx.fill();
    });

    // Oyuncuları Çiz
    Object.keys(otherPlayers).forEach(id => {
        const p = otherPlayers[id];
        const renderX = (id === socket.id) ? myLocalPos.x : p.x;
        const renderY = (id === socket.id) ? myLocalPos.y : p.y;
        
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(renderX, renderY, p.radius, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "white"; ctx.textAlign = "center";
        ctx.font = "bold 14px Arial";
        ctx.fillText(p.nick, renderX, renderY + 5);
    });
    ctx.restore();

    // HUD
    if (me) {
        ctx.fillStyle = "yellow"; ctx.font = "bold 20px Arial";
        ctx.fillText(`Gold: ${me.gold}`, 20, 40);
        ctx.fillStyle = "white";
        ctx.fillText(`Skor: ${Math.floor(me.score)}`, 20, 70);
    }
    requestAnimationFrame(draw);
}
draw();
