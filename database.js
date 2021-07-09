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
const BasePath = "./data/"
const UserPath = BasePath + "users/"
const CurrentVersion = 1.1

;(function() {
    let path = "."
    let split = UserPath.split("/")
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
        version: 1,
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

function PortToNewVersion(user) {
    if (!user.version) user.version = 1
    if (user.version < 1.1) {
        user.version = 1.1
        user.skeetkeyUses = 0
    }
    return user
}

function FromCache(id) {
    let out = users[id]
    if (out.version != CurrentVersion) out = PortToNewVersion(out)
    return out
}

/**
 * @param {Message} msg 
 * @returns {Promise<User>}
 */
async function GetUser(msg) {
    let id = msg.author.id
    if (users[id]) return FromCache(id)
    if (fs.existsSync(UserPath + id + ".json")) {
        let data = fs.readFileSync(UserPath + id + ".json")
        try {
            data = JSON.parse(data)
            if (data.version != CurrentVersion) data = PortToNewVersion(data)
            users[id] = data
            return data
        } catch (err) {
            print("Error reading file - " + UserPath + id + ".json")
            data = CreateUser(msg)
            fs.writeFileSync(UserPath + id + ".json", JSON.stringify(data))
            users[id] = data
            return data
        }
    }
    let data = CreateUser(msg)
    fs.writeFileSync(UserPath + id + ".json", JSON.stringify(data))
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
            fs.writeFileSync(UserPath + val.id + ".json", JSON.stringify(val, null, 2))
        }
    }
}

setInterval(SaveData, 60000)

module.exports = {GetUser, UserMessage, SaveData, SetOsuUsername, GetUserById}