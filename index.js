const express = require('express');
const path = require('path');
const app = express();

// Dosyaları ana dizinden oku
app.use(express.static(__dirname));

// Ana sayfayı açınca index.html'i göster
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('Sunucu calisiyor!');
});
