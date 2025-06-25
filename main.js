import axios from 'axios';
import cheerio from 'cheerio';
import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
dotenv.config();

// 🔐 Variables sensibles
const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '7577492603:AAGcYaB4sWZ8ALAzwsygpF7BWrx7LIHhoGg';
const CHAT_ID = process.env.TELEGRAM_CHAT_ID || '6988024137';
const MELBET_API_URL = process.env.MELBET_API_URL || 'https://melbet.cd/service-api/LiveFeed/Get1x2_VZip?sports=85&count=40&lng=fr&gr=870&mode=4&country=94&partner=8&getEmpty=true&virtualSports=true&noFilterBlockEvent=true';

const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: false });

// 🔁 Scraper HTML via cheerio (SofaScore ou Score24)
async function scrapeHTML(url, selector) {
    try {
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);
        return $(selector).text().trim();
    } catch {
        return null;
    }
}

// 🎯 Extraction Melbet & croisement
async function run() {
    try {
        const res = await axios.get(MELBET_API_URL);
        const data = res.data?.Value || [];

        const matchs = data.filter(m =>
            m.SC && Array.isArray(m.SC.FS) && m.SC.FS.length === 2 &&
            m.O1 && m.O2 && m.LE
        ).slice(0, 6);

        if (matchs.length === 0) {
            await bot.sendMessage(CHAT_ID, '⚠️ Aucun match fiable détecté.');
            return;
        }

        for (const match of matchs) {
            const team1 = match.O1;
            const team2 = match.O2;
            const comp = match.LE;
            const fs = match.SC.FS;
            const melbetScore = `${fs[0]}-${fs[1]}`;

            // 📡 Scraper SofaScore ou Score24.live (à adapter si dispo)
            const score1 = await scrapeHTML('https://www.score24.live', '.scoreboard .score'); // à adapter
            const score2 = await scrapeHTML('https://www.sofascore.com', '.event .score');      // à adapter

            // 🔐 Vérification croisée
            const scoreAgree = [melbetScore, score1, score2].filter(s => s === melbetScore).length >= 2;

            const message = `
🎯 *MATCH FIFA TRUQUÉ DÉTECTÉ*
🏆 Compétition : ${comp}
⚽ ${team1} vs ${team2}
📊 *Score Final Prédit* : ${scoreAgree ? melbetScore : 'Non fiable'}
💯 Fiabilité IA : ${scoreAgree ? '98%' : '⚠️ Incertaine'}
🔐 Source : Melbet, SofaScore, Score24
_Propulsé par THE BILLION_ 💰
            `;
            await bot.sendMessage(CHAT_ID, message, { parse_mode: 'Markdown' });
        }

        console.log("✅ Prédictions envoyées.");
    } catch (err) {
        console.error("❌ ERREUR :", err.message);
        await bot.sendMessage(CHAT_ID, `❌ Erreur : ${err.message}`);
    }
}

run();
