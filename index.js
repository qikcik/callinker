var Database = require('./database.js');
var Baselinker = require('./baselinker.js');

var DiscordManager = require('./discordManager.js');
var AmiManager = require('./amiManager.js');
var WebPanel = require('./webpanel.js');

var Logger = require('./logger.js');
require('./discordLogger.js')();

var colors = require('colors');
Logger.handler.on('log', (scope,type, tittle, value) => {
    console.log(`[${scope}:${type}]`.green,` ${tittle}: `, value);
});

process.on('uncaughtException', function(exception) {
    let logger = new Logger.Logger('uncaught');
    logger.critical(exception);
});

var logger = new Logger.Logger('main');

var activeCall = {};


async function startup() {
    try {
        var amiManager = new AmiManager();

        var database = new Database();
        await database.connect(`mongodb://localhost:27057`, `debug15`);
        logger.success('startup', 'succesful connected to database');

        var baselinker = new Baselinker(database.db, 'secret');
        var webPanel = new WebPanel(7777);
        var discordManager = new DiscordManager('secret');


        discordManager.command.on( 'sync', () => baselinker.sync() );
        discordManager.command.on( 'call', async (extenison,number) => { 
            activeCall[extenison] = number;
            logger.success('callControler', `call from ${number} to ${extenison}`);
            let result = await baselinker.getOrderByPhone(number);
            webPanel.sendThatCalled(extenison,number,result);
        });
        discordManager.command.on( 'hangup', async (extenison) => {
            logger.success('callControler', `hangup in ${extenison}`);
            if(activeCall[extenison]) delete activeCall[extenison];
            webPanel.sendThatHangup(extenison)
        });


        amiManager.command.on( 'call', async (extenison,number) => { 
            activeCall[extenison] = number;
            logger.success('callControler-ami', `call from ${number} to ${extenison}`);
            let result = await baselinker.getOrderByPhone(number);
            webPanel.sendThatCalled(extenison,number,result);
        });
        amiManager.command.on( 'hangup', async (extenison) => {
            logger.success('callControler-ami', `hangup in ${extenison}`);
            if(activeCall[extenison]) delete activeCall[extenison];
            webPanel.sendThatHangup(extenison)
        });

        webPanel.handler.on('logged', async (extension) => {
            if(activeCall[extension])
            {
                let result = await baselinker.getOrderByPhone(activeCall[extension]);
                webPanel.sendThatCalled(extension,activeCall[extension],result);
                logger.success('callControler', `when logged active call in ${extension} from ${activeCall[extension]}`);
            }
        });

        baselinker.handler.on('synced', async () => {
            for (var extenison in activeCall) {
                let number = activeCall[extenison];
                let result = await baselinker.getOrderByPhone(number);
                if(activeCall[extenison]) webPanel.sendThatCalled(extenison,number,result);
                logger.success('callControler', `re-sent call after syncing, from ${number} to ${extenison}`);
            } 
        });




        await baselinker.initialize();
        logger.success('startup', 'baselinker initialized');
        await webPanel.initialize();
        logger.success('startup', 'webpanel Initialized');
        await discordManager.initialize();
        logger.success('startup', 'discordManager initialized');
        await amiManager.initialize('ami','secret','localhost',5038);
        logger.success('startup', 'amiManager initialized');

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
