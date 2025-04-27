const express = require('express');
const chrome = require('chrome-aws-lambda');
const puppeteer = require('puppeteer-core');

const app = express();
const PORT = process.env.PORT || 3000;

async function getPageContent(url) {
  const browser = await puppeteer.launch({
    args: chrome.args,
    defaultViewport: chrome.defaultViewport,
    executablePath: await chrome.executablePath,
    headless: chrome.headless,
    ignoreHTTPSErrors: true,
  });

  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle2' });

  const content = await page.content();
  await browser.close();
  return content;
}

app.get('*', async (req, res) => {
  try {
    const content = await getPageContent('https://gpt.tiptopuni.com/#/chat');
    res.send(content);
  } catch (err) {
    console.error(err);
    res.status(500).send('Erreur lors du chargement du site.');
  }
});

app.listen(PORT, () => {
  console.log(`Serveur lancé sur le port ${PORT}`);
});
