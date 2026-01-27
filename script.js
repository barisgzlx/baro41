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

// 1. Rastgele yemler dizisi oluştur
let foods = [];
for (let i = 0; i < 100; i++) {
    foods.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: 5,
        color: `hsl(${Math.random() * 360}, 100%, 50%)`
    });
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 2. Yemleri ekrana çiz
    foods.forEach((food, index) => {
        ctx.beginPath();
        ctx.arc(food.x, food.y, food.radius, 0, Math.PI * 2);
        ctx.fillStyle = food.color;
        ctx.fill();
        ctx.closePath();

        // 3. Yeme çarpma kontrolü (Mesafe ölçümü)
        let dx = player.x - food.x;
        let dy = player.y - food.y;
        let distance = Math.sqrt(dx * dx + dy * dy);

        // Eğer mavi baloncuk yeme dokunursa
        if (distance < player.radius + food.radius) {
            foods.splice(index, 1); // Yemi ekrandan sil
            player.radius += 0.5;   // Oyuncuyu biraz büyüt
            
            // Yeni bir yem ekle ki dünya boş kalmasın
            foods.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                radius: 5,
                color: `hsl(${Math.random() * 360}, 100%, 50%)`
            });
        }
    });

    // 4. Mavi karakteri çiz
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
