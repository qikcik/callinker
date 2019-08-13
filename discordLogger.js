var logger = require('./logger.js');

module.exports = function() {
    const DiscordWebhook = require("webhook-discord")
    const discord = new DiscordWebhook.Webhook("https://discordapp.com/api/webhooks/610585203060244520/VhoBnoMVtdr95TordA5GZKfaQ-yBjjYE3rTJB5ukxKwg96wr9qxzeBsyyTDfjWkfRyXL")

    logger.anchor.on('log', (type, tittle, value) => {
        if (type == 'info')
            discord.info('locktell bochnia', `[${tittle}]  ${value}`);
        if (type == 'warning')
            discord.warn('locktell bochnia', `[${ittle}]  ${value}`);
        if (type == 'error')
            discord.err('locktell bochnia', `[${ittle}]  ${value}`);
    });
}