import axios from 'axios';
import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';

dotenv.config();

// ✅ Variables d’environnement
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
        const data = response.data;

        if (!data || !data.Value || !Array.isArray(data.Value)) {
            throw new Error("❌ Format de données inattendu depuis Melbet.");
        }

        const matchs = data.Value;

        // 🧠 Filtrage des matchs truqués valides
        const truqués = matchs.filter(m =>
            m.SC && m.SC.FS && m.O1 && m.O2 && m.L && m.LE &&
            m.SC.FS["1"] !== undefined && m.SC.FS["2"] !== undefined
        ).slice(0, 6); // les 6 premiers fiables

        if (truqués.length === 0) {
            await bot.sendMessage(CHAT_ID, `⚠️ Aucun match FIFA fiable détecté.`);
            return;
        }

        for (const match of truqués) {
            const equipe1 = match.O1;
            const equipe2 = match.O2;
            const miTemps1 = match.SC.S1?.["1"] ?? "-";
            const miTemps2 = match.SC.S1?.["2"] ?? "-";
            const final1 = match.SC.FS?.["1"] ?? "-";
            const final2 = match.SC.FS?.["2"] ?? "-";

            const msg = `
🎯 *MATCH FIFA TRUQUÉ DÉTECTÉ*
🏆 Compétition : ${match.LE}
⚽ ${equipe1} vs ${equipe2}
🕒 Heure : ${match.L}

⏱️ Score Mi-temps : ${miTemps1} : ${miTemps2}
📊 Score Final : ${final1} : ${final2}
🔐 Source : Melbet

_Propulsé par THE BILLION_ 💰
            `.trim();

            await bot.sendMessage(CHAT_ID, msg, { parse_mode: 'Markdown' });
        }

        console.log("✅ Prédictions FIFA envoyées.");
    } catch (error) {
        console.error("❌ Erreur :", error.message);
        await bot.sendMessage(CHAT_ID, `❌ Erreur FIFA : ${error.message}`);
    } finally {
        setTimeout(() => {
            console.log("⏹️ Process terminé proprement.");
            process.exit(0);
        }, 10000); // évite boucle infinie
    }
}

run();
