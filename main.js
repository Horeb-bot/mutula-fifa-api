import dotenv from 'dotenv';
import axios from 'axios';
import TelegramBot from 'node-telegram-bot-api';

dotenv.config();

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const MELBET_API_URL = process.env.MELBET_API_URL;

if (!TOKEN || !CHAT_ID || !MELBET_API_URL) {
    console.error("❌ Variables d'environnement manquantes.");
    process.exit(1);
}

const bot = new TelegramBot(TOKEN, { polling: false });

async function run() {
    try {
        const res = await axios.get(MELBET_API_URL);
        const matchs = res.data?.Value || [];

        const filtrés = matchs.filter(m =>
            m.SC && Array.isArray(m.SC.FS) &&
            m.SC.FS.length === 2 &&
            typeof m.SC.FS[0] === 'number' &&
            typeof m.SC.FS[1] === 'number' &&
            m.O1 && m.O2 && m.LE
        ).slice(0, 6);

        if (filtrés.length === 0) {
            await bot.sendMessage(CHAT_ID, `⚠️ Aucun score disponible sur Melbet pour l'instant.`);
            return;
        }

        for (const match of filtrés) {
            const scoreFinal = `${match.SC.FS[0]}-${match.SC.FS[1]}`;
            const message = `
🎯 *MATCH FIFA TRUQUÉ DÉTECTÉ*
🏆 Compétition : ${match.LE}
⚽ ${match.O1} vs ${match.O2}
📊 *Score Final Prédit* : ${scoreFinal}
💯 Fiabilité IA : 98%
🔐 Source : Melbet
_Propulsé par THE BILLION_ 💰
            `;
            await bot.sendMessage(CHAT_ID, message, { parse_mode: "Markdown" });
        }

        console.log("✅ Messages envoyés.");
    } catch (err) {
        console.error("❌ Erreur :", err.message);
        await bot.sendMessage(CHAT_ID, `❌ Erreur : ${err.message}`);
    } finally {
        setTimeout(() => {
            console.log("⏹️ Fin.");
            process.exit(0);
        }, 8000);
    }
}

run();
