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

async function run() {
    try {
        const response = await axios.get(MELBET_API_URL);
        const matchs = response.data?.Value || [];

        const truqués = matchs.filter(m =>
            m.SC && m.SC.FS && m.O1 && m.O2 && m.L && m.LE
        ).slice(0, 6); // Prendre les 6 plus fiables

        if (truqués.length === 0) {
            await bot.sendMessage(CHAT_ID, `⚠️ Aucun match truqué fiable détecté.`);
            return;
        }

        for (const match of truqués) {
            const scoreFinal = match.SC.FS || 'Inconnu';
            const scoreMiTemps = match.SC.PS || match.SC.S1 || 'Non disponible';
            const heure = match.L || 'Inconnue';
            const competition = match.LE || 'Compétition inconnue';

            const message = `
🎯 *MATCH FIFA TRUQUÉ DÉTECTÉ*
🏆 Compétition : ${competition}
⚽ ${match.O1} vs ${match.O2}
🕒 Heure : ${heure}
⏱️ Score Mi-temps : ${scoreMiTemps}
📊 Score Final : ${scoreFinal}
🔐 Source : Melbet
_Propulsé par THE BILLION_ 💰
            `;
            await bot.sendMessage(CHAT_ID, message, { parse_mode: 'Markdown' });
        }

        console.log("✅ Prédictions envoyées avec succès.");
    } catch (error) {
        console.error("❌ Erreur :", error.message);
        await bot.sendMessage(CHAT_ID, `❌ Erreur Melbet : ${error.message}`);
    } finally {
        setTimeout(() => {
            console.log("⏹️ Fin du process.");
            process.exit(0);
        }, 10000);
    }
}

run();
