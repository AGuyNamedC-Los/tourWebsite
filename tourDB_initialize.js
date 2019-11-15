/* 
	npm install nedb --save
	npm install --save nedb-promises 
*/

const DataStore = require('nedb-promises');
const db = DataStore.create(__dirname + '/toursDB');
var tours = require('./tours.json');

async function initialize() { // so I can await!
    try {
        let numRemoved = await db.remove({}, {multi: true}, function (err, numRemoved) {});
        console.log(`Cleanup, removed ${numRemoved} tours`);
        let newDocs = await db.insert(tours.minecraftTours);
        console.log(`Added ${newDocs.length} tours`);
    } catch (err) {
        console.log(`Database error: ${err}`);
    }
}
initialize(); // don't forget to run the async function