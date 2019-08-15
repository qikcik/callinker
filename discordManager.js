const Discord = require('discord.js');
var Events = require('events');

var usefull = require('./usefull.js');

var Logger = require('./logger.js');
var logger = new Logger.Logger("discordManager");


module.exports = class DiscordManager {

    command = new Events.EventEmitter();

    _client = new Discord.Client();

    constructor(token)
    {
        this._token = token;

        this._client.on('message', message => {
            try
            {
                if(!message.author.bot)
                {
                    var str = message.content.split(" ");

                    if (str[0] == '!sync') {
                        this.command.emit('sync');
                    } 
                    else if (str[0] == '!call') {
                        this.command.emit('call',str[1],usefull.validatePhoneNumber(str[2]));
                    }
                    else if (str[0] == '!hangup') {
                        this.command.emit('hangup',str[1]);
                    }
                }
            }
            catch(err)
            {
                logger.critical('on message',err);
            }
        });
    }

    async initialize() {
        try {
        await this._client.login('NjEwMjAxNDQ0NTIzNTczMjU4.XVMfSA.ugR99rMHBXhrvOfYlP1g2jyh1gk');
        }
        catch (err) {
            logger.critical('initialize',err);
            throw err;
        }
        return true;
    }
}
