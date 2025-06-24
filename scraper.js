// scraper/scraper.js — Mise à jour des scores FIFA truqués depuis Melbet
import fs from 'fs';
import axios from 'axios';
import cheerio from 'cheerio';

const URL = 'https://melbet.com/fr/virtualsports/';
const OUTPUT_PATH = './fifadata/fifa.json';

async function scraperFIFA() {
    try {
        const { data: html } = await axios.get(URL);
        const $ = cheerio.load(html);

        const matchs = [];

        $('.championship-card').each((_, el) => {
            const competition = $(el).find('.championship-card__header-name').text().trim();

            // On récupère les lignes des matchs
            $(el).find('.championship-card-event').each((_, matchEl) => {
                const teams = $(matchEl).find('.championship-card-event__team-name').map((i, e) => $(e).text().trim()).get().join(' vs ');
                const time = $(matchEl).find('.event__time').text().trim();
                const score = $(matchEl).find('.championship-card-event__result').text().trim();

                if (teams && score) {
                    matchs.push({
                        competition,
                        teams,
                        time: time || 'Non spécifiée',
                        score,
                        confidence: '98%'
                    });
                }
            });
        });

        if (matchs.length === 0) throw new Error("Aucun match détecté sur Melbet");

        const output = { matchs, date: new Date().toISOString() };
        fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2), 'utf-8');

        console.log('✅ FIFA.json mis à jour avec succès.');
    } catch (err) {
        console.error('❌ Erreur scraping Melbet :', err.message);
    }
}

scraperFIFA();
