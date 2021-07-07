const database = require("./database")
const print = console.log
const DEV = true
const DEV_SERVER_ID = "341153679992160266"
var client

function AddSlashBase() {
    return DEV ? client.api.applications(client.user.id).guilds(DEV_SERVER_ID) : client.api.applications(client.user.id)
}

function SetClient(cl) {
    client = cl
}
const out = {database, client, DEV, DEV_SERVER_ID, AddSlashBase, SetClient}

// create a unique, global symbol name
// -----------------------------------

const Key = Symbol.for("globals");

// check if the global object has this symbol
// add it if it does not have the symbol, yet
// ------------------------------------------

var globalSymbols = Object.getOwnPropertySymbols(global);
var exists = (globalSymbols.indexOf(Key) > -1);

if (!exists){
  global[Key] = out;
}

// define the singleton API
// ------------------------

var singleton = {};

Object.defineProperty(singleton, "instance", {
  get: function(){
    return global[Key];
  }
});

// ensure the API is never changed
// -------------------------------

Object.freeze(singleton);

// export the singleton API only
// -----------------------------

module.exports = singleton;