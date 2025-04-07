const express = require('express');
const multer = require('multer');
const axios = require('axios');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Créer automatiquement le dossier "uploads/" s'il n'existe pas
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Sert les fichiers statiques depuis "public" et rend le dossier "uploads" accessible publiquement
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// Configuration de multer pour stocker les images dans "uploads/"
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage });

// Les modèles disponibles sur Replicate
const MODELS = {
  animegan: 'tencentarc/animeganv2:6f552bd4ec9137ec7d0f93e2a7df1e7f37233521e4c711c3ed44b24737906c6c',
  toongineer: 'stevenje/toongineer-cartoonizer:fc026f279ed5f127cda07da0cc7e1b54d1b40b216a4e2079952f76f1f3c6b30f'
};

// Ton token Replicate (placé directement ici pour les tests)
const REPLICATE_API_TOKEN = 'r8_1igH7mGXtaBilChHzgGW2tUqdkU4Ypg2JLrAn';

app.post('/transform/:model', upload.single('image'), async (req, res) => {
  const modelType = req.params.model;
  const modelVersion = MODELS[modelType];
  if (!modelVersion) {
    return res.status(400).json({ error: 'Modèle invalide.' });
  }

  // Construit l'URL publique de l'image uploadée
  const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

  try {
    // Lancement de la prédiction via l'API Replicate
    const predictionResponse = await axios.post(
      'https://api.replicate.com/v1/predictions',
      {
        version: modelVersion,
        input: { image: fileUrl }
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
    const pollUrl = prediction.urls.get;
    let output = null;
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
      // Pause de 1,5 seconde avant le prochain polling
      await new Promise(resolve => setTimeout(resolve, 1500));
    }

    // Si output est un tableau, on prend le premier élément
    const imageUrl = Array.isArray(output) ? output[0] : output;
    return res.json({ image: imageUrl });
  } catch (error) {
    console.error('Erreur lors du traitement:', error.response ? error.response.data : error.message);
    return res.status(500).json({ error: 'Erreur lors du traitement de l’image.' });
  }
});

app.listen(PORT, () => {
  console.log(`Serveur lancé sur http://localhost:${PORT}`);
});
