var mongoClient = require("mongodb").MongoClient,
    db;



module.exports = class Database {
    constructor() {
        this.db = null;
    }

    /* require using promises catch and then to save working */
    async connect(url, name) {
        try {
            var connection = await mongoClient.connect(url, { useNewUrlParser: true });
            this.db = connection.db(name);

            return Promise.resolve(this.db);
        } catch (err) {

            return Promise.reject(err);
        }
    }
}