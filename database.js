const
    sql = require("mssql")
let data = {
    users: [],
    servers: [],
    tracked: []
}
let loaded = false;

class Database {
    async constructor() {
        await SelectData()
        setInterval(UpdateData, 600000)
    }

    CheckIfNew(discordId, discordName, serverId, serverName) {
        if (loaded) {
            if (!data.users[discordId])  // noinspection JSIgnoredPromiseFromCall
                InsertUsersData(discordId, discordName)
            if (!data.servers[serverId]) // noinspection JSIgnoredPromiseFromCall
                InsertServersData(serverId, serverName)
        } else
            setTimeout(() => {
                this.CheckIfNew(discordId, discordName)
            }, 5000)
    }

    async UpdateNow() {
        await UpdateData()
    }

    NewMessage(userId, userName, serverId, serverName) {
        data.users[userId].messages++
        data.users[userId].changed = true
        if (data.users[userId].discord_name !== userName) data.users[userId].discord_name = userName

        data.servers[serverId].messages++
        data.servers[serverId].changed = true
        if (data.servers[serverId].discord_name !== serverName) data.servers[serverId].discord_name = serverName
    }

    async SetOsuUsername(discordId, username) {
        await SetOsuUsername(discordId, username)
    }

    GetOsuName(discordId) {
        return data.users[discordId].osu_username || "Not Found"
    }

    GetTrackedUsers() {
        return data.tracked
    }

    async AddToTracking(userId, channelId, serverId, osuName, mode, limit) {
        await AddTracking(userId, channelId, serverId, osuName, mode, limit)
    }
}

module.exports = Database

async function InsertUsersData(id, name) {
    await Connect()
    try {
        await sql.query`
    INSERT INTO users
        (discord_id, discord_name, messages) 
        VALUES 
        (${id}, ${name}, 1);
    `
    } catch (err) {
    }
    await SelectData()
}

async function InsertServersData(id, name) {
    await Connect()
    try {
        await sql.query`
    INSERT INTO servers
        (discord_id, discord_name, messages) 
        VALUES 
        (${id}, ${name}, 1);
    `
    } catch (err) {
    }
    await SelectData()
}

async function UpdateData() {
    await Connect()
    for (let index in data.users) {
        // noinspection JSUnfilteredForInLoop
        const el = data.users[index]
        if (el.changed) {
            await sql.query`UPDATE users SET messages=${el.messages} discord_name=${el.discord_name} WHERE id=${el.id}`
            // noinspection JSUnfilteredForInLoop
            data.users[index].changed = false
        }
    }
    for (let index in data.servers) {
        // noinspection JSUnfilteredForInLoop
        let el = data.servers[index]
        if (el.changed) {
            await sql.query`UPDATE servers SET messages=${el.messages} WHERE id=${el.id}`
        }
    }
}


async function SelectData() {
    await Connect()
    let result = (await sql.query`SELECT *
                                  FROM users;`).recordset;
    result.forEach(el => {
        el.changed = false
        data.users[el["discord_id"]] = el
    })
    result = await sql.query`SELECT *
                             FROM servers;`
    result.forEach(el => {
        el.changed = false
        data.servers[el["discord_id"]] = el
    })
    result = await sql.query`SELECT *
                             FROM tracking
                                      JOIN tracked_users ON tracking.id_tu = tracked_users.id_tu
                                      JOIN servers ON tracking.id_ser = servers.id_ser;`
    result.forEach(el => {
        el.changed = false
        data.tracked[el["id_trc"]] = el
    })
    loaded = true
}

async function SetOsuUsername(discordId, username) {
    await Connect()
    await sql.query`UPDATE users SET osu_username=${username} WHERE discord_id=${discordId}`
    data.users[discordId].osu_username = username
}

async function AddTracking(userId, channelId, serverId, osuName, mode, limit) {
    await Connect()
    let id = await (sql.query`SELECT id_tu FROM tracked_users WHERE osu_id = ${userId}`).recordset[0]["id_tu"]
    if (!id) await (sql.query`INSERT INTO tracked_users (osu_id, osu_name) VALUES (${userId}, ${osuName})`)
    id = await (sql.query`SELECT id_tu FROM tracked_users WHERE osu_id = ${userId}`).recordset[0]["id_tu"]
    await (sql.query`INSERT INTO tracking (id_ser, id_tu, channel_id, gamemode, limit) VALUES (${data.servers[serverId]["id_ser"]}, ${id}, ${channelId}, ${mode}, ${limit})`)
    await SelectData()
}

async function Connect() {
    await sql.connect("mssql://Cheeseadmin:Trollface7272@cheeseserver.database.windows.net:1433/cheesegaming?encrypt=true")
}
