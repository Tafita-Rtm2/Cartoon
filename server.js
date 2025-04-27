const express = require('express');
const proxy = require('express-http-proxy');
const puppeteer = require('./puppeteer');

const app = express();
const PORT = process.env.PORT || 3000;

// Puppeteer route
app.get('/', async (req, res) => {
  try {
    const html = await puppeteer.capturePage();
    res.send(html);
  } catch (error) {
    console.error('Erreur Puppeteer:', error.message);
    res.status(500).send('Erreur serveur.');
  }
});

// Proxy API requests vers TipTopUni
app.use('/api', proxy('https://gpt.tiptopuni.com', {
  proxyReqPathResolver: (req) => `/api${req.url}`
}));

app.listen(PORT, () => {
  console.log(`Serveur lancé sur http://localhost:${PORT}`);
});
