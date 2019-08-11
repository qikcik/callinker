var Database = require('./database.js');
var Baselinker = require('./baselinker.js');

var database = new Database();
database.connect(`mongodb://localhost:27057`, `debug`)
    .then(db => {
        var baselinker = new Baselinker(db, '1652-1186-ZRFTDJMXJG48Q06F5FSOUWP4CRY59HB3M10LOQ2C8QX9FF8J0NYCA57RNTEW0355');
        baselinker.getNewOrders().then(() => console.log("succes"));

        //console.log(baselinker);
    })
    .catch(error => {
        console.log(error);
    });


//let api = new BaseLinker(Database.db, '2997-20704-BBM26K4I6NS8EFOM93UIH0QZYNMVVNKVE7PTFYCNLZHUDLT5A1QE5I28JYJ28L4T');

//console.log(api);
///})