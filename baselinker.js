/*

Npm Require: request-promise, request, MongoDB

*/

var rp = require('request-promise');
var logger = require('./logger.js');
var usefull = require('./usefull.js');


async function Request(method, parameters, key) {
    return rp({
        method: 'POST',
        url: 'https://api.baselinker.com/connector.php',
        form: {
            token: key,
            method: method,
            parameters: JSON.stringify(parameters)
        }
    });
}

function MapBaselinkerOrderToSimplified(order) {
    return {
        _id: order.order_id, // it simplify some error catching
        phone: usefull.validatePhoneNumber(order.phone),
        confirmed: order.confirmed
    }
}

async function AddNewUnconfirmedOrders(baselinker) {
    try {
        // count last id and increment it
        var lastId = await baselinker.db.collection('orders').find().sort({ _id: -1 }).limit(1).toArray();
        if (lastId.length == 0)
            lastId = 0;
        else
            lastId = lastId[0]._id + 1;

        // query and parse
        var data = await Request("getOrders", {
            id_from: lastId,
            get_unconfirmed_orders: true
        }, baselinker.key);

        data = JSON.parse(data);

        // chech status
        if (data.status != "SUCCESS")
            throw new Error(`bad query status ${data}`);


        // mapping data
        var mapped = [];
        for (var i in data.orders) {
            mapped.push(MapBaselinkerOrderToSimplified(data.orders[i]));
        }

        // push data
        var result = await baselinker.db.collection('orders').insertMany(mapped);
        logger.info('AddNewUnconfirmedOrders', `succesful inserted '${mapped.length}' items (last id: ${mapped[mapped.length-1]._id})`);

        // get next part
        if (data.orders.length == 100) {
            return AddNewUnconfirmedOrders(baselinker);
        }

    } catch (err) {
        logger.critical('AddNewUnconfirmedOrders', err);
    }

    // success
    return Promise.resolve(true);
}


module.exports = class BaseLinker {
    constructor(MongoDB, key) {
        this.db = MongoDB;
        this.key = key;
        this.isSyncing = false;
    }

    async sync() {
        this.isSyncing = true;
        await AddNewUnconfirmedOrders(this);
        this.isSyncing = false;
    }
};