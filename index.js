var Database = require('./database.js');
var Baselinker = require('./baselinker.js');

var DiscordManager = require('./discordManager.js');
var WebPanel = require('./webpanel.js');

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
        await database.connect(`mongodb://localhost:27057`, `debug15`);
        logger.success('startup', 'succesful connected to database');

        var baselinker = new Baselinker(database.db, '1652-1186-ZRFTDJMXJG48Q06F5FSOUWP4CRY59HB3M10LOQ2C8QX9FF8J0NYCA57RNTEW0355');
        await baselinker.initialize();
        logger.success('startup', 'baselinker initialized');

        var webPanel = new WebPanel(7777);
        await webPanel.initialize();
        logger.success('startup', 'webpanel Initialized');

        var discordManager = new DiscordManager('NjEwMjAxNDQ0NTIzNTczMjU4.XVMfSA.ugR99rMHBXhrvOfYlP1g2jyh1gk');
        discordManager.command.on( 'sync', () => baselinker.sync() );
        discordManager.command.on( 'call', async (extenison,number) => { 
            webPanel.sendThatCalled(extenison,number);
            let result = await baselinker.getOrderByPhone(number);
            webPanel.sendOrders(extenison,number,result);
        });
        discordManager.command.on( 'hangup', (a) => webPanel.sendThatHangup(a));

        await discordManager.initialize();
        logger.success('startup', 'discordManager initialized');

        setInterval( () => {
            try {
                baselinker.sync();
            }
            catch(err) {
                logger.critical('sync interval',err);
            }
        } , 1000*60*30);
        logger.success('startup', 'end successful');

    } catch (err) {
        logger.critical('startup', err);
        setTimeout( () => {
            startup();
        }, 10000);
    }
}

console.log('start');
startup();
