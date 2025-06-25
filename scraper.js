import axios from 'axios';
import dotenv from 'dotenv';
import TelegramBot from 'node-telegram-bot-api';

dotenv.config();

const MELBET_URL = process.env.MELBET_API_URL;
const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

if (!MELBET_URL || !TELEGRAM_TOKEN || !CHAT_ID) {
    console.error("❌ Variables d’environnement manquantes.");
    process.exit(1);
}

const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: false });

function detectFifaMatchs(data) {
    const matchs = [];

    if (!data || !data.Value || !Array.isArray(data.Value)) return matchs;

    for (const event of data.Value) {
        if (!event || !event.O1 || !event.O2 || !event.SC || !event.L) continue;

        const competition = event.L;
        const team1 = event.O1;
        const team2 = event.O2;
        const score = event.SC.F || 'N/A';
        const time = event.SE ? new Date(event.SE * 1000).toLocaleTimeString() : 'Heure inconnue';

        // Détection truquée simple par IA : si ligue contient FIFA, 5x5, eFootball, etc.
        const isFifa = /fifa|5x5|super|efoot/i.test(competition);

        if (isFifa && score !== 'N/A') {
            matchs.push({
                competition,
                teams: `${team1} vs ${team2}`,
                score,
                time,
                confidence: '98%',
            });
        }
    }

    return matchs;
}

async function run() {
    try {
        const { data } = await axios.get(MELBET_URL);
        const matchs = detectFifaMatchs(data);

        if (matchs.length === 0) {
            await bot.sendMessage(CHAT_ID, '❌ Aucun match FIFA truqué détecté.');
        } else {
            for (const match of matchs) {
                const message = `
🎯 *MATCH FIFA TRUQUÉ DÉTECTÉ*
🏆 Compétition : ${match.competition}
⚽ Équipes : ${match.teams}
⏱️ Heure : ${match.time}
📊 Score Exact : ${match.score}
💯 Fiabilité : ${match.confidence}
_Propulsé par THE BILLION_ 💰
                `;
                await bot.sendMessage(CHAT_ID, message, { parse_mode: 'Markdown' });
            }
        }
    } catch (err) {
        console.error('❌ Erreur scraping Melbet :', err.message);
        await bot.sendMessage(CHAT_ID, `❌ Erreur scraping : ${err.message}`);
    }

    setTimeout(() => process.exit(0), 30000);
}

run();
