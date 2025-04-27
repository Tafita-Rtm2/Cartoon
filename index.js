const express = require('express');
const puppeteer = require('puppeteer');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', async (req, res) => {
  try {
    const browser = await puppeteer.launch({
      headless: "new",
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.goto('https://gpt.tiptopuni.com/#/chat', {
      waitUntil: 'networkidle2',
      timeout: 0
    });

    // Ici : Suppression automatique des textes et éléments gênants
    await page.evaluate(() => {
      // Supprimer tous les éléments contenant certains mots
      const wordsToRemove = ['tiptopuni', 'github', 'créateur', 'contact', 'about', 'terms', 'conditions', 'privacy'];
      const allElements = document.querySelectorAll('*');

      allElements.forEach(el => {
        const text = (el.innerText || "").toLowerCase();
        if (wordsToRemove.some(word => text.includes(word))) {
          el.remove();
        }
      });

      // Supprimer le footer (s'il existe)
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
