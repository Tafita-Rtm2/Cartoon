const express = require('express');
const puppeteer = require('puppeteer');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', async (req, res) => {
  try {
    const browser = await puppeteer.launch({
      headless: true,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/google-chrome-stable', 
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--single-process'
      ]
    });
    const page = await browser.newPage();
    await page.goto('https://gpt.tiptopuni.com/#/chat', {
      waitUntil: 'networkidle2',
      timeout: 0
    });

    await page.evaluate(() => {
      const wordsToRemove = ['tiptopuni', 'github', 'créateur', 'contact', 'about', 'terms', 'conditions', 'privacy'];
      const allElements = document.querySelectorAll('*');
      allElements.forEach(el => {
        const text = (el.innerText || "").toLowerCase();
        if (wordsToRemove.some(word => text.includes(word))) {
          el.remove();
        }
      });
      const footer = document.querySelector('footer');
      if (footer) footer.remove();
    });

    const content = await page.content();
    await browser.close();
    res.send(content);
  } catch (err) {
    console.error('Erreur:', err.message);
    res.status(500).send('Erreur lors du chargement du site.');
  }
});

app.listen(PORT, () => {
  console.log(`Serveur en ligne sur le port ${PORT}`);
});
