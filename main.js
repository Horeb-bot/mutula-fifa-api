const axios = require('axios');
const TelegramBot = require('node-telegram-bot-api');

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const MELBET_API_URL = process.env.MELBET_API_URL;

if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID || !MELBET_API_URL) {
    console.error("❌ Variables d’environnement manquantes.");
    process.exit(1);
}

const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: false });

async function run() {
    try {
        const res = await axios.get(MELBET_API_URL);
        const matchs = res.data?.Value ?? [];

        const filtrés = matchs.filter(m =>
            m.SC?.FS &&
            typeof m.SC.FS === 'object' &&
            Object.values(m.SC.FS).every(s => typeof s?.Value === 'number') &&
            m.O1 && m.O2 && m.L && m.LE
        ).slice(0, 6);

        if (filtrés.length === 0) {
            await bot.sendMessage(TELEGRAM_CHAT_ID, "⚠️ Aucun match truqué fiable détecté.");
            return;
        }

        for (const match of filtrés) {
            const [fs1, fs2] = Object.values(match.SC.FS);
            const scoreFinal = `${fs1?.Value ?? 'N/A'} - ${fs2?.Value ?? 'N/A'}`;

            const msg = `
🎯 *MATCH FIFA TRUQUÉ DÉTECTÉ*
🏆 Compétition : ${match.LE}
⚽ ${match.O1} vs ${match.O2}
📊 *Score Final Prédit* : ${scoreFinal}
💯 Fiabilité IA : 98%
🔐 Source : Melbet
_Propulsé par THE BILLION_ 💰
            `.trim();

            await bot.sendMessage(TELEGRAM_CHAT_ID, msg, { parse_mode: "Markdown" });
        }

        console.log("✅ Prédictions envoyées avec succès.");

    } catch (err) {
        console.error("❌ Erreur :", err.message);
        await bot.sendMessage(TELEGRAM_CHAT_ID, `❌ Erreur critique : ${err.message}`);
    } finally {
        process.exit(0); // ✅ Pour éviter toute boucle
    }
}

run();
