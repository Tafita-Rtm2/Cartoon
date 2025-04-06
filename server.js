const express = require('express');
const multer = require('multer');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Token directement dans le code (tu peux le mettre ici si `.env` ne fonctionne pas)
const REPLICATE_API_TOKEN = 'r8_1igH7mGXtaBilChHzgGW2tUqdkU4Ypg2JLrAn';

app.use(cors());
app.use(express.static('public'));

// Configuration du stockage temporaire pour les images
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext);
  }
});
const upload = multer({ storage });

// Ghibli = model anime-style / Toon = model de Toongineer
const models = {
  ghibli: 'fofr/ghibli-diffusion',
  toon: 'tencentarc/cartoon-gan'
};

// API POST : transforme l'image
app.post('/api/transform/:style', upload.single('image'), async (req, res) => {
  const style = req.params.style;
  const model = models[style];

  if (!model) return res.status(400).json({ error: 'Style non supporté' });

  try {
    const imageData = fs.readFileSync(req.file.path, { encoding: 'base64' });
    const input = {
      image: `data:image/jpeg;base64,${imageData}`
    };

    const response = await axios.post(
      `https://api.replicate.com/v1/predictions`,
      {
        version: '', // facultatif, on prend par défaut
        input: input,
        model: model
      },
      {
        headers: {
          Authorization: `Token ${REPLICATE_API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const output = response.data?.output;
    res.json({ output });
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: 'Erreur lors de la transformation' });
  } finally {
    fs.unlink(req.file.path, () => {});
  }
});

app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});
