import { Actor } from 'apify';
import axios from 'axios';
import cheerio from 'cheerio';
import TelegramBot from 'node-telegram-bot-api';

await Actor.init();

// Récupération des secrets
const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

if (!TELEGRAM_TOKEN || !CHAT_ID) {
    throw new Error("❌ Token ou Chat ID Telegram manquant.");
}

const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: false });

// URL Melbet des matchs FIFA truqués (à adapter si nécessaire)
const MELBET_URL = 'https://melbet.com/fr/live/EsportFIFA';

// Fonction de scraping
async function scrapeFifaTruque() {
    try {
        const { data: html } = await axios.get(MELBET_URL, {
            headers: {
                'User-Agent': 'Mozilla/5.0',
            }
        });

        const $ = cheerio.load(html);
        const matchs = [];

        $('div[class*=live__event]').each((_, el) => {
            const teams = $(el).find('.live__name').text().trim().replace(/\s{2,}/g, ' ');
            const score = $(el).find('.live__score').text().trim();
            const time = $(el).find('.live__time').text().trim();
            const competition = $(el).find('.live__category').text().trim();

            if (teams && score) {
                matchs.push({ competition, teams, score, time });
            }
        });

        return matchs;
    } catch (err) {
        throw new Error(`❌ Erreur scraping Melbet : ${err.message}`);
    }
}

try {
    const matchs = await scrapeFifaTruque();

    if (!matchs || matchs.length === 0) {
        await bot.sendMessage(CHAT_ID, `❌ Aucun match FIFA détecté sur Melbet.`);
    } else {
        for (const match of matchs) {
            const msg = `
🎯 *MATCH FIFA TRUQUÉ DÉTECTÉ*
🏆 Compétition : ${match.competition}
⚽ Équipes : ${match.teams}
⏱️ Heure : ${match.time}
📊 Score Exact : ${match.score}
_Propulsé par THE BILLION_ 💰
            `;
            await bot.sendMessage(CHAT_ID, msg, { parse_mode: 'Markdown' });
        }
    }
} catch (error) {
    console.error("❌ Erreur : ", error.message);
    await bot.sendMessage(CHAT_ID, `❌ Erreur Melbet : ${error.message}`);
}

await Actor.exit();
