const socket = io(); // Artık hata vermeyecek
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let player = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: 20,
    color: 'dodgerblue'
};

let otherPlayers = {};
let foods = [];

// Yemleri oluştur (Senin çalışan kodun)
for (let i = 0; i < 100; i++) {
    foods.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: 5,
        color: `hsl(${Math.random() * 360}, 100%, 50%)`
    });
}

socket.on('updatePlayers', (serverPlayers) => {
    otherPlayers = serverPlayers;
});

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Yemleri çiz ve yeme kontrolü
    foods.forEach((food, index) => {
        ctx.beginPath();
        ctx.arc(food.x, food.y, food.radius, 0, Math.PI * 2);
        ctx.fillStyle = food.color;
        ctx.fill();
        ctx.closePath();

        let dx = player.x - food.x;
        let dy = player.y - food.y;
        let distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < player.radius + food.radius) {
            foods.splice(index, 1);
            player.radius += 0.2; // Biraz küçülttüm ki multiplayer dengeli olsun
            foods.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, radius: 5, color: food.color });
        }
    });

    // 2. Diğer oyuncuları çiz (Kırmızı renkte)
    Object.keys(otherPlayers).forEach((id) => {
        if (id !== socket.id) {
            let p = otherPlayers[id];
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fillStyle = 'red';
            ctx.fill();
            ctx.closePath();
        }
    });

    // 3. Kendi karakterini çiz
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fillStyle = player.color;
    ctx.fill();
    ctx.closePath();

    requestAnimationFrame(draw);
}

window.addEventListener('mousemove', (e) => {
    player.x = e.clientX;
    player.y = e.clientY;
    // Hareket bilgisini sunucuya gönder
    socket.emit('move', { x: player.x, y: player.y, radius: player.radius });
});

draw();
