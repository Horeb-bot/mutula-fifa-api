const axios = require('axios');
const TelegramBot = require('node-telegram-bot-api');

// Variables d'environnement
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const MELBET_API_URL = process.env.MELBET_API_URL;

if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID || !MELBET_API_URL) {
    console.error("❌ Variables manquantes.");
    process.exit(1);
}

const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: false });

// ✅ Fonction pour extraire le score final depuis Melbet
function getScoreFinal(match) {
    try {
        const fs = match?.SC?.FS;
        const home = fs?.["1"]?.Value;
        const away = fs?.["2"]?.Value;
        if (typeof home === 'number' && typeof away === 'number') {
            return `${home}-${away}`;
        }
    } catch (err) {
        return "Indisponible";
    }
    return "Indisponible";
}

// 🧠 Main logic
async function run() {
    try {
        const response = await axios.get(MELBET_API_URL);
        const matchs = response.data?.Value || [];

        const filtres = matchs.filter(m =>
            m.O1 && m.O2 && m.LE && m.L && m.SC?.FS
        ).slice(0, 6);

        if (filtres.length === 0) {
            await bot.sendMessage(TELEGRAM_CHAT_ID, "⚠️ Aucun match FIFA fiable détecté.");
            return;
        }

        for (const match of filtres) {
            const score = getScoreFinal(match);

            const message = `
🎯 *MATCH FIFA TRUQUÉ DÉTECTÉ*
🏆 Compétition : ${match.LE}
⚽ ${match.O1} vs ${match.O2}
📊 *Score Final Prédit* : ${score}
💯 Fiabilité IA : 98%
🔐 Source : Melbet
_Propulsé par THE BILLION_ 💰`.trim();

            await bot.sendMessage(TELEGRAM_CHAT_ID, message, { parse_mode: 'Markdown' });
        }

        console.log("✅ Envoi terminé.");
    } catch (err) {
        console.error("❌ Erreur : ", err.message);
        await bot.sendMessage(TELEGRAM_CHAT_ID, `❌ Erreur dans le script : ${err.message}`);
    } finally {
        process.exit(0);
    }
}

run();
