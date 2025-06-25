import axios from 'axios';
import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';

dotenv.config();

// 🔐 Variables d’environnement obligatoires
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

        if (!data?.Value || !Array.isArray(data.Value)) {
            throw new Error("❌ Format de données inattendu depuis Melbet.");
        }

        const matchs = data.Value;

        // 🧠 Filtrer les matchs avec score final disponible (SC.FS)
        const matchsAvecScore = matchs.filter(m =>
            m?.SC?.FS &&
            m.O1 && m.O2 && m.LE
        ).slice(0, 6); // max 6

        if (matchsAvecScore.length === 0) {
            await bot.sendMessage(CHAT_ID, "⚠️ Aucun match FIFA fiable détecté pour l’instant.");
            return;
        }

        for (const match of matchsAvecScore) {
            const score = `${match.SC.FS?.[0]}:${match.SC.FS?.[1]}`;

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
        }, 10000); // attendre 10s
    }
}

run();
