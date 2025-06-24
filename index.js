// server/index.js
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import bodyParser from 'body-parser';
import path from 'path';

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;
const DATA_PATH = path.join('./data/fifa.json');

// ✅ Page d'accueil
app.get('/', (req, res) => {
  res.send('✅ MUTULA FIFA API EN LIGNE');
});

// ✅ Route pour récupérer les données FIFA
app.get('/fifa', (req, res) => {
  try {
    const data = fs.readFileSync(DATA_PATH, 'utf-8');
    res.json(JSON.parse(data));
  } catch (err) {
    console.error('❌ Erreur lecture fichier:', err.message);
    res.status(500).send('Erreur lecture fifa.json');
  }
});

// ✅ Route pour recevoir les prédictions et les enregistrer
app.post('/upload', (req, res) => {
  try {
    fs.writeFileSync(DATA_PATH, JSON.stringify(req.body, null, 2));
    res.send('✅ Données mises à jour avec succès');
  } catch (err) {
    console.error('❌ Erreur écriture fichier:', err.message);
    res.status(500).send('Erreur écriture');
  }
});

app.listen(PORT, () => {
  console.log(`✅ Serveur démarré sur le port ${PORT}`);
});
