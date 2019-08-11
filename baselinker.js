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


module.exports = class BaseLinker {
    constructor(MongoDB, key) {
        this.db = MongoDB;
        this.key = key;
    }

    async getNewOrders() {

        try {
            let lastId = await this.db.collection('orders').find().sort({ id: -1 }).limit(1).toArray();
            if (lastId.length = 0)
                lastId = 0;
            else
                lastId = lastId[0]++;

            var data = await Request("getOrders", {
                id_from: lastId,
                get_unconfirmed_orders: true
            }, this.key);

            data = JSON.parse(data);

            if (data.status != "SUCCESS")
                throw new Error(`bad query status ${data}`);

            console.log(data);
            // Push Data

            if (data.orders.length == 100)
                return this.getNewOrders();

        } catch (err) {
            console.log(err);
        }

        return Promise.resolve(":)");
    }
};