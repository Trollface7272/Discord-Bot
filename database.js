/**
 * @typedef {Object} User
 * @property {String} id
 * @property {String} name
 * @property {Number} messages
 * @property {Boolean} changed
 * @property {Object} osu
 * @property {String} username
 */

const { Message } = require("discord.js")
const fs = require("fs");
const print = console.log
const basePath = "./data/users/";

(function() {
    let path = "."
    let split = basePath.split("/")
    for (let i = 1; i < split.length; i++) {
        const el = split[i]
        if (!fs.existsSync(path + "/" + el))
        fs.mkdirSync(path + "/" + el)
        path += "/" + el
    }
})()

/**
 * @param {Message} msg
 * @returns {User}
 */
function CreateUser(msg) {
    return {
        id: msg.author.id,
        name: msg.author.tag,
        messages: 1,
        changed: false,
        osu: {
            username: null
        }
    }
}

var users = {}

/**
 * @param {Message} msg 
 * @returns {Promise<User>}
 */
async function GetUser(msg) {
    let id = msg.author.id
    if (users[id]) return users[id]
    if (fs.existsSync(basePath + id + ".json")) {
        let data = fs.readFileSync(basePath + id + ".json")
        try {
            data = JSON.parse(data)
            users[id] = data
            return data
        } catch (err) {
            print("Error reading file - " + basePath + id + ".json")
            data = CreateUser(msg)
            fs.writeFileSync(basePath + id + ".json", JSON.stringify(data))
            users[id] = data
            return data
        }
    }
    print(2)
    let data = CreateUser(msg)
    fs.writeFileSync(basePath + id + ".json", JSON.stringify(data))
    users[id] = data
    return data
}

function GetUserById(id) {
    return users[id]
}

/**
 * @param {Message} msg 
 */
async function UserMessage(msg) {
    let data = await GetUser(msg)
    data.changed = true
    data.messages++
}

/**
 * @param {String} id 
 * @param {String} username 
 */
function SetOsuUsername(id, username) {
    GetUserById(id).osu.username = username
}

async function SaveData() {
    for (const key in users) {
        const val = users[key]
        if (val.changed) {
            val.changed = false
            fs.writeFileSync(basePath + val.id + ".json", JSON.stringify(val, null, 2))
        }
    }
}

setInterval(SaveData, 60000)

const out = {GetUser, UserMessage, SaveData, SetOsuUsername, GetUserById}

// create a unique, global symbol name
// -----------------------------------

const Key = Symbol.for("database");

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