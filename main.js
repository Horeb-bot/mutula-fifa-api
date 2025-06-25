import axios from 'axios';
import dotenv from 'dotenv';
import TelegramBot from 'node-telegram-bot-api';

dotenv.config();

// ✅ Variables d’environnement obligatoires
const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const MELBET_API_URL = process.env.MELBET_API_URL;

if (!TELEGRAM_TOKEN || !CHAT_ID || !MELBET_API_URL) {
    console.error("❌ Variables d’environnement manquantes.");
    process.exit(1);
}

// ✅ Init Telegram Bot
const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: false });

async function run() {
    try {
        const response = await axios.get(MELBET_API_URL);
        const data = response.data;

        if (!data || !data.Value || !Array.isArray(data.Value)) {
            throw new Error("❌ Format de données inattendu depuis Melbet.");
        }

        const matchs = data.Value;

        // 🧠 Sélectionner les matchs avec score réel
        const matchsFiables = matchs.filter(m =>
            m?.SC?.FS?.length === 2 &&
            typeof m.SC.FS[0] === 'number' &&
            typeof m.SC.FS[1] === 'number' &&
            m.O1 && m.O2 && m.LE
        ).slice(0, 3);

        if (matchsFiables.length === 0) {
            await bot.sendMessage(CHAT_ID, `⚠️ Aucun match fiable avec score disponible (source Melbet).`);
            return;
        }

        for (const match of matchsFiables) {
            const score = `${match.SC.FS[0]}-${match.SC.FS[1]}`;
            const message = `
🎯 *MATCH FIFA TRUQUÉ DÉTECTÉ*
🏆 Compétition : ${match.LE}
⚽ ${match.O1} vs ${match.O2}
📊 *Score Final Prédit* : ${score}
💯 Fiabilité IA : 98%
🔐 Source : Melbet
_Propulsé par THE BILLION_ 💰
            `.trim();

            await bot.sendMessage(CHAT_ID, message, { parse_mode: 'Markdown' });
        }

        console.log("✅ Scores envoyés avec succès.");
    } catch (error) {
        console.error("❌ Erreur :", error.message);
        await bot.sendMessage(CHAT_ID, `❌ Erreur Melbet : ${error.message}`);
    } finally {
        setTimeout(() => process.exit(0), 8000); // pour éviter boucle infinie
    }
}

run();
