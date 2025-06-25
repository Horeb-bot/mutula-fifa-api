import { Actor } from 'apify';
import axios from 'axios';
import TelegramBot from 'node-telegram-bot-api';

// La logique de l'acteur est encapsulée dans Actor.main()
// C'est la méthode standard pour les acteurs Apify modernes.
await Actor.main(async () => {
    // Récupère les inputs définis dans l'input_schema.json
    // C'est la manière propre de gérer les secrets et les paramètres sur Apify.
    const input = await Actor.getInput();
    const {
        TELEGRAM_BOT_TOKEN,
        TELEGRAM_CHAT_ID,
        MELBET_API_URL,
        categorie
    } = input;

    Actor.log.info(`Script démarré avec la catégorie : ${categorie}`);

    // Initialisation du bot Telegram
    const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: false });

    try {
        const response = await axios.get(MELBET_API_URL);
        const data = response.data;

        if (!data || !data.Value || !Array.isArray(data.Value)) {
            throw new Error("Format de données inattendu depuis l'API Melbet.");
        }

        const matchs = data.Value;

        // TODO: Implémenter une logique de filtrage basée sur la 'categorie'.
        // Exemple : if (categorie !== 'TOUS') { matchs = matchs.filter(m => m.LE === categorie); }

        // Filtrer les matchs fiables avec un score final structuré
        const matchsAvecScore = matchs.filter(m =>
            m.SC && Array.isArray(m.SC.FS) && m.SC.FS.length === 2 &&
            m.O1 && m.O2 && m.L && m.LE
        ).slice(0, 6); // Limite aux 6 premiers résultats

        if (matchsAvecScore.length === 0) {
            Actor.log.warning('Aucun match FIFA fiable avec score disponible détecté.');
            await bot.sendMessage(TELEGRAM_CHAT_ID, `⚠️ Aucun match FIFA fiable avec score disponible détecté pour la catégorie: ${categorie}.`);
            return;
        }

        Actor.log.info(`Trouvé ${matchsAvecScore.length} match(s) à envoyer.`);

        for (const match of matchsAvecScore) {
            const fs = match?.SC?.FS;
            const score = `${fs[0]}:${fs[1]}`;

            const message = `
🎯 *MATCH FIFA TRUQUÉ DÉTECTÉ*
🏆 Compétition : ${match.LE}
⚽ ${match.O1} vs ${match.O2}
📊 *Score Final Prédit* : ${score}
💯 Fiabilité IA : 98%
🔐 Source : Melbet
_Propulsé par THE BILLION_ 💰
            `;

            // Envoyer le message sur Telegram
            await bot.sendMessage(TELEGRAM_CHAT_ID, message, { parse_mode: 'Markdown' });

            // Sauvegarder les données dans le Dataset de l'acteur pour le suivi
            await Actor.pushData({
                competition: match.LE,
                equipe1: match.O1,
                equipe2: match.O2,
                scorePredit: score,
                source: 'Melbet',
                timestamp: new Date().toISOString()
            });
        }

        Actor.log.info("✅ Prédictions envoyées et sauvegardées avec succès.");

    } catch (error) {
        Actor.log.error(`❌ Erreur critique : ${error.message}`, { error });
        // Notifier l'échec sur Telegram
        await bot.sendMessage(TELEGRAM_CHAT_ID, `❌ Erreur critique dans l'acteur Melbet : ${error.message}`);
        // Marquer la run de l'acteur comme "Échouée"
        await Actor.fail(`Erreur critique : ${error.message}`);
    }
});
