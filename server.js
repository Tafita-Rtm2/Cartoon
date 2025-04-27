const express = require('express');
const proxy = require('express-http-proxy');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Servir le dossier public (ton site propre)
app.use(express.static(path.join(__dirname, 'public')));

// Proxy pour l'API GPT-4o
app.use('/api', proxy('https://gpt.tiptopuni.com', {
  proxyReqPathResolver: (req) => {
    return `/api${req.url}`;
  },
  userResDecorator: (proxyRes, proxyResData) => {
    try {
      const data = JSON.parse(proxyResData.toString('utf8'));
      return data;
    } catch (error) {
      return proxyResData;
    }
  }
}));

// Toutes autres routes renvoient ton site cloné
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Lancement du serveur
app.listen(PORT, () => {
  console.log(`Serveur lancé sur http://localhost:${PORT}`);
});
