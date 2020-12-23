const
    sql = require("mssql")
let data = {
    users: [],
    servers: [],
    tracked: [],
    trackedUsers: []
}
let loaded = false;

class Database {
    constructor() {
        SelectData()
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

    /**
     *
     * @returns {Object[]}
     */
    GetTrackedUsers() {
        return data.tracked
    }

    GetTrackedProfiles() {
        return data.trackedUsers
    }

    async AddToTracking(userId, channelId, serverId, osuName, mode, limit, pp, playPp, playMap, playScore, rank, countryRank) {
        await AddTracking(userId, channelId, serverId, osuName, mode, limit, pp, playPp, playMap, playScore, rank, countryRank)
    }

    UpdateTracking(id, pp, rank, countryRank, playPp, playMap, playScore) {
        UpdateTrack(id, pp, rank, countryRank, playPp, playMap, playScore)
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
    await UpdateData()
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
    await UpdateData()
    await SelectData()
}

async function UpdateData() {
    await Connect()
    for (let index in data.users) {
        // noinspection JSUnfilteredForInLoop
        const el = data.users[index]
        if (el.changed) {
            await sql.query`UPDATE users 
                                SET messages=${el.messages}, discord_name=${el.discord_name} 
                                WHERE id=${el.id}`
            // noinspection JSUnfilteredForInLoop
            data.users[index].changed = false
        }
    }
    for (let index in data.servers) {
        // noinspection JSUnfilteredForInLoop
        let el = data.servers[index]
        if (el.changed) {
            await sql.query`UPDATE servers 
                                SET messages=${el.messages} 
                                WHERE id_ser=${el.id_ser}`
        }
    }
}

async function SelectData() {
    await Connect()

    await SelectUsers()
    await SelectServers()
    await SelectTracking()
    await SelectTrackedUsers()

    loaded = true
}
async function SelectUsers() {
    await Connect()
    let result = (await sql.query`SELECT *
                                  FROM users;`).recordset;
    result.forEach(el => {
        el.changed = false
        // noinspection JSUnresolvedVariable
        data.users[el.discord_id] = el
    })
}
async function SelectServers() {
    await Connect()
    result = (await sql.query`SELECT *
                             FROM servers;`).recordset
    result.forEach(el => {
        el.changed = false
        // noinspection JSUnresolvedVariable
        data.servers[el.discord_id] = el
    })
}
async function SelectTracking() {
    await Connect()
    result = (await sql.query`SELECT *
                             FROM tracking
                                      JOIN tracked_users ON tracking.id_tu = tracked_users.id_tu
                                      JOIN servers ON tracking.id_ser = servers.id_ser;`).recordset
    result.forEach(el => {
        el.changed = false
        // noinspection JSUnresolvedVariable
        data.tracked.push(el)
    })
}
async function SelectTrackedUsers() {
    await Connect()
    result = (await sql.query`SELECT * FROM tracked_users`).recordset

    result.forEach(el => {
        el.changed = false
        // noinspection JSUnresolvedVariable
        data.trackedUsers.push(el)
    })
}

async function SetOsuUsername(discordId, username) {
    await Connect()
    await sql.query`UPDATE users 
                        SET osu_username=${username} 
                        WHERE discord_id=${discordId}`
    data.users[discordId].osu_username = username
}

async function AddTracking(userId, channelId, serverId, osuName, mode, limit, pp, playPp, playMap, playScore, rank, countryRank) {
    await Connect()
    let result = await sql.query`EXEC AddUserToTracking 
                                    @user_id      = ${userId}, 
                                    @channel_id   = ${channelId}, 
                                    @server_id    = ${serverId}, 
                                    @osu_name     = ${osuName}, 
                                    @mode         = ${mode}, 
                                    @limit        = ${limit},
                                    @pp           = ${pp},
                                    @play_pp      = ${playPp},
                                    @play_map     = ${playMap},
                                    @play_score   = ${playScore},
                                    @rank         = ${rank},
                                    @country_rank = ${countryRank}`
    data.tracked[result.id_trc] = result
}
async function UpdateTrack(id, pp, rank, countryRank, playPp, playMap, playScore) {
    sql.query`EXEC update_tracked 
                            @pp             = ${pp},
                            @rank           = ${rank},
                            @country_rank   = ${countryRank},
                            @play_pp        = ${playPp},
                            @play_map       = ${playMap},
                            @play_score     = ${playScore},
                            @id_tu          = ${id}`
    SelectTrackedUsers()
}

async function Connect() {
    await sql.connect("mssql://Cheeseadmin:Trollface7272@cheeseserver.database.windows.net:1433/cheesegaming?encrypt=true")
}
