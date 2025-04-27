const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.goto('https://gpt.tiptopuni.com/#/chat', { waitUntil: 'networkidle2' });

  // Supprimer les footers / liens créateurs
  await page.evaluate(() => {
    const unwantedElements = [
      document.querySelector('footer'),
      ...document.querySelectorAll('a[href*="github.com"]'),
      ...document.querySelectorAll('a[href*="tiptopuni.com"]')
    ];
    unwantedElements.forEach(el => el && el.remove());
  });

  // Modifier titre du site
  await page.evaluate(() => {
    document.title = "Mon GPT-4o Privé";
  });

  // Sauvegarder la page propre
  const content = await page.content();
  fs.writeFileSync(path.join(__dirname, 'public', 'index.html'), content);

  await browser.close();
  console.log('Capture et nettoyage terminés.');
})();

