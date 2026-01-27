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

// Rastgele yemler oluştur
let foods = [];
for (let i = 0; i < 50; i++) {
    foods.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: 5,
        color: `hsl(${Math.random() * 360}, 100%, 50%)`
    });
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Yemleri çiz
    foods.forEach((food, index) => {
        ctx.beginPath();
        ctx.arc(food.x, food.y, food.radius, 0, Math.PI * 2);
        ctx.fillStyle = food.color;
        ctx.fill();
        ctx.closePath();

        // Yeme çarpma kontrolü (Basit Agar mantığı)
        let dx = player.x - food.x;
        let dy = player.y - food.y;
        let distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < player.radius + food.radius) {
            foods.splice(index, 1); // Yemi sil
            player.radius += 0.5;   // Oyuncuyu büyüt
        }
    });

    // Karakteri çiz
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
});

draw();
