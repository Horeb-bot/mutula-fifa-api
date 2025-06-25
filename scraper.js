import axios from 'axios';
import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';

dotenv.config();

// 1️⃣ Configuration des variables d'environnement
const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const API_URL = process.env.MUTULA_API_URL || 'https://mutula-fifa-api.onrender.com/fifa'; // à personnaliser si besoin

if (!TELEGRAM_TOKEN || !CHAT_ID) {
    console.error("❌ Le token Telegram ou le chat ID est manquant.");
    process.exit(1);
}

const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: false });

// 2️⃣ Fonction principale
async function run() {
    try {
        const response = await axios.get(API_URL);
        const matchs = response.data?.matchs;

        if (!matchs || !Array.isArray(matchs)) {
            throw new Error("❌ Format inattendu ou matchs indisponibles.");
        }

        if (matchs.length === 0) {
            await bot.sendMessage(CHAT_ID, `❌ Aucun match truqué détecté pour l'instant.`);
        } else {
            for (const match of matchs) {
                const message = `
🎯 *MATCH FIFA TRUQUÉ DÉTECTÉ*
🏆 Compétition : ${match.competition}
⚽ Équipes : ${match.teams}
⏱️ Heure : ${match.time}
📊 Score Exact : ${match.score}
💯 Fiabilité : ${match.confidence || 'Non spécifiée'}
_Propulsé par THE BILLION_ 💰
                `;
                await bot.sendMessage(CHAT_ID, message, { parse_mode: 'Markdown' });
            }
        }
    } catch (error) {
        console.error("❌ Erreur lors de la récupération ou de l'envoi :", error.message);
        await bot.sendMessage(CHAT_ID, `❌ Erreur : ${error.message}`);
    }

    console.log("✅ Scraping terminé. On attend 30 sec avant fermeture...");

    setTimeout(() => {
        console.log("⏹️ Fin du process proprement.");
        process.exit(0); // Clôture propre
    }, 30000); // Attente 30 secondes pour éviter le redémarrage immédiat
}

run();
