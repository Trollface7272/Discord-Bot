const DiscordJS = require("discord.js")
const client = new DiscordJS.Client()
const prefix = "."
const print = console.log
const MANAGE_ROLES = 1 << 28
var cache = { }


client.on("ready", () => {
    print(`Logged in as ${client.user.tag}`)
    client.api.applications(client.user.id).commands.post({data: {
        name: 'retard',
        "options": [
            {
              "type": 6,
              "name": "who",
              "description": "nn",
              "required": true
            }
        ],
        description: 'What a retard'
    }})
})

client.ws.on('INTERACTION_CREATE', async interaction => {
    if (!(interaction.member.permissions & MANAGE_ROLES)) 
    return client.api.interactions(interaction.id, interaction.token).callback.post({data: {
        type: 4,
        data: {
            content: 'Missing permissions'
        }
    }})
    let member = Object.values(interaction.data.resolved.members)[0]
    member.id = Object.keys(interaction.data.resolved.members)[0]

    let roles = await GetRoles(interaction.guild_id)
    let resp = GetRetardResponse(await HandleRoleAddInteraction(roles, member, interaction.guild_id))

    client.api.interactions(interaction.id, interaction.token).callback.post({data: {
        type: 4,
        data: {
            content: resp
        }
    }})
})

client.on("message", async message => {
    if (message.content.toLocaleLowerCase().startsWith(prefix + "skeetkey")) return message.channel.send(GetSkeetKey())
    if (!message.content.toLocaleLowerCase().startsWith(prefix + "retard")) return
    if (!message.member.hasPermission("MANAGE_ROLES")) return

    let mentions = message.mentions.members.array()
    if (mentions.length < 1) return message.channel.send("Specify user")

    let retard = await GetRoles(message.guild.id)

    for (let i = 0; i < mentions.length; i++) {
        const user = mentions[i]
        let resp = await HandleRoleAddMessage(retard, user)
        resp = GetRetardResponse(resp)
        message.channel.send(resp)
    }
})


function GetSkeetKey() {
    return `GIFT-${RandString(5)}-${RandString(5)}-${RandString(5)}`
}

function RandString(len) {
    const list = "ABCDEFGHIJKLMNPQRSTUVWXYZ";
    var res = "";
    for(var i = 0; i < len; i++) {
        var rnd = Math.floor(Math.random() * list.length);
        res = res + list.charAt(rnd);
    }
    return res;
}

async function GetRoles(serverId) {
    if (cache[serverId]) return cache[serverId]
    let roles = client.guilds.cache.get(serverId).roles.cache
    let o = [
        roles.find(r => r.name === "Retard"),
        roles.find(r => r.name === "Troglodyte"),
        roles.find(r => r.name === "Ameba"),
        roles.find(r => r.name === "Braindead"),
    ]
    cache[serverId] = o
    return o
}

async function GetUser(user, server) {
    let guild = client.guilds.cache.get(server)
    let member = guild.members.cache.get(user)

    return member || await guild.members.fetch(user)
}

function GetRetardResponse(response) {
    switch (response.code) {
        case 0: return `Successfully set **${response.username}'s** role to \`${response.role}\`.`
        case 1: return `**${response.username}** already has the highest role.`
        case 2: return `Can't change roles of **${response.username}** - Not enough permissions.`
        case 999: return `Unhandled error - ${response.message}`
        default: return `Unknown error formatting response.`
    }
}

async function GetGuild(server) {
    return client.guilds.fetch(server)
}

/**
 * 
 * @param {Array} retard 
 * @param {DiscordJS.GuildMember} member 
 * @returns 
 */
 async function HandleRoleAddMessage(retard, member) {
    for (let j = 0; j < retard.length; j++) {
        const role = retard[j]
        if (member.roles.cache.find(r => r.name == role.name)) {
            if (j < retard.length - 1) {
                try {
                    await member.roles.remove(role)
                    await member.roles.add(retard[j+1])
                    return { username: member.user.username, role: retard[j+1].name, code: 0 }
                } catch (err) {
                    return HandleError(err, member)
                }
            }
            return { username: member.user.username, role: retard[j].name, code: 1 }
        }
    }
    try {
        await member.roles.add(retard[0])
        return { username: member.user.username, role: retard[0].name, code: 0 }
    } catch (err) { return HandleError(err, member) }
}

/**
 * 
 * @param {Array<DiscordJS.Role>} retard 
 * @param {Object} user 
 * @param {String} guild 
 * @returns 
 */
async function HandleRoleAddInteraction(retard, user, guild) {
    let member = await GetUser(user.id, guild)
    for (let j = 0; j < retard.length; j++) {
        const role = retard[j]
        if (user.roles.includes(role.id)) {
            if (j < retard.length - 1) {
                try {
                    await member.roles.remove(role)
                    await member.roles.add(retard[j+1])
                    return { username: member.user.username, role: retard[j+1].name, code: 0 }
                } catch (err) {
                    return HandleError(err, member)
                }
            }
            return { username: member.user.username, role: retard[j].name, code: 1 }
        }
    }
    try {
        await member.roles.add(retard[0])
        return { username: member.user.username, role: retard[0].name, code: 0 }
    } catch (err) { return HandleError(err, member) }
}

/**
 * 
 * @param {DiscordJS.DiscordAPIError} err
 * @param {DiscordJS.GuildMember} member
 */
function HandleError(err, member) {
    if (err.message.includes("Missing Permissions")) {
        return { username: member.user.username, code: 2 }
    }
    print(err.message)
    return { message: err.message, code: 999 }
}

client.login(process.env.token || `NTg0MzIxMzY2MzA4ODE0ODQ4.XPJNrQ._bPg104X-oY2l4mQ0ET9CwpuIzI`).then(() => {
})