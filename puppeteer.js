const puppeteer = require('puppeteer');

async function capturePage() {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.goto('https://gpt.tiptopuni.com/#/chat', {
    waitUntil: 'networkidle2'
  });

  // Tu peux ici cacher des éléments gênants, par exemple:
  await page.evaluate(() => {
    const footer = document.querySelector('footer');
    if (footer) footer.style.display = 'none';

    const links = document.querySelectorAll('a');
    links.forEach(link => link.style.display = 'none');
  });

  const html = await page.content();
  await browser.close();
  return html;
}

module.exports = { capturePage };
