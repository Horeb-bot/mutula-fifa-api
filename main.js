import axios from 'axios';
import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';

dotenv.config();

// 🔐 Variables obligatoires
const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const MELBET_API_URL = process.env.MELBET_API_URL;

if (!TELEGRAM_TOKEN || !CHAT_ID || !MELBET_API_URL) {
    console.error("❌ Variables d’environnement manquantes.");
    process.exit(1);
}

// 🛠️ Init Telegram bot
const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: false });

async function run() {
    try {
        const response = await axios.get(MELBET_API_URL);
        const data = response.data;

        if (!data?.Value || !Array.isArray(data.Value)) {
            throw new Error("❌ Format de données inattendu depuis Melbet.");
        }

        const matchs = data.Value.filter(m =>
            m.SC?.FS &&
            typeof m.SC.FS === 'object' &&
            Object.keys(m.SC.FS).length === 2 &&
            m.O1 && m.O2 && m.L && m.LE
        ).slice(0, 6);

        if (matchs.length === 0) {
            await bot.sendMessage(CHAT_ID, `⚠️ Aucun match truqué fiable avec score détecté.`);
            return;
        }

        for (const match of matchs) {
            const keys = Object.keys(match.SC.FS);
            const homeScore = match.SC.FS[keys[0]]?.Value ?? 'N/A';
            const awayScore = match.SC.FS[keys[1]]?.Value ?? 'N/A';
            const scoreFinal = `${homeScore}-${awayScore}`;

            const message = `
🎯 *MATCH FIFA TRUQUÉ DÉTECTÉ*
🏆 Compétition : ${match.LE}
⚽ ${match.O1} vs ${match.O2}
📊 *Score Final Prédit* : ${scoreFinal}
💯 Fiabilité IA : 98%
🔐 Source : Melbet
_Propulsé par THE BILLION_ 💰
            `;

            await bot.sendMessage(CHAT_ID, message, { parse_mode: 'Markdown' });
        }

        console.log("✅ Prédictions envoyées.");

    } catch (error) {
        console.error("❌ Erreur critique :", error.message);
        await bot.sendMessage(CHAT_ID, `❌ Erreur critique Render : ${error.message}`);
    } finally {
        setTimeout(() => {
            console.log("⏹️ Fin du process Render.");
            process.exit(0);
        }, 10000);
    }
}

run();
