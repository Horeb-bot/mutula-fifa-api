import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());

app.get('/melbet/fifa', (req, res) => {
    try {
        const rawData = fs.readFileSync(path.join(__dirname, 'data', 'fifa_data.json'));
        const jsonData = JSON.parse(rawData);
        res.json(jsonData);
    } catch (error) {
        res.status(500).json({ error: 'Erreur lors du chargement des données.' });
    }
});

app.get('/', (req, res) => {
    res.send('✅ MUTULA FIFA API - Online.');
});

app.listen(port, () => {
    console.log(`✅ MUTULA FIFA API lancée sur le port ${port}`);
});