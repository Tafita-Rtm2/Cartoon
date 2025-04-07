const express = require('express');
const multer = require('multer');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Servir les fichiers statiques depuis le dossier "public"
app.use(express.static('public'));

// Configuration de multer pour le stockage temporaire des images
const upload = multer({ dest: 'uploads/' });

// Les versions de modèles sur Replicate
// Ici on propose 2 modèles : AnimeGANv2 et Toongineer Cartoonizer
const MODELS = {
  animegan: 'tencentarc/animeganv2:6f552bd4ec9137ec7d0f93e2a7df1e7f37233521e4c711c3ed44b24737906c6c',
  toongineer: 'stevenje/toongineer-cartoonizer:fc026f279ed5f127cda07da0cc7e1b54d1b40b216a4e2079952f76f1f3c6b30f'
};

// Ton token Replicate (placé directement ici)
const REPLICATE_API_TOKEN = 'r8_1igH7mGXtaBilChHzgGW2tUqdkU4Ypg2JLrAn';

app.post('/transform/:model', upload.single('image'), async (req, res) => {
  const modelType = req.params.model;
  const modelVersion = MODELS[modelType];

  if (!modelVersion) {
    return res.status(400).json({ error: 'Modèle invalide.' });
  }

  try {
    // Lire le fichier uploadé et le convertir en base64
    const filePath = path.join(__dirname, req.file.path);
    const imageData = fs.readFileSync(filePath);
    const imageBase64 = imageData.toString('base64');
    const imageDataUrl = `data:image/jpeg;base64,${imageBase64}`;

    // Démarrer la prédiction sur Replicate
    const predictionResponse = await axios.post(
      'https://api.replicate.com/v1/predictions',
      {
        version: modelVersion,
        input: { image: imageDataUrl }
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

    // Polling jusqu'à ce que le statut soit "succeeded"
    let output;
    const pollUrl = prediction.urls.get;
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
      // Pause de 1,5 seconde avant de re-vérifier
      await new Promise(resolve => setTimeout(resolve, 1500));
    }

    // Renvoi de l'image transformée
    res.json({ image: output });
    fs.unlinkSync(filePath); // Supprime le fichier temporaire
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: 'Erreur lors du traitement de l’image.' });
  }
});

app.listen(PORT, () => console.log(`Serveur démarré sur http://localhost:${PORT}`));
