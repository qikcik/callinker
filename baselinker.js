/*

Npm Require: request-promise, request, MongoDB

*/

var rp = require('request-promise');
var logger = require('./logger.js');
var usefull = require('./usefull.js');
var events = require('events');



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

    order._id = order.order_id; // it simplify some error catching
    order.phone = usefull.validatePhoneNumber(order.phone);

    return order;
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
            throw new Error(`bad query status ${JSON.stringify(data)}`);

        // if empty
        if (data.orders.length == 0) {
            logger.debug('AddNewUnconfirmedOrders', 'nothing to initialize');
            // start first syncing
            await baselinker.sync(true);
            return true;
        }


        // mapping data
        var mapped = [];
        for (var i in data.orders) {
            mapped.push(MapBaselinkerOrderToSimplified(data.orders[i]));
        }

        // push data
        var result = await baselinker.db.collection('orders').insertMany(mapped);
        logger.debug('AddNewUnconfirmedOrders', `succesful inserted '${mapped.length}' items (last id: ${mapped[mapped.length-1]._id})`);

        // get next part
        if (data.orders.length == 100) {
            return await AddNewUnconfirmedOrders(baselinker);
        }

    } catch (err) {
        logger.critical('AddNewUnconfirmedOrders', JSON.stringify(err));
        throw err; //forward error
    }

    // success
    baselinker.sync(true);
    return true;
}
// return order object or null
async function getOrder(baselinker, id) {
    try {
        var data = await Request("getOrders", {
            order_id: id,
            get_unconfirmed_orders: true,
        }, baselinker.key);

        data = JSON.parse(data);

        if (data.status != "SUCCESS")
            throw new Error(`bad query status ${data}`);

        if (data.orders[0] == null)
            return null;
        return MapBaselinkerOrderToSimplified(data.orders[0]);

    } catch (err) {
        logger.critical('getOrder', JSON.stringify(err));
        throw err; //  forward error
    }
}

async function updateOrdersFromJournalList(baselinker, firstSyncing = false) {
    try {
        // request
        var data = await Request("getJournalList", {
            last_log_id: baselinker.lastLogId,
            log_types: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
        }, baselinker.key);

        data = JSON.parse(data);

        // check status
        if (data.status != "SUCCESS")
            throw new Error(`bad query status ${JSON.stringify(data)}`);

        logger.info('updateOrdersFromJournalList', `new logs ${data.logs.length}`);

        // for later to ignore older then 10m
        var timestamp = Math.floor(Date.now() / 1000)

        if (data.logs.length == 0) {
            return true;
        }

        for (let i = 0; i != data.logs.length; i++) {
            let actual = data.logs[i];

            // if first syncing ignore older then 10m
            if (firstSyncing && timestamp - actual.date > 600) {
                baselinker.lastLogId = actual.log_id + 1;
                continue;
            }
            // add or update order
            if ([1, 2, 3, 7, 8, 9, 10, 11, 12, 13, 14, 16].includes(actual.log_type)) {
                //get actual version of order
                let order = await getOrder(baselinker, actual.order_id);

                // update and update last log to don't reapeat updating it later
                var r = await baselinker.db.collection('orders').updateOne({ _id: order._id }, { $set: order }, { upsert: true });
                baselinker.lastLogId = actual.log_id + 1;

                logger.debug('updateOrdersFromJournalList', `update or add witch log id ${baselinker.lastLogId} (phone: ${order.phone})`);
            }
            // deleted order
            else if (actual.log_type == 4) {
                //check is it relly be deleted
                let order = await getOrder(baselinker, actual.order_id);
                if (order == null) {
                    await baselinker.db.collection('orders').deleteOne({ _id: actual.order_id });
                } else
                    logger.warning('updateOrdersFromJournalList', `logs said that ${actual.order_id} was deleted but it exsist`);
            }
            // ignore 
            else {
                baselinker.lastLogId = actual.log_id + 1;
            }
        }


    } catch (err) {
        logger.critical('updateOrdersFromJournalList', JSON.stringify(err));
        throw err; // forward error
    } //

    return await updateOrdersFromJournalList(baselinker, firstSyncing);
}

module.exports = class BaseLinker {
    constructor(MongoDB, key) {
        this.db = MongoDB;
        this.key = key;

        this.lastLogId = 1;
        this.anchor = new events.EventEmitter();

        this.isSyncing = false;
    }

    async initialize() {
        await AddNewUnconfirmedOrders(this);
        return true;
    }

    getOrderByPhone(number) {
        return new Promise((resolve, reject) => {
            this.db.collection('orders').find({ phone: usefull.validatePhoneNumber(number) })
                .toArray()
                .then(result => {
                    logger.info('getOrderByPhone', result[0].phone);
                    resolve(result);
                })
                //.catch((err) => reject(err));
        });
    }

    async sync(firstSyncing = false) {
        if (this.isSyncing == false) {
            this.isSyncing = true;
            await updateOrdersFromJournalList(this, firstSyncing);
            this.anchor.emit('synced');
            this.isSyncing = false;
            return true;
        } else logger.warning('baselinker-sync()', `trying to sync when is syncing ${JSON.stringify(new Error('trackrace'))}`);
        return false;
    }
};