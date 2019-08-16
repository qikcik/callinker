var logger = require('./logger.js');

module.exports = function() {
    const DiscordWebhook = require("webhook-discord")
    const discord = new DiscordWebhook.Webhook("https://discordapp.com/api/webhooks/610585203060244520/VhoBnoMVtdr95TordA5GZKfaQ-yBjjYE3rTJB5ukxKwg96wr9qxzeBsyyTDfjWkfRyXL")

    logger.handler.on('log', (type, scope, tittle, value) => {
        if (type == 'info')
            discord.info('locktell bochnia', `[${scope}:${tittle}]  ${value}`);
        if (type == 'warning')
            discord.warn('locktell bochnia', `[${scope}:${tittle}]  ${value}`);
        if (type == 'critical')
            discord.err('locktell bochnia', `[${scope}:${tittle}]  ${value}`);
        if (type == 'success')
            discord.success('locktell bochnia', `[${scope}:${tittle}]  ${value}`);
    });
}