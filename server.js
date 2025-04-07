const express = require('express');
const multer = require('multer');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Servir les fichiers statiques du dossier public
app.use(express.static('public'));

// Configuration de multer pour stocker temporairement les images dans "uploads/"
const upload = multer({ dest: 'uploads/' });

// Versions des modèles sur Replicate
const MODELS = {
  animegan: 'tencentarc/animeganv2:6f552bd4ec9137ec7d0f93e2a7df1e7f37233521e4c711c3ed44b24737906c6c',
  toongineer: 'stevenje/toongineer-cartoonizer:fc026f279ed5f127cda07da0cc7e1b54d1b40b216a4e2079952f76f1f3c6b30f'
};

// Ton token Replicate intégré directement ici
const REPLICATE_API_TOKEN = 'r8_1igH7mGXtaBilChHzgGW2tUqdkU4Ypg2JLrAn';

app.post('/transform/:model', upload.single('image'), async (req, res) => {
  const modelType = req.params.model;
  const modelVersion = MODELS[modelType];
  if (!modelVersion) {
    return res.status(400).json({ error: 'Modèle invalide.' });
  }

  const filePath = path.join(__dirname, req.file.path);
  try {
    // Lire l'image et la convertir en base64
    const imageBuffer = fs.readFileSync(filePath);
    const base64Image = imageBuffer.toString('base64');
    const dataUrl = `data:image/jpeg;base64,${base64Image}`;

    // Lancer la prédiction via l'API Replicate
    const predictionResponse = await axios.post(
      'https://api.replicate.com/v1/predictions',
      {
        version: modelVersion,
        input: { image: dataUrl }
      },
      {
        headers: {
          'Authorization': `Token ${REPLICATE_API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const prediction = predictionResponse.data;
    if (!prediction.urls || !prediction.urls.get) {
      return res.status(500).json({ error: 'Erreur lors du lancement de la prédiction.' });
    }

    // Polling jusqu'à ce que la prédiction soit "succeeded"
    const pollUrl = prediction.urls.get;
    let output;
    while (true) {
      const pollResponse = await axios.get(pollUrl, {
        headers: { 'Authorization': `Token ${REPLICATE_API_TOKEN}` }
      });
      const pollData = pollResponse.data;
      if (pollData.status === 'succeeded') {
        output = pollData.output;
        break;
      } else if (pollData.status === 'failed') {
        return res.status(500).json({ error: 'La prédiction a échoué.' });
      }
      // Attendre 1,5 seconde avant de repoller
      await new Promise(resolve => setTimeout(resolve, 1500));
    }

    // Si output est un tableau, prendre le premier élément
    const imageUrl = Array.isArray(output) ? output[0] : output;
    return res.json({ image: imageUrl });
  } catch (err) {
    console.error('Erreur lors de la transformation:', err.response ? err.response.data : err.message);
    return res.status(500).json({ error: 'Erreur lors du traitement de l’image.' });
  } finally {
    // Supprimer le fichier uploadé
    fs.unlink(filePath, err => {
      if (err) console.error('Erreur suppression fichier:', err);
    });
  }
});

app.listen(PORT, () => {
  console.log(`Serveur lancé sur http://localhost:${PORT}`);
});
