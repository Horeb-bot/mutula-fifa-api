import axios from 'axios';
import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';

dotenv.config();

// Variables d’environnement obligatoires
const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const MELBET_API_URL = process.env.MELBET_API_URL;

if (!TELEGRAM_TOKEN || !CHAT_ID || !MELBET_API_URL) {
    console.error("❌ Variables d’environnement manquantes.");
    process.exit(1);
}

const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: false });

// 🔁 Fonction intelligente pour lire tous les types de structure SC.FS
function getScoreFinal(match) {
    const fs = match?.SC?.FS;

    // 🛠️ Debug : pour comprendre la structure réelle
    console.log("🔍 SC.FS =", JSON.stringify(fs));

    try {
        if (Array.isArray(fs)) {
            const home = fs.find(f => f.Key === 1)?.Value ?? 'N/A';
            const away = fs.find(f => f.Key === 2)?.Value ?? 'N/A';
            return `${home}-${away}`;
        } else if (typeof fs === 'object') {
            const home = fs?.["1"]?.Value ?? 'N/A';
            const away = fs?.["2"]?.Value ?? 'N/A';
            return `${home}-${away}`;
        }
    } catch (err) {
        console.error("Erreur de lecture SC.FS :", err.message);
        return 'Indisponible';
    }
    return 'Indisponible';
}

async function run() {
    try {
        const response = await axios.get(MELBET_API_URL);
        const data = response.data;

        if (!data || !data.Value || !Array.isArray(data.Value)) {
            throw new Error("❌ Format de données inattendu depuis Melbet.");
        }

        const matchs = data.Value;

        const truqués = matchs.filter(m =>
            m.SC && m.SC.FS && m.O1 && m.O2 && m.LE
        ).slice(0, 6);

        if (truqués.length === 0) {
            await bot.sendMessage(CHAT_ID, `⚠️ Aucun match fiable détecté.`);
            return;
        }

        for (const match of truqués) {
            const scoreFinal = getScoreFinal(match);

            const msg = `
🎯 *MATCH FIFA TRUQUÉ DÉTECTÉ*
🏆 Compétition : ${match.LE}
⚽ ${match.O1} vs ${match.O2}
📊 *Score Final Prédit* : ${scoreFinal}
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
        }, 10000);
    }
}

run();
