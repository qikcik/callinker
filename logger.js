const Discord = require('discord.js');
const client = new Discord.Client();


client.on('ready', () => {
    client.channels.get(channelID).send(`@everyone ${ApplicationName} started working`);
});

const ApplicationName = "callLinker - locktelbochnia";
const channelID = '610202975973146626';
const Token = 'NjEwMjAxNDQ0NTIzNTczMjU4.XVB0iA.k_B0s4E-B7twKjgZfeM-TgKawvg';


module.exports = {
    init: () => { return client.login(Token) },
    info: (error) => {
        console.log(error);
        client.channels.get(channelID).send(error);
    },
    critical: (error) => { client.channels.get(channelID).send(error); }
}