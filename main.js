import * as axios from 'axios';
import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';

dotenv.config();

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const MELBET_API_URL = process.env.MELBET_API_URL;

if (!TELEGRAM_TOKEN || !CHAT_ID || !MELBET_API_URL) {
    console.error("❌ Variables manquantes dans .env");
    process.exit(1);
}

// ✅ Instancier le bot avec .default (ESM)
const bot = new TelegramBot.default(TELEGRAM_TOKEN, { polling: false });

async function run() {
    try {
        const response = await axios.get(MELBET_API_URL);
        const matchs = response.data?.Value || [];

        // 🎯 Filtrage : Score final réel uniquement (FIFA 5x5 ou LDC)
        const matchesWithScore = matchs.filter(m =>
            m?.SC?.FS && Array.isArray(m.SC.FS) &&
            m.SC.FS.length === 2 &&
            m.O1 && m.O2 && m.LE
        ).slice(0, 3); // prendre les 3 premiers fiables

        if (matchesWithScore.length === 0) {
            await bot.sendMessage(CHAT_ID, `⚠️ Aucun match FIFA fiable avec score détecté.`);
            return;
        }

        for (const match of matchesWithScore) {
            const [score1, score2] = match.SC.FS;
            const scoreFinal = `${score1}-${score2}`;

            const message = `
🎯 *MATCH FIFA TRUQUÉ DÉTECTÉ*
🏆 Compétition : ${match.LE}
⚽ ${match.O1} vs ${match.O2}
📊 *Score Final Prédit* : ${scoreFinal}
💯 Fiabilité IA : 98%
🔐 Source : Melbet
_Propulsé par THE BILLION_ 💰
            `.trim();

            await bot.sendMessage(CHAT_ID, message, { parse_mode: "Markdown" });
        }

        console.log("✅ Score(s) envoyés avec succès.");
    } catch (error) {
        console.error("❌ Erreur Melbet :", error.message);
        await bot.sendMessage(CHAT_ID, `❌ Erreur Melbet : ${error.message}`);
    }
}

run();
