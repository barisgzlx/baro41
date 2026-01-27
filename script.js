// ... (Değişkenlerin altına ekle)
window.addEventListener('keydown', (e) => {
    // ESC TUŞU TAMİRİ
    if (e.key === "Escape") {
        const overlay = document.getElementById('overlay');
        overlay.style.display = (overlay.style.display === 'none') ? 'flex' : 'none';
    }
    // S TUŞU (Gold -> Skor)
    if (e.key.toLowerCase() === 's') {
        socket.emit('buyScore');
    }
});

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const me = otherPlayers[socket.id];

    ctx.save();
    if (me) {
        ctx.translate(canvas.width/2 - me.x, canvas.height/2 - me.y);
        
        // SOL ÜST HUD (SKOR VE GOLD)
        ctx.restore(); // HUD sabit kalsın diye save/restore dışına
        ctx.fillStyle = "yellow";
        ctx.font = "bold 20px Arial";
        ctx.fillText(`Gold: ${me.gold}`, 20, 40);
        ctx.fillStyle = "white";
        ctx.fillText(`Skor: ${Math.floor(me.score)}`, 20, 70);
        ctx.save();
        ctx.translate(canvas.width/2 - me.x, canvas.height/2 - me.y);
    }

    // ... (Grid, Sınır, Yem ve Oyuncu çizimleri aynı kalsın)
    ctx.restore();
    requestAnimationFrame(draw);
}
