const express = require('express');
const app = express();
const path = require('path');

// Sunucunun HTML, CSS ve JS dosyalarını (script.js gibi) bulmasını sağlar
app.use(express.static(__dirname));

// Ana sayfaya (/) girildiğinde index.html dosyasını tarayıcıya gönderir
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Render platformunun verdiği dinamik portu veya yerel test için 3000 portunu kullanır
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Oyun ${PORT} portunda yayında!`);
});
