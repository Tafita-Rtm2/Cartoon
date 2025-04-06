const express = require('express');
const multer = require('multer');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.static('public'));

const upload = multer({ dest: 'uploads/' });

const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
const replicateHeaders = {
  Authorization: `Token ${REPLICATE_API_TOKEN}`,
  'Content-Type': 'application/json',
};

const MODELS = {
  animegan: 'tencentarc/animeganv2:6f552bd4ec9137ec7d0f93e2a7df1e7f37233521e4c711c3ed44b24737906c6c',
  toongineer: 'stevenje/toongineer-cartoonizer:fc026f279ed5f127cda07da0cc7e1b54d1b40b216a4e2079952f76f1f3c6b30f',
};

app.post('/transform/:model', upload.single('image'), async (req, res) => {
  const model = req.params.model;
  const modelVersion = MODELS[model];
  if (!modelVersion) return res.status(400).send('Modèle invalide.');

  const filePath = path.join(__dirname, req.file.path);
  const image = fs.readFileSync(filePath);
  const imageBase64 = image.toString('base64');
  const imageUrl = `data:image/jpeg;base64,${imageBase64}`;

  try {
    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: replicateHeaders,
      body: JSON.stringify({
        version: modelVersion,
        input: { image: imageUrl },
      }),
    });

    const prediction = await response.json();
    if (prediction?.urls?.get) {
      let output;
      while (!output) {
        const poll = await fetch(prediction.urls.get, { headers: replicateHeaders });
        const result = await poll.json();
        if (result.status === 'succeeded') {
          output = result.output;
        } else if (result.status === 'failed') {
          throw new Error('Erreur traitement IA');
        } else {
          await new Promise(r => setTimeout(r, 1500));
        }
      }

      res.json({ image: output });
    } else {
      res.status(500).send('Erreur lors du démarrage de la prédiction');
    }
  } catch (e) {
    console.error(e);
    res.status(500).send('Erreur de traitement');
  } finally {
    fs.unlinkSync(filePath);
  }
});

app.listen(PORT, () => console.log(`Serveur sur http://localhost:${PORT}`));
