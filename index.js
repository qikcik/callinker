var Database = require('./database.js');
var Baselinker = require('./baselinker.js');
var logger = require('./logger.js');

require('./discordLogger.js')();

logger.anchor.on('log', (type, tittle, value) => {
    console.log(`[${type}] ${tittle}: `, value);
});

process.on('uncaughtException', function(exception) {
    logger.critical(exception);
});
var baselinker = null;
async function startup() {
    try {

        var database = new Database();
        await database.connect(`mongodb://localhost:27057`, `debug5`);
        logger.info('startup', 'succesful connected to database');

        baselinker = new Baselinker(database.db, '1652-1186-ZRFTDJMXJG48Q06F5FSOUWP4CRY59HB3M10LOQ2C8QX9FF8J0NYCA57RNTEW0355');
        await baselinker.initialize();

        //await baselinker.getOrderByPhone('+48693982263');

    } catch (err) {
        logger.critical('startup', JSON.stringify(err));
    }
}

console.log('start');
startup();



////////////////////// SIMULATE CALL

const Discord = require('discord.js');


const client = new Discord.Client();

client.on('ready', () => {
    logger.info('discord simulate call is working');
});


client.on('message', message => {

    if (message.content.includes("!sync")) {
        baselinker.sync();
    } else if (message.content.includes("!call")) {
        baselinker.sync();
    }
});

client.login('NjEwMjAxNDQ0NTIzNTczMjU4.XVMfSA.ugR99rMHBXhrvOfYlP1g2jyh1gk');