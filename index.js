var Database = require('./database.js');
var Baselinker = require('./baselinker.js');
var logger = require('./logger.js');

const DiscordWebhook = require("webhook-discord")
const discord = new DiscordWebhook.Webhook("https://discordapp.com/api/webhooks/610585203060244520/VhoBnoMVtdr95TordA5GZKfaQ-yBjjYE3rTJB5ukxKwg96wr9qxzeBsyyTDfjWkfRyXL")

logger.anchor.on('log', (type, tittle, value) => {
    console.log(`[${type}] ${tittle}: `, value);
    discord.warn('locktell bochnia', `[${type}] ${tittle}: ${value}`);
});

async function startup() {
    try {

        var database = new Database();
        await database.connect(`mongodb://localhost:27057`, `debug4`);

        var baselinker = new Baselinker(database.db, '1652-1186-ZRFTDJMXJG48Q06F5FSOUWP4CRY59HB3M10LOQ2C8QX9FF8J0NYCA57RNTEW0355');
        await baselinker.sync(); //.then(() => logger.info('startup baselinker syncing', 'sucessful'));


    } catch (err) {
        logger.critical(err);
    }


}

startup();


//let api = new BaseLinker(Database.db, '2997-20704-BBM26K4I6NS8EFOM93UIH0QZYNMVVNKVE7PTFYCNLZHUDLT5A1QE5I28JYJ28L4T');

//console.log(api);
///})sole.log(api);
///})