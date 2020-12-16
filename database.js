const 
      sql = require("mssql")
      let data = []
var loaded = false
class Database {
    constructor() {
        SelectData()
        setInterval(UpdataData, 60000)
    }
    CheckIfNew(discordId, discordName) {
        if (loaded)
            if (!data[discordId]) InsertData(discordId, discordName)
        else 
            setTimeout(()=>{this.CheckIfNew(discordId, discordName)}, 5000)
    }
    async UpdateNow() {
        await UpdataData()
    }
    NewMessage(discordId, discordName) {
        data[discordId].messages++
        data[discordId].changed = true
        if (data[discordId].discord_name != discordName) data[discordId].discord_name = discordName
    }
    SetOsuUsername(discordId, username) {
        SetOsuUsername(discordId, username)
    }
    GetOsuName(discordId) {
        return data[discordId].osu_username || "Not Found"
    }
}
module.exports = Database

async function InsertData(discordId, discordName) {
    await Connect()
    try {
    await sql.query`
    INSERT INTO users
        (discord_id, discord_name, messages) 
        VALUES 
        (${discordId}, ${discordName}, 1);
    `
    } catch(err) {}
    SelectData()
}
async function UpdataData() {
    await Connect()
    for(index in data) {
        el = data[index]
        if (el.changed) {
            await sql.query`UPDATE users SET messages=${el.messages} WHERE id=${el.id}`
            data[index].changed = false
        }
    }
}
async function SelectData() {
    await Connect()
    const result = (await sql.query`SELECT * FROM users;`).recordset
    result.forEach(el => {
        el.changed = false
        data[el.discord_id] = el
    })
    loaded = true
}
async function SetOsuUsername(discordId, username) {
    await Connect()
    await sql.query`UPDATE users SET osu_username=${username} WHERE discord_id=${discordId}`
    data[discordId].osu_username = username
}


async function Connect() {
    await sql.connect("mssql://Cheeseadmin:Trollface7272@cheeseserver.database.windows.net:1433/cheesegaming?encrypt=true")
}
