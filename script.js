const socket = io();
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const overlay = document.getElementById('overlay');
const lbList = document.getElementById('lb-list');
const timerEl = document.getElementById('timer');

let otherPlayers = {};
let foods = [];
let myLocalPos = { x: 2000, y: 2000 }; 
let isPlaying = false;
let isSpectating = false;
let mousePos = { x: 0, y: 0 };
let zoom = 1;
const worldSize = 4000;

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

socket.on('initFood', (f) => { foods = f; });
socket.on('initWinner', (w) => { document.querySelector('#last-winner span').innerText = w; });
socket.on('gameFinished', (data) => { alert("Süre Bitti! Kazanan: " + data.winner); location.reload(); });

window.addEventListener('keydown', (e) => {
    if (e.key === "Escape") overlay.style.display = 'flex';
    if (e.key.toLowerCase() === 's') socket.emit('buyScore');
});

socket.on('timerUpdate', (sec) => {
    let m = Math.floor(sec / 60);
    let s = sec % 60;
    timerEl.innerText = `${m}:${s < 10 ? '0'+s : s}`;
});

socket.on('updatePlayers', (p) => {
    otherPlayers = p;
    const me = p[socket.id];
    
    if (me) {
        document.getElementById('my-gold').innerText = me.gold;
        document.getElementById('my-score').innerText = Math.floor(me.score);
        zoom = Math.pow(Math.min(1, 45 / me.radius), 0.35); // Zoom hızı yumuşatıldı
    } else if (isSpectating) {
        // İzleyici modu: En büyük oyuncuyu bul
        let players = Object.values(p);
        if(players.length > 0) {
            let top = players.sort((a,b) => b.score - a.score)[0];
            myLocalPos.x = top.x; myLocalPos.y = top.y;
            zoom = Math.pow(Math.min(1, 45 / top.radius), 0.35);
        }
    }

    if (lbList) {
        let html = "";
        Object.values(p).sort((a,b) => b.score - a.score).slice(0, 10).forEach((pl, i) => {
            html += `<div><span>${i+1}. ${pl.nick}</span> <b>${Math.floor(pl.score)}</b></div>`;
        });
        lbList.innerHTML = html;
    }
});

function join(spec) {
    isSpectating = spec;
    const nick = document.getElementById('nick').value || "Baro";
    const room = document.getElementById('room').value;
    overlay.style.display = 'none';
    if (!isPlaying || isSpectating) {
        socket.emit('join', { nick, room, spectate: spec });
        isPlaying = true;
    }
}

window.addEventListener('mousemove', (e) => { mousePos = { x: e.clientX, y: e.clientY }; });

setInterval(() => {
    if (isPlaying && !isSpectating && otherPlayers[socket.id]) {
        const dx = mousePos.x - canvas.width / 2;
        const dy = mousePos.y - canvas.height / 2;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist > 5) {
            // Agarz Hız Formülü: Büyüdükçe yavaşlama
            let speed = 4 * Math.pow(0.92, (otherPlayers[socket.id].radius - 40) / 40);
            myLocalPos.x += (dx / dist) * Math.max(1.2, speed);
            myLocalPos.y += (dy / dist) * Math.max(1.2, speed);
        }
        myLocalPos.x = Math.max(0, Math.min(worldSize, myLocalPos.x));
        myLocalPos.y = Math.max(0, Math.min(worldSize, myLocalPos.y));
        socket.emit('move', { x: myLocalPos.x, y: myLocalPos.y });
    }
}, 16);

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!isPlaying) { requestAnimationFrame(draw); return; }

    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.scale(zoom, zoom);
    ctx.translate(-myLocalPos.x, -myLocalPos.y);
    
    // Grid
    ctx.strokeStyle = "#222"; ctx.lineWidth = 2;
    for(let i=0; i<=worldSize; i+=100){
        ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i,worldSize); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0,i); ctx.lineTo(worldSize,i); ctx.stroke();
    }

    foods.forEach(f => {
        ctx.fillStyle = f.color;
        ctx.beginPath(); ctx.arc(f.x, f.y, 10, 0, Math.PI * 2); ctx.fill();
    });

    Object.keys(otherPlayers).forEach(id => {
        const p = otherPlayers[id];
        const rX = (id === socket.id && !isSpectating) ? myLocalPos.x : p.x;
        const rY = (id === socket.id && !isSpectating) ? myLocalPos.y : p.y;
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(rX, rY, p.radius, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "white"; ctx.textAlign = "center"; 
        ctx.font = `bold ${Math.max(14, p.radius/2.5)}px Arial`;
        ctx.fillText(p.nick, rX, rY + (p.radius/10));
    });
    ctx.restore();
    requestAnimationFrame(draw);
}
draw();
