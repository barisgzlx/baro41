const socket = io();
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const menu = document.getElementById('menu');

let playerActive = false;
let otherPlayers = {};
let player = { x: 0, y: 0, radius: 20, color: 'dodgerblue' };
let foods = [];

function joinRoom(roomName) {
    menu.style.display = 'none';
    canvas.style.display = 'block';
    playerActive = true;
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // 100 tane yem oluştur
    for (let i = 0; i < 100; i++) {
        foods.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            radius: 5,
            color: `hsl(${Math.random() * 360}, 100%, 50%)`
        });
    }
    
    socket.emit('join', roomName);
    draw();
}

socket.on('updatePlayers', (serverPlayers) => {
    otherPlayers = serverPlayers;
});

function draw() {
    if (!playerActive) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Yemler
    foods.forEach((food, index) => {
        ctx.beginPath();
        ctx.arc(food.x, food.y, food.radius, 0, Math.PI * 2);
        ctx.fillStyle = food.color;
        ctx.fill();
        
        let dx = player.x - food.x;
        let dy = player.y - food.y;
        if (Math.sqrt(dx*dx + dy*dy) < player.radius + food.radius) {
            foods.splice(index, 1);
            player.radius += 0.2;
            foods.push({x: Math.random()*canvas.width, y: Math.random()*canvas.height, radius: 5, color: food.color});
        }
    });

    // Diğer Oyuncular
    Object.keys(otherPlayers).forEach((id) => {
        if (id !== socket.id) {
            let p = otherPlayers[id];
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fillStyle = 'red';
            ctx.fill();
        }
    });

    // Kendim
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fillStyle = player.color;
    ctx.fill();

    requestAnimationFrame(draw);
}

window.addEventListener('mousemove', (e) => {
    if (playerActive) {
        player.x = e.clientX;
        player.y = e.clientY;
        socket.emit('move', { x: player.x, y: player.y, radius: player.radius });
    }
});
