import express from 'express';
import axios from 'axios';
import cheerio from 'cheerio';
import cors from 'cors';

const app = express();
app.use(cors());

app.get('/', (req, res) => {
  res.send('✅ MUTULA FIFA API EN LIGNE');
});

// 🎯 Route principale pour les scores truqués
app.get('/fifa', async (req, res) => {
  try {
    const url = 'https://melbet.com/fr/live/FIFA'; // à adapter si tu utilises une autre page
    const { data: html } = await axios.get(url);
    const $ = cheerio.load(html);

    const matchs = [];

    $('.c-events__item').each((_, el) => {
      const competition = $(el).find('.c-events__liga').text().trim();
      const teams = $(el).find('.c-events__teams').text().trim().replace(/\s{2,}/g, ' vs ');
      const score = $(el).find('.c-events-scoreboard__table').text().trim();
      const time = $(el).find('.c-events__time').text().trim();

      if (competition && teams && score) {
        matchs.push({
          competition,
          teams,
          time,
          score,
          confidence: "98%" // fixe car truqué
        });
      }
    });

    res.json({ matchs });
  } catch (err) {
    console.error('❌ Erreur scraping Melbet :', err.message);
    res.status(500).json({ error: 'Erreur scraping Melbet', details: err.message });
  }
});

// Port Render ou local
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Serveur lancé sur le port ${PORT}`);
});
