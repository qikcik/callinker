var events = require('events');
var eventEmitter = new events.EventEmitter();


module.exports = {
    debug: (tittle, error) => eventEmitter.emit('log', 'debug', tittle, error),
    info: (tittle, error) => eventEmitter.emit('log', 'info', tittle, error),
    warning: (tittle, error) => eventEmitter.emit('log', 'warning', tittle, error),
    critical: (tittle, error) => eventEmitter.emit('log', 'critical', tittle, error),
    anchor: eventEmitter
}