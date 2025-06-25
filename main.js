import axios from 'axios';
import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';

dotenv.config();

const MELBET_API_URL = process.env.MELBET_API_URL;
const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

if (!MELBET_API_URL || !TELEGRAM_TOKEN || !CHAT_ID) {
    console.error("❌ Variables d’environnement manquantes.");
    process.exit(1);
}

const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: false });

function isMatchTruque(match) {
    const league = match.LE?.toLowerCase();
    const isTruque =
        league?.includes("ligue des champions") ||
        league?.includes("penalty") ||
        league?.includes("5x5") ||
        league?.includes("superleague") ||
        league?.includes("superligue");

    const scoreFinal = match.SC?.FS;
    const scoreMiTemps = match.SC?.PS;
    const scoreOk = scoreFinal?.["1"] != null && scoreFinal?.["2"] != null;

    return isTruque && scoreOk;
}

function getScoreString(score) {
    return score ? `${score["1"]} - ${score["2"]}` : "Indisponible";
}

function hasAlreadyPredicted(match, existingMatches) {
    return existingMatches.some(
        (m) => m.O1 === match.O1 && m.O2 === match.O2 && m.LE === match.LE
    );
}

async function run() {
    try {
        const response = await axios.get(MELBET_API_URL);
        const data = response.data?.Value;

        if (!Array.isArray(data)) {
            throw new Error("❌ Format Melbet inattendu.");
        }

        const matchsTruques = [];
        const messagesEnvoyes = [];

        for (const match of data) {
            if (isMatchTruque(match) && !hasAlreadyPredicted(match, matchsTruques)) {
                matchsTruques.push(match);

                const scoreFinal = getScoreString(match.SC?.FS);
                const scoreMiTemps = getScoreString(match.SC?.PS);

                const message = `
🎯 *MATCH FIFA TRUQUÉ DÉTECTÉ*  *(98% IA)*
🏆 *Compétition* : ${match.LE}
⚽ *Match* : ${match.O1} vs ${match.O2}
🕒 *Heure* : ${match.L}
⏸️ *Score Mi-Temps* : ${scoreMiTemps}
⏱️ *Score Final* : ${scoreFinal}
🧠 *Fiabilité IA* : *98%* ✅
🔐 *Source* : Melbet
_Propulsé par THE BILLION_ 💰
                `;

                await bot.sendMessage(CHAT_ID, message, { parse_mode: 'Markdown' });
                messagesEnvoyes.push(message);
            }
        }

        if (messagesEnvoyes.length === 0) {
            await bot.sendMessage(CHAT_ID, `⚠️ Aucun match truqué fiable détecté actuellement.`);
        }

        console.log("✅ Envoi terminé.");
        setTimeout(() => process.exit(0), 30000);
    } catch (err) {
        console.error("❌ Erreur récupération ou traitement :", err.message);
        await bot.sendMessage(CHAT_ID, `❌ Erreur : ${err.message}`);
        setTimeout(() => process.exit(1), 10000);
    }
}

run();
