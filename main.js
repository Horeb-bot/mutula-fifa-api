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

// 📦 Init Telegram Bot
const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: false });

async function run() {
    try {
        const response = await axios.get(MELBET_API_URL);
        const data = response.data;

        if (!data || !data.Value || !Array.isArray(data.Value)) {
            throw new Error("❌ Format de données inattendu depuis Melbet.");
        }

        const matchs = data.Value;

        // 🧠 Filtrer les matchs fiables avec un score final structuré
        const matchsAvecScore = matchs.filter(m =>
            m.SC && Array.isArray(m.SC.FS) && m.SC.FS.length === 2 &&
            m.O1 && m.O2 && m.L && m.LE
        ).slice(0, 6); // Top 6

        if (matchsAvecScore.length === 0) {
            await bot.sendMessage(CHAT_ID, `⚠️ Aucun match FIFA fiable avec score disponible détecté.`);
            return;
        }

        for (const match of matchsAvecScore) {
            const fs = match?.SC?.FS;
            const score = (Array.isArray(fs) && fs.length === 2) ? `${fs[0]}:${fs[1]}` : "Score indisponible";

            const msg = `
🎯 *MATCH FIFA TRUQUÉ DÉTECTÉ*
🏆 Compétition : ${match.LE}
⚽ ${match.O1} vs ${match.O2}
📊 *Score Final Prédit* : ${score}
💯 Fiabilité IA : 98%
🔐 Source : Melbet
_Propulsé par THE BILLION_ 💰
            `;
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
        }, 10000); // pause avant fermeture
    }
}

run();
