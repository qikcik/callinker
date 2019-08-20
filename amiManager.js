const AmiClient = require('asterisk-ami-client');

var usefull = require('./usefull.js');

var Logger = require('./logger.js');
var logger = new Logger.Logger("amiManager");


var Events = require('events');


module.exports = class AmiManager {

    command = new Events.EventEmitter();

    constructor()
    {
        this._bridges = {};

        this._client = new AmiClient();
        this._client.on('connect', () => logger.success('amiClient','connect'))
        .on('disconnect', () => logger.success('amiClient','disconnect'))
        .on('reconnection', () => logger.warning('amiClient','reconnect'))
        .on('internalError', error => logger.critical('amiClient',err))
        .on('event', event => {
            this._reciveEvent(event);
        });
    }

    async initialize(name,pass,host,port) {
        try {
            await this._client.connect(name,pass, { host: host, port: port });
        }
        catch (err) {
            logger.critical('initialize',err);
            throw err;
        }
        return true;
    }

    _reciveEvent(event) {
        try {
            if(event.Event == "BridgeCreate")
            {
                this._bridges[event.BridgeUniqueid] = {};
                logger.info('BridgeCreate',JSON.stringify(event));      
            }
            else if(event.Event == "BridgeDestroy")
            {
                if(this._bridges[event.BridgeUniqueid]) delete this._bridges[event.BridgeUniqueid];
                logger.info('BridgeDestroy',JSON.stringify(event));
                
            }
            else if(event.Event == "BridgeEnter")
            {
                logger.info('BridgeDestroy',JSON.stringify(event));
                if(this._bridges[event.BridgeUniqueid])
                {
                    if(! this._bridges[event.BridgeUniqueid][event.CallerIDNum])
                    {
                        this._bridges[event.BridgeUniqueid][event.CallerIDNum] = usefull.validatePhoneNumber(event.CallerIDNum);
                        
                        if(this._bridges[event.BridgeUniqueid].length == 2)
                        {
                        let conectedNumbers = Object.keys(this._bridges[event.BridgeUniqueid]);
                        this.command.emit('call',conectedNumbers[0],conectedNumbers[1]);
                        this.command.emit('call',conectedNumbers[1],conectedNumbers[0]);
                            logger.info('_reciveEvent',`pair ${conectedNumbers[1]} and ${conectedNumbers[0]}`);
                            return;
                        }
                        logger.info('_reciveEvent',`first in bridge ${event.CallerIDNum}`);
                    }
                }
            }

            else if(event.Event == "BridgeLeave")
            {
                logger.info('BridgeDestroy',JSON.stringify(event));
                if(this._bridges[event.BridgeUniqueid])
                {
                    if(this._bridges[event.BridgeUniqueid][event.CallerIDNum])
                    {
                        this.command.emit('hangup',event.CallerIDNum);
                        delete this._bridges[event.BridgeUniqueid][event.CallerIDNum];
                    }
                    logger.info('BridgeLeave',JSON.stringify(event));
                    return;
                }
                logger.info('try to leave Bridge',JSON.stringify(event));
            }
        }
        catch (err) {
            logger.critical('_reciveEvent',err);
            //throw err;
        }
        return true;
    }

    /////////////// PRIVATE 


}
