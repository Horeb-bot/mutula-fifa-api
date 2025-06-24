import axios from 'axios';
import cheerio from 'cheerio';
import fs from 'fs';

// URL cible Melbet (à ajuster si besoin)
const URL = 'https://melbet.com/fr/live/FIFA';

// Fonction principale
async function scrapeFifaMelbet() {
  try {
    const { data: html } = await axios.get(URL);
    const $ = cheerio.load(html);

    const matchs = [];

    $('div.c-events__item_game').each((i, el) => {
      const teams = $(el).find('.c-events__teams').text().trim().replace(/\s+/g, ' ');
      const time = $(el).find('.c-events__time').text().trim();
      const score = $(el).find('.c-events__score').text().trim();
      const competition = $(el).find('.c-events__liga').text().trim();

      if (teams && score) {
        matchs.push({
          teams,
          score,
          time,
          competition,
          confidence: '98%'
        });
      }
    });

    fs.writeFileSync('fifa.json', JSON.stringify({ matchs }, null, 2), 'utf-8');
    console.log('✅ Données FIFA sauvegardées avec succès dans fifa.json');
  } catch (err) {
    console.error('❌ Erreur de scraping FIFA:', err.message);
  }
}

scrapeFifaMelbet();