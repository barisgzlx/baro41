const socket = io();
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const overlay = document.getElementById('overlay');

let otherPlayers = {};
let foods = [];
let myLocalPos = { x: 1500, y: 1500 }; 
let isPlaying = false;

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

socket.on('initFood', f => foods = f);
socket.on('updatePlayers', p => otherPlayers = p);

// OYNA BUTONU FONKSİYONU
function join() {
    const nickVal = document.getElementById('nick').value || "baro";
    const roomVal = document.getElementById('room').value; // FFA-1 veya FFA-2 gelir
    
    isPlaying = true;
    overlay.style.display = 'none';
    socket.emit('join', { room: roomVal, nick: nickVal });
}

// Fare Hareketi (Gecikmesiz)
window.addEventListener('mousemove', (e) => {
    if (isPlaying) {
        let dx = e.clientX - canvas.width / 2;
        let dy = e.clientY - canvas.height / 2;
        let dist = Math.sqrt(dx*dx + dy*dy);
        if (dist > 5) {
            myLocalPos.x += (dx/dist) * 5;
            myLocalPos.y += (dy/dist) * 5;
        }
        socket.emit('move', { x: myLocalPos.x, y: myLocalPos.y });
    }
});

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!isPlaying) { requestAnimationFrame(draw); return; }

    ctx.save();
    ctx.translate(canvas.width/2 - myLocalPos.x, canvas.height/2 - myLocalPos.y);

    // Grid ve Sınır
    ctx.strokeStyle = "red"; ctx.lineWidth = 10; ctx.strokeRect(0, 0, 3000, 3000);

    foods.forEach(f => {
        ctx.fillStyle = f.color;
        ctx.beginPath(); ctx.arc(f.x, f.y, 5, 0, Math.PI*2); ctx.fill();
    });

    Object.keys(otherPlayers).forEach(id => {
        let p = otherPlayers[id];
        let dX = (id === socket.id) ? myLocalPos.x : p.x;
        let dY = (id === socket.id) ? myLocalPos.y : p.y;
        
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(dX, dY, p.radius, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = "white"; ctx.textAlign = "center";
        ctx.fillText(p.nick, dX, dY + 5);
    });

    ctx.restore();
    requestAnimationFrame(draw);
}
draw();
