var mongoClient = require("mongodb").MongoClient,
    db;



class Database {
    constructor() {
            this.db = null;
        }
        /* require using promises catch and then to save working */
    async connect(url, name) {
        try {
            var connection = await mongoClient.connect(url, { useNewUrlParser: true });
            this.db = connection.db(name);

            console.log("MongoDB Connected sucessful");
            return Promise.resolve(this.db);
        } catch (err) {

            console.log(`error while connecting to MongoDB: ${err}`);
            return Promise.reject(err);
        }
    }

}

var base = new Database();
exports = base;

base.connect(`mongodb://localhost:270571`, `debug`).then(b => {
    console.log(base.db);

}).catch(error => {
    console.log("an error when connecting ");
    console.log(error);
});