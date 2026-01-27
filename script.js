const socket = io();
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const overlay = document.getElementById('overlay');
const lbList = document.getElementById('lb-list');
const timerEl = document.getElementById('timer');

let otherPlayers = {};
let foods = [];
let myPos = { x: 1500, y: 1500 }; 
let isPlaying = false;
let isSpectating = false;
let zoom = 1;
const worldSize = 3000;

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Başlangıçta hafızadaki Gold'u yükle
if(!localStorage.getItem('baro_gold')) localStorage.setItem('baro_gold', 500);

socket.on('initFood', (f) => { foods = f; });
socket.on('initWinner', (w) => { document.querySelector('#last-winner span').innerText = w; });

socket.on('gameFinished', (data) => {
    const myNick = document.getElementById('nick').value || "Baro";
    if(data.winner === myNick) {
        let currentWin = Number(localStorage.getItem('baro_win') || 0);
        localStorage.setItem('baro_win', currentWin + 1);
        // Kazandığı için 1 Milyar Gold ödül ver (Örnek)
        let currentGold = Number(localStorage.getItem('baro_gold') || 0);
        localStorage.setItem('baro_gold', Math.min(1000000000000, currentGold + 1000000000));
    }
    alert("Şampiyon: " + data.winner);
    location.reload();
});

socket.on('updatePlayers', (p) => {
    otherPlayers = p;
    const me = p[socket.id];
    if (me) {
        // Gold'u hafızadan alıyoruz
        document.getElementById('my-gold').innerText = Number(localStorage.getItem('baro_gold')).toLocaleString();
        document.getElementById('my-score').innerText = Math.floor(me.score);
        zoom = Math.pow(Math.min(1, 45 / me.radius), 0.3);
    }
    let html = "";
    Object.values(p).sort((a,b) => b.score - a.score).slice(0, 10).forEach((pl, i) => {
        html += `<div><span>${i+1}. ${pl.nick}</span> <b>${Math.floor(pl.score)}</b></div>`;
    });
    lbList.innerHTML = html;
});

function join(spec) {
    isSpectating = spec;
    socket.emit('join', { nick: document.getElementById('nick').value || "Baro", spectate: spec });
    overlay.style.display = 'none';
    isPlaying = true;
    requestAnimationFrame(gameLoop);
}

let mousePos = { x: canvas.width/2, y: canvas.height/2 };
window.addEventListener('mousemove', (e) => { mousePos = { x: e.clientX, y: e.clientY }; });

function gameLoop() {
    if(!isPlaying) return;
    if(!isSpectating && otherPlayers[socket.id]) {
        const dx = mousePos.x - canvas.width / 2;
        const dy = mousePos.y - canvas.height / 2;
        const dist = Math.hypot(dx, dy);
        if (dist > 5) {
            // Hareket Tahmini (Prediction): Sunucuyu beklemeden yerel hareket
            let speed = 4.8 * Math.pow(0.93, (otherPlayers[socket.id].radius - 45) / 50);
            myPos.x += (dx / dist) * speed;
            myPos.y += (dy / dist) * speed;
        }
        myPos.x = Math.max(0, Math.min(worldSize, myPos.x));
        myPos.y = Math.max(0, Math.min(worldSize, myPos.y));
        socket.emit('move', { x: myPos.x, y: myPos.y });
    }
    draw();
    requestAnimationFrame(gameLoop);
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.scale(zoom, zoom);
    ctx.translate(-myPos.x, -myPos.y);
    ctx.strokeStyle = "red"; ctx.lineWidth = 15; ctx.strokeRect(0, 0, worldSize, worldSize);
    foods.forEach(f => {
        ctx.fillStyle = f.color;
        ctx.beginPath(); ctx.arc(f.x, f.y, 10, 0, Math.PI * 2); ctx.fill();
    });
    Object.keys(otherPlayers).forEach(id => {
        const p = otherPlayers[id];
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "white"; ctx.textAlign = "center";
        ctx.font = `bold ${Math.max(14, p.radius/2.5)}px Arial`;
        ctx.fillText(p.nick, p.x, p.y + (p.radius/10));
    });
    ctx.restore();
}

window.addEventListener('keydown', (e) => { if (e.key === "Escape") overlay.style.display = 'flex'; });
socket.on('timerUpdate', (sec) => {
    let m = Math.floor(sec / 60); let s = sec % 60;
    timerEl.innerText = `${m}:${s < 10 ? '0'+s : s}`;
});
