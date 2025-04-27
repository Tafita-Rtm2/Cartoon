# Clone propre GPT-4o

Un serveur Node.js Express qui :

- Récupère l'interface de https://gpt.tiptopuni.com avec Puppeteer
- Nettoie le site (enlève tout ce qui est GitHub, Footer, etc.)
- Sert l'interface depuis `public/`
- Proxy les requêtes API /api/ vers le vrai serveur GPT

## Installer

```bash
git clone https://github.com/tonrepo/mon-site-chatgpt
cd mon-site-chatgpt
npm install
