var events = require('events');
var eventEmitter = new events.EventEmitter();


//eventEmitter.on('log', (type, tittle, value) => {
//    console.log(`[${type}] ${tittle}: `, value);
//});

module.exports = {
    debug: (tittle, error) => eventEmitter.emit('debug', 'info', tittle, error),
    info: (tittle, error) => eventEmitter.emit('log', 'info', tittle, error),
    warning: (tittle, error) => eventEmitter.emit('warning', 'info', tittle, error),
    critical: (tittle, error) => eventEmitter.emit('critical', 'info', tittle, error),
    anchor: eventEmitter
}