//SOCKET.IO
var Express = require('express')
var Path = require('path');

var Logger = require('./logger.js');
var logger = new Logger.Logger("webpanel");

module.exports = class WebPanel {
    constructor(port) {

        this._connectedClient = {};

        this._port = port;

        this._app = Express();
        this._server = require('http').createServer(this._app);
        this._io = require('socket.io')(this._server);

        this._app.use(Express.static(Path.join(__dirname, 'public')));
    }

    async initialize() {

        // connect evrything, try/catch is prophylactically
        try {
            await new Promise( (resolve, reject) =>{
                this._server.listen(this._port, () => {
                    resolve(true);
                });
            });
        }
        catch (err) {
            logger.critical(`initialize`,err);
            throw err; // forward error
        }

        this._setSocketMethods();

        return true;
    }

    sendThatCalled(extension,number) {
        for (let i in this._connectedClient)
            if(this._connectedClient[i].extension == extension)
                this._connectedClient[i].client.emit(`call answered`, {number: number});
    }

    sendThatHangup(extension,number) {
        for (let i in this._connectedClient)
            if(this._connectedClient[i].extension == extension)
                this._connectedClient[i].client.emit(`call ended`, {number: number});
    }

    sendOrders(extension,number,orders) {
        for (let i in this._connectedClient)
            if(this._connectedClient[i].extension == extension)
                this._connectedClient[i].client.emit(`receive order`, orders);
    }

    //////////// PRIVATE

    _setSocketMethods()
    {
        this._io.on('connection', (client) => {
            // register
            client.on('register', (extension) => {
                try {
                    extension = extension.replace(/ /gi, '');

                    this._connectedClient[client.id] = {
                        client: client,
                        extension: extension
                    }
                    client.emit('registered', extension);
                    logger.info(`io on register`,`${client.id} connected to ${extension}`);
                }
                catch(err) {
                    logger.critical(`io on register`,err);
                }
                
            });
        
            // unregister
            client.on('disconnect', () => {
                try {
                    let extension = this._connectedClient[client.id].extension;

                    delete this._connectedClient[client.id];
                    logger.info(`io on disconnect`,`${client.id} disconnect from ${extension}`);
                }
                catch(err) {
                    //logger.critical(`io on disconnect`,err);
                }
            })
        
        })

    }
}


// AMI
/*
const AmiClient = require('asterisk-ami-client');
let client = new AmiClient();

client.connect('ami', '948411c88deea8b78e0f4aee134358b4', { host: 'localhost', port: 5038 })
    .then(amiConnection => {

        client
            .on('connect', () => Logger.Success('AMI CLIENT', 'connect'))
            .on('event', reciveEvent)
            //.on('data', chunk => console.log(chunk))
            //.on('response', response => console.log(response))
            .on('disconnect', () => Logger.Critial('AMI CLIENT', 'disconnect'))
            .on('reconnection', () => Logger.Warning('AMI CLIENT', 'reconnection'))
            .on('internalError', (error) => Logger.Error('AMI CLIENT', error))
            //.action({
            //   Action: 'Ping'
            //});

        //setTimeout(() => {
        //    client.disconnect();
        //}, 5000);

    })
    .catch(error => console.log(error));

function reciveEvent(event) {
    //if(event.Channel == "SIP/CXtrakt-00000174")
    //{
    if (event.Event == "Newchannel" && event.Exten == "122100080") {
        call(event.CallerIDNum, event.Channel);
    }
    if (event.Event == "Hangup") {
        hangup(event.CallerIDNum, event.Channel);
    }
    //}
}
*/