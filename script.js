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

socket.on('initFood', (f) => { foods = f; });

// Ölme durumu (Biri seni yediğinde)
socket.on('respawn', () => {
    myLocalPos = { x: 1500, y: 1500 };
    alert("Yenildin! Tekrar başlıyorsun.");
});

socket.on('updatePlayers', (p) => {
    otherPlayers = p;
    
    // OYUNCU TABLOSU GÜNCELLEME
    if (lbList) {
        let listHTML = "";
        const sorted = Object.values(p).sort((a,b) => b.score - a.score).slice(0, 10);
        sorted.forEach((pl, i) => {
            listHTML += `<div style="color:white; font-size:14px; margin-bottom:4px; font-family: sans-serif;">
                ${i+1}. ${pl.nick}: ${Math.floor(pl.score)}
            </div>`;
        });
        lbList.innerHTML = listHTML;
    }
});

// Başlığı "Oyuncu Tablosu" yap
const h3 = document.querySelector('#leaderboard h3');
if (h3) h3.innerText = "Oyuncu Tablosu";

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

// Hareket Döngüsü (Titreşimsiz)
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

    ctx.strokeStyle = "red"; ctx.lineWidth = 15; ctx.strokeRect(0, 0, worldSize, worldSize);

    foods.forEach(f => {
        ctx.fillStyle = f.color;
        ctx.beginPath(); ctx.arc(f.x, f.y, 6, 0, Math.PI * 2); ctx.fill();
    });

    Object.keys(otherPlayers).forEach(id => {
        const p = otherPlayers[id];
        const rX = (id === socket.id) ? myLocalPos.x : p.x;
        const rY = (id === socket.id) ? myLocalPos.y : p.y;
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(rX, rY, p.radius, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "white"; ctx.textAlign = "center"; ctx.fillText(p.nick, rX, rY + 5);
    });
    ctx.restore();

    if (me) {
        ctx.fillStyle = "yellow"; ctx.font = "bold 20px Arial";
        ctx.fillText(`Gold: ${me.gold}`, 20, 40);
        ctx.fillStyle = "white";
        ctx.fillText(`Skor: ${Math.floor(me.score)}`, 20, 70);
    }
    requestAnimationFrame(draw);
}
draw();
