const utils = require("../moderation-utils")
const globals = require("../../globals").instance
const print = console.log
const MANAGE_ROLES = 1 << 28

/**
 * @param {utils.Args} args 
 */
 async function Main(args, slash=false) {
    let roles = await utils.GetRetardRoles(args.guild.id)
    let resp = slash ? (await AddRolesSlash(roles, args.resolved, args.guild.id)) : (await AddRoles(roles, args))
    return [ParseResponse(resp)]
}

/**
 * @param {utils.RoleArray} roles 
 * @param {utils.Member} member 
 * @param {utils.Args} args 
 * @returns 
 */
async function AddRoles(roles, args) {
    if (!args.user.raw_member.hasPermission("MANAGE_ROLES")) return { username: member.user.username, role: roles[j].name, code: 2 }
    let member = args.mentions[0]
    if (!member) return { code: 3 }
    for (let j = 0; j < roles.length; j++) {
        const role = roles[j]
        if (member.roles.cache.find(r => r.name == role.name)) {
            if (j < roles.length - 1) {
                try {
                    await member.roles.remove(role)
                    await member.roles.add(roles[j+1])
                    return { username: member.user.username, role: roles[j+1].name, code: 0 }
                } catch (err) {
                    return HandleError(err, member)
                }
            }
            return { username: member.user.username, role: role.name, code: 1 }
        }
    }
    try {
        await member.roles.add(roles[0])
        return { username: member.user.username, role: roles[0].name, code: 0 }
    } catch (err) { return HandleError(err, member) }
}

/**
 * @param {Array<DiscordJS.Role>} roles 
 * @param {Object} user 
 * @param {String} guild 
 * @returns 
 */
async function AddRolesSlash(roles, user, guild) {
    let member = await GetUser(user.id, guild)
    for (let j = 0; j < roles.length; j++) {
        const role = roles[j]
        if (user.roles.includes(role.id)) {
            if (j < roles.length - 1) {
                try {
                    await member.roles.remove(role)
                    await member.roles.add(roles[j+1])
                    return { username: member.user.username, role: roles[j+1].name, code: 0 }
                } catch (err) {
                    return HandleError(err, member)
                }
            }
            return { username: member.user.username, role: roles[j].name, code: 1 }
        }
    }
    try {
        await member.roles.add(roles[0])
        return { username: member.user.username, role: roles[0].name, code: 0 }
    } catch (err) { return HandleError(err, member) }
}

/**
 * @param {String} user 
 * @param {String} server 
 * @returns 
 */
async function GetUser(user, server) {
    let guild = globals.client.guilds.cache.get(server)
    let member = guild.members.cache.get(user)

    return member || await guild.members.fetch(user)
}

function ParseResponse(response) {
    switch (response.code) {
        case 0: return `Successfully set **${response.username}'s** role to \`${response.role}\`.`
        case 1: return `**${response.username}** already has the highest role.`
        case 2: return `Can't change roles of **${response.username}** - Not enough permissions.`
        case 3: return `No user mentioned.`
        case 999: return `Unhandled error - ${response.message}`
        default: return `Unknown error formatting response.`
    }
}

/**
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



module.exports = {Main}