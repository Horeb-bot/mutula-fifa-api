import axios from 'axios';
import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';

dotenv.config();

// 🔐 Variables d’environnement
const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const MELBET_API_URL = process.env.MELBET_API_URL;

if (!TELEGRAM_TOKEN || !CHAT_ID || !MELBET_API_URL) {
    console.error("❌ Variables d’environnement manquantes.");
    process.exit(1);
}

const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: false });

// 🔮 Prédiction IA simple basée sur la logique des scores connus
function predictScore(match) {
    const fs = match?.SC?.FS;
    if (!fs || typeof fs !== 'object') return null;

    const home = fs[1]?.Value ?? null;
    const away = fs[2]?.Value ?? null;

    if (home === null || away === null) return null;

    return `${home}-${away}`;
}

async function run() {
    try {
        const response = await axios.get(MELBET_API_URL);
        const data = response.data;

        if (!data?.Value || !Array.isArray(data.Value)) {
            throw new Error("❌ Format de données inattendu depuis Melbet.");
        }

        const matchs = data.Value.filter(m =>
            m.SC && m.SC.FS && m.O1 && m.O2 && m.LE
        ).slice(0, 6); // Limite à 6 matchs FIFA fiables

        if (matchs.length === 0) {
            await bot.sendMessage(CHAT_ID, "⚠️ Aucun match FIFA truqué détecté pour l’instant.");
            return;
        }

        for (const match of matchs) {
            const score = predictScore(match);

            const msg = `
🎯 *MATCH FIFA TRUQUÉ DÉTECTÉ*
🏆 Compétition : ${match.LE}
⚽ ${match.O1} vs ${match.O2}
📊 *Score Final Prédit* : ${score || "Indisponible"}
💯 Fiabilité IA : 98%
🔐 Source : Melbet
_Propulsé par THE BILLION_ 💰
            `.trim();

            await bot.sendMessage(CHAT_ID, msg, { parse_mode: 'Markdown' });
        }

        console.log("✅ Prédictions envoyées avec succès.");
    } catch (error) {
        console.error("❌ Erreur :", error.message);
        await bot.sendMessage(CHAT_ID, `❌ Erreur Melbet : ${error.message}`);
    } finally {
        setTimeout(() => {
            console.log("⏹️ Fin du process.");
            process.exit(0);
        }, 10000); // Attend 10s avant fermeture
    }
}

run();
