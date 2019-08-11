var rp = require('request-promise');

function Request(method, parameters) {
    return rp({
        url: 'https://api.baselinker.com/connector.php',
        form: {
            token: Key,
            method: method,
            parameters: JSON.stringify(parameters)
        }
    });
}

class BaseLinker {
    constructor(key) {
        this.key = key;
    }
}

exports = BaseLinker;


let api = new BaseLinker('2997-20704-BBM26K4I6NS8EFOM93UIH0QZYNMVVNKVE7PTFYCNLZHUDLT5A1QE5I28JYJ28L4T');

console.log(api);