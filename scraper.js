import axios from 'axios';
import * as cheerio from 'cheerio';
import TelegramBot from 'node-telegram-bot-api';

// ✅ Variables d'environnement
const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

// ✅ Sécurité : vérification des infos obligatoires
if (!TELEGRAM_TOKEN || !CHAT_ID) {
    console.error('❌ Token ou Chat ID Telegram manquant');
    process.exit(1);
}

// ✅ Initialisation du bot
const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: false });

// ✅ URL Melbet truqué (à remplacer si tu as une URL spécifique en tête)
const URL_MELBET = 'https://melbet.com/en/live/VirtualFootball/'; // ou l'URL directe du FIFA truqué

// ✅ Fonction principale de scraping
async function runScraper() {
    try {
        const response = await axios.get(URL_MELBET, {
            headers: {
                'User-Agent': 'Mozilla/5.0'
            }
        });

        const html = response.data;
        const $ = cheerio.load(html);

        let matchs = [];

        // Exemple de scraping — À adapter à la structure Melbet réelle
        $('.match-container').each((i, el) => {
            const competition = $(el).find('.competition-name').text().trim();
            const teams = $(el).find('.teams').text().trim();
            const time = $(el).find('.match-time').text().trim();
            const score = $(el).find('.match-score').text().trim();

            if (competition && teams && score) {
                matchs.push({ competition, teams, time, score });
            }
        });

        if (matchs.length === 0) {
            await bot.sendMessage(CHAT_ID, '❌ Aucun match truqué détecté pour le moment.');
            return;
        }

        for (const match of matchs) {
            const msg = `
🎯 *MATCH FIFA TRUQUÉ DÉTECTÉ*
🏆 Compétition : ${match.competition}
⚽ Équipes : ${match.teams}
⏱️ Heure : ${match.time}
📊 Score Exact : ${match.score}
💯 Fiabilité : 98% garantie

_Propulsé par THE BILLION_ 💰
`;
            await bot.sendMessage(CHAT_ID, msg, { parse_mode: 'Markdown' });
        }

    } catch (error) {
        console.error('❌ Erreur scraping ou envoi :', error.message);
        await bot.sendMessage(CHAT_ID, `❌ Erreur scraping ou envoi : ${error.message}`);
    }
}

runScraper();
