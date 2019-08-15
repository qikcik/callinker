var Database = require('./database.js');
var Baselinker = require('./baselinker.js');

var DiscordManager = require('./discordManager.js');

var Logger = require('./logger.js');
require('./discordLogger.js')();

Logger.handler.on('log', (scope,type, tittle, value) => {
    console.log(`[${scope}:${type}] ${tittle}: `, value);
});

process.on('uncaughtException', function(exception) {
    let logger = new Logger.Logger('uncaught');
    logger.critical(exception);
});

var logger = new Logger.Logger('index.js');


async function startup() {
    try {

        var database = new Database();
        await database.connect(`mongodb://localhost:27057`, `debug5`);
        logger.info('startup', 'succesful connected to database');

        var baselinker = new Baselinker(database.db, '1652-1186-ZRFTDJMXJG48Q06F5FSOUWP4CRY59HB3M10LOQ2C8QX9FF8J0NYCA57RNTEW0355');
        await baselinker.initialize();
        logger.info('startup', 'test');

        var discordManager = new DiscordManager('NjEwMjAxNDQ0NTIzNTczMjU4.XVMfSA.ugR99rMHBXhrvOfYlP1g2jyh1gk');
        discordManager.command.on( 'sync', () => baselinker.sync() );

        

        await discordManager.initialize();
        logger.info('startup', 'test2');

        //await baselinker.getOrderByPhone('+48693982263');

    } catch (err) {
        logger.critical('startup', err);
        setTimeout( () => {
            startup();
        }, 10000);
    }
}

console.log('start');
startup();
