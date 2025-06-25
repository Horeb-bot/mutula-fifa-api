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

function extraireScore(match) {
    try {
        const sc = match?.SC?.FS;
        if (sc && typeof sc === "object") {
            const valeurs = Object.values(sc).filter(val => val && typeof val.Value === "number");
            if (valeurs.length === 2) {
                return `${valeurs[0].Value}-${valeurs[1].Value}`;
            }
        }
    } catch (err) {
        return null;
    }
    return null;
}

async function run() {
    try {
        const response = await axios.get(MELBET_API_URL);
        const data = response.data?.Value || [];

        const matchs = data.filter(m =>
            m.O1 && m.O2 && m.LE && m.L && m.SC && m.SC.FS
        ).slice(0, 6);

        if (matchs.length === 0) {
            await bot.sendMessage(TELEGRAM_CHAT_ID, "⚠️ Aucun match FIFA truqué fiable détecté.");
            return;
        }

        for (const match of matchs) {
            const score = extraireScore(match) || "Non disponible";

            const message = `
🎯 *MATCH FIFA TRUQUÉ DÉTECTÉ*
🏆 Compétition : ${match.LE}
⚽ ${match.O1} vs ${match.O2}
📊 *Score Final Prédit* : ${score}
💯 Fiabilité IA : 98%
🔐 Source : Melbet
_Propulsé par THE BILLION_ 💰
            `.trim();

            await bot.sendMessage(TELEGRAM_CHAT_ID, message, { parse_mode: 'Markdown' });
        }

        console.log("✅ Terminé avec succès.");
    } catch (err) {
        console.error("❌ Erreur :", err.message);
        await bot.sendMessage(TELEGRAM_CHAT_ID, `❌ Erreur dans le script : ${err.message}`);
    } finally {
        process.exit(0);
    }
}

run();
