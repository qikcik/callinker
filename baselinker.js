/*

Npm Require: request-promise, request, MongoDB

*/

var rp = require('request-promise');


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
        _id: order.order_id,
        phone: order.phone,
        confirmed: order.confirmed
    }
}

async function AddNewUnconfirmedOrders(baselinker) {
    try {
        var lastId = await baselinker.db.collection('orders').find().sort({ _id: -1 }).limit(1).toArray();
        if (lastId.length == 0)
            lastId = 0;
        else
            lastId = lastId[0]._id + 1;

        var data = await Request("getOrders", {
            id_from: lastId,
            get_unconfirmed_orders: true
        }, baselinker.key);

        data = JSON.parse(data);

        if (data.status != "SUCCESS")
            throw new Error(`bad query status ${data}`);


        // Push Data

        // mapping data
        var mapped = [];

        for (var i in data.orders) {
            mapped.push(MapBaselinkerOrderToSimplified(data.orders[i]));
        }

        var result = await baselinker.db.collection('orders').insertMany(mapped);

        console.log(`insert ${mapped.length} witch last id ${mapped[mapped.length-1]._id}`);

        if (data.orders.length == 100)
            return AddNewUnconfirmedOrders(baselinker);

    } catch (err) {
        console.log(err);
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