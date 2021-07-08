const discord = require("discord.js")
/**
 * @typedef {Object} Args
 * @property {Channel} channel
 * @property {Guild} guild
 * @property {User} user
 * @property {Array<discord.GuildMember>} mentions
 * 
 * @typedef {Object} Channel
 * @property {String} id
 * 
 * @typedef {Object} Guild
 * @property {String} id
 * 
 * @typedef {Object} User
 * @property {String} id
 * @property {discord.GuildMember} raw_member
 * 
 * @typedef {Array<discord.Role>} RoleArray
 * 
 * @typedef {discord.Member} Member
 */

const globals = require("../globals").instance
const print = console.log
/**
 * 
 * @param {discord.Message} msg 
 * @param {Array<String>} args
 * @returns {Args}
 */
function ParseEverything(msg, args) {
    let out = {}
    out.channel = {
        id: msg.channel.id
    }
    out.guild = {
        id: msg.guild.id
    }
    out.user = {
        id: msg.author.id,
        raw_member: msg.member
    }
    out.mentions = []
    let mentions = msg.mentions.members.array()

    for (let i = 0; i < mentions.length; i++) out.mentions[out.mentions.length] = mentions[i]

    return out
}

/**
 * 
 * @param {*} interaction 
 */
function ParseEverythingSlash(interaction) {
    let out = {}
    out.channel = {
        id: interaction.channel_id
    }
    out.guild = {
        id: interaction.guild_id
    }
    out.user = {
        id: interaction.member.user.id,
        raw: interaction.member.user
    }
    out.user.raw.roles = interaction.member.roles
    out.resolved = Object.values(interaction.data.resolved.members)[0]
    out.resolved.id = Object.keys(interaction.data.resolved.members)[0]
    out.mentions = []
    return out
}

let RetardRolesCache = {}
async function GetRetardRoles(serverId) {
    if (RetardRolesCache[serverId]) return RetardRolesCache[serverId]
    let roles = globals.client.guilds.cache.get(serverId).roles.cache
    let o = [
        roles.find(r => r.name === "Retard"),
        roles.find(r => r.name === "Troglodyte"),
        roles.find(r => r.name === "Ameba"),
        roles.find(r => r.name === "Braindead"),
    ]
    RetardRolesCache[serverId] = o
    return o
}

module.exports = { GetRetardRoles, ParseEverything, ParseEverythingSlash }