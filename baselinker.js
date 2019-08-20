/*

Npm Require: request-promise, request, MongoDB

*/

var rp = require('request-promise');
var Logger = require('./logger.js');
var usefull = require('./usefull.js');
var events = require('events');

var logger = new Logger.Logger("baselinker");

module.exports = class BaseLinker {


    /////////////////// PUBLIC ////////////////////////////

    constructor(database, apiToken) {
        this._db = database;
        this._apiToken = apiToken;

        this._lastLogId = 1;
        this.handler = new events.EventEmitter();


        this._isInitialized = false;
        this._isSyncing = false;
    }

    async initialize() {

        if (this._isInitialized == false) {
            await this._insertPartOfUnconfirmedOrders();
            await this.sync(true);
            this._isInitialized = true;
            return true;
        }
        else logger.warning('baselinker-initialize()', `trying to iniitalized ${new Error('trackrace')}`);
        return false;
    }

    async sync(firstSyncing = false) {
        if (this._isSyncing == false) {
            this._isSyncing = true;
            await this._updatePartOfOrdersFromJournalList(this, firstSyncing);
            this.handler.emit('synced');
            this._isSyncing = false;
            return true;
        } else logger.warning('baselinker-sync()', `trying to sync when is syncing ${new Error('trackrace')}`);
        return false;
    }

    async getOrderByPhone(number)
    {
        try {
            number = usefull.validatePhoneNumber(number);
            var result = await this._db.collection('orders').find({ phone: number }).toArray();
            return result;
        }
        catch(err) {
            logger.critical('getOrderByPhone',err);
            throw err;
        }
    }

    ////////////////////////// STEPS ///////////////////////

    async _insertPartOfUnconfirmedOrders()
    {
        try {
            // count last order id and increment it or set to 0
            var lastId = await this._db.collection('orders').find().sort({ _id: -1 }).limit(1).toArray();
            if (lastId.length == 0)
                lastId = 0;
            else
                lastId = lastId[0]._id + 1;
    
            // query and parse new package of order
            var data = await this._request("getOrders", {
                id_from: lastId,
                get_unconfirmed_orders: true
            });
    
            data = JSON.parse(data);
    
            // chek status, is evrything okey
            if (data.status != "SUCCESS")
                throw new Error(`bad query status ${JSON.stringify(data)}`);
    
            // check it is new order
            if (data.orders.length == 0) {
                logger.success('AddNewUnconfirmedOrders', 'initialize succesful');
                return true;
            }
    
    
            // validate orders
            var validated = [];
            for (var i in data.orders) {
                validated.push(this._validateOrder(data.orders[i]));
            }
    
            // push data to database
            var result = await this._db.collection('orders').insertMany(validated);
            logger.debug('AddNewUnconfirmedOrders', `succesful inserted '${validated.length}' items (last id: ${validated[validated.length-1]._id})`);
    
            // if is max orders length, get next part
            if (data.orders.length == 100) {
                return await this._insertPartOfUnconfirmedOrders();
            }
    
        } catch (err) {
            logger.critical('AddNewUnconfirmedOrders', err);
            throw err; //forward error
        }
    
        // success
        return true;
    }

    async _updatePartOfOrdersFromJournalList(firstSyncing = false) {
        try {
            // query and parse new package of order
            var data = await this._request("getJournalList", {
                last_log_id: this._lastLogId,
                log_types: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
            });
    
            data = JSON.parse(data);
    
            // chek status, is evrything okey
            if (data.status != "SUCCESS")
                throw new Error(`bad query status ${JSON.stringify(data)}`);
    
            logger.info('updateOrdersFromJournalList', `new logs ${data.logs.length}`);
    
            // for later to ignore older then 10m
            var timestamp = Math.floor(Date.now() / 1000)
    
            if (data.logs.length == 0) {
                return true;
            }
    
            var updated = [];
            for (let i = 0; i != data.logs.length; i++) {
                let actual = data.logs[i];
    
                // if first syncing ignore older then 10m
                if (firstSyncing && timestamp - actual.date > 600) {
                    this._lastLogId = actual.log_id + 1;
                    continue;
                }
                // add or update order
                if ([1, 2, 3, 7, 8, 9, 10, 11, 12, 13, 14, 16].includes(actual.log_type)) {
                    // for decrase ununnecessary request
                    if(!updated.includes(actual.order_id) ) {
                        updated.push(actual.order_id);
                        //get actual version of order
                        let order = await this._getOrder(actual.order_id);
    
                        // update and update last log to don't reapeat updating it later
                        var r = await this._db.collection('orders').updateOne({ _id: order._id }, { $set: order }, { upsert: true });
                        this._lastLogId = actual.log_id + 1;
    
                        logger.debug('updateOrdersFromJournalList', `update or add witch log id ${this._lastLogId} (phone: ${order.phone})`);
                    }
                }
                // deleted order
                else if (actual.log_type == 4) {
                    //check is it relly be deleted
                    let order = await this._getOrder(actual.order_id);
                    if (order == null) {
                        await this._db.collection('orders').deleteOne({ _id: actual.order_id });
                    } else
                        logger.warning('updateOrdersFromJournalList', `logs said that ${actual.order_id} was deleted but it exsist`);
                }
                // ignore 
                else {
                    this._lastLogId = actual.log_id + 1;
                }
            }
    
    
        } catch (err) {
            logger.critical('updateOrdersFromJournalList', err);
            throw err; // forward error
        } //
    
        return await this._updatePartOfOrdersFromJournalList(firstSyncing);
    }

    ///////////////////////// UTILS //////////////////////////

    async _request(method, parameters) {
        return rp({
            method: 'POST',
            url: 'https://api.baselinker.com/connector.php',
            form: {
                token: this._apiToken,
                method: method,
                parameters: JSON.stringify(parameters)
            }
        });
    }

    async _getOrder(id) {
        try {
            var data = await this._request("getOrders", {
                order_id: id,
                get_unconfirmed_orders: true,
            });
    
            data = JSON.parse(data);
    
            // check status
            if (data.status != "SUCCESS")
                throw new Error(`bad query status ${data}`);
            
            // return 
            if (data.orders[0] == null)
                return null;
            return this._validateOrder(data.orders[0]);
    
        } catch (err) {
            logger.critical('getOrder', err);
            throw err; //  forward error
        }
    }

    ////////////////////// VALIDATION ////////////////////////

    _validateOrder(order) {
        order._id = order.order_id; // it simplify to cath some error
        order.phone = usefull.validatePhoneNumber(order.phone);
        return order;
    }
};