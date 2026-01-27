const socket = io();
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const overlay = document.getElementById('overlay');
const lbList = document.getElementById('lb-list');
const timerEl = document.getElementById('timer');

let otherPlayers = {};
let foods = [];
let myLocalPos = { x: 1500, y: 1500 }; 
let isPlaying = false;
let mousePos = { x: 0, y: 0 };
let zoom = 1; // Kamera ölçeği
const worldSize = 3000;

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

socket.on('initFood', (f) => { foods = f; });
socket.on('respawn', () => { myLocalPos = { x: 1500, y: 1500 }; alert("Yenildin! 100 skorla yeniden doğuyorsun."); });

window.addEventListener('keydown', (e) => {
    if (e.key === "Escape") {
        overlay.style.display = (overlay.style.display === 'none' || overlay.style.display === '') ? 'flex' : 'none';
    }
    if (e.key.toLowerCase() === 's') { socket.emit('buyScore'); }
});

socket.on('timerUpdate', (seconds) => {
    let h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    let m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    let s = (seconds % 60).toString().padStart(2, '0');
    timerEl.innerText = `${h}:${m}:${s}`;
});

socket.on('updatePlayers', (p) => {
    otherPlayers = p;
    const me = p[socket.id];
    if (me) {
        document.getElementById('my-gold').innerText = me.gold;
        document.getElementById('my-score').innerText = Math.floor(me.score);
        
        // ZOOM MANTIĞI: Skor arttıkça zoom azalır (Kamera uzaklaşır)
        // Agarz tarzı görünüm sağlayan kritik formül
        zoom = Math.pow(Math.min(1, 45 / me.radius), 0.4);
    }
    if (lbList) {
        let listHTML = "";
        const sorted = Object.values(p).sort((a,b) => b.score - a.score).slice(0, 10);
        sorted.forEach((pl, i) => {
            listHTML += `<div><span>${i+1}. ${pl.nick}</span> <b>${Math.floor(pl.score)}</b></div>`;
        });
        lbList.innerHTML = listHTML;
    }
});

function join() {
    const rVal = document.getElementById('room').value;
    document.getElementById('room-name').innerText = rVal.toUpperCase();
    overlay.style.display = 'none';
    isPlaying = true;
    socket.emit('join', { nick: document.getElementById('nick').value, room: rVal });
}

window.addEventListener('mousemove', (e) => { mousePos = { x: e.clientX, y: e.clientY }; });

setInterval(() => {
    if (isPlaying && otherPlayers[socket.id]) {
        const dx = mousePos.x - canvas.width / 2;
        const dy = mousePos.y - canvas.height / 2;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist > 5) {
            // Büyük hücreler biraz daha yavaş hareket eder (Agarz Dengesi)
            let speed = 4.5 * Math.pow(0.9, (otherPlayers[socket.id].radius - 45) / 50);
            myLocalPos.x += (dx / dist) * Math.max(1.5, speed);
            myLocalPos.y += (dy / dist) * Math.max(1.5, speed);
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
    // Ekrana göre ortala ve ZOOM uygula
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.scale(zoom, zoom);
    ctx.translate(-myLocalPos.x, -myLocalPos.y);
    
    // Arkaplan Izgarası (Grid) - Agarz hissi verir
    ctx.strokeStyle = "#222"; ctx.lineWidth = 2;
    for(let i=0; i<=worldSize; i+=100){
        ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i,worldSize); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0,i); ctx.lineTo(worldSize,i); ctx.stroke();
    }

    ctx.strokeStyle = "red"; ctx.lineWidth = 15; ctx.strokeRect(0, 0, worldSize, worldSize);

    foods.forEach(f => {
        ctx.fillStyle = f.color;
        ctx.beginPath(); ctx.arc(f.x, f.y, 8, 0, Math.PI * 2); ctx.fill();
    });

    Object.keys(otherPlayers).forEach(id => {
        const p = otherPlayers[id];
        const rX = (id === socket.id) ? myLocalPos.x : p.x;
        const rY = (id === socket.id) ? myLocalPos.y : p.y;
        
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(rX, rY, p.radius, 0, Math.PI * 2); ctx.fill();
        
        // İsim boyutu karakterle beraber büyür
        ctx.fillStyle = "white"; ctx.textAlign = "center"; 
        let fontSize = Math.max(14, p.radius / 3);
        ctx.font = `bold ${fontSize}px Arial`;
        ctx.fillText(p.nick, rX, rY + (fontSize/3));
    });
    ctx.restore();
    requestAnimationFrame(draw);
}
draw();
