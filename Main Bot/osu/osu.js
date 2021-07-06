/*
    TODO: r     -> std,taiko,ctb,mania
    TODO: top   -> std,taiko,ctb,mania
    TODO: c     -> std,taiko,ctb,mania
    TODO: map   -> std,taiko,ctb,mania
    TODO: sc    -> std,taiko,ctb,mania
    TODO: track -> std,taiko,ctb,mania
    TODO: osuset
    TODO: Database
    TODO: Profile Caching
*/
const Commands = {
    Profile : ["mania", "ctb", "taiko", "osu"],
    Recent  : ["r", "rs", "recent"],
    Top     : ["top", "ctbtop", "taikotop", "maniatop", "osutop"],
    Compare : ["c", "compare"],
    Map     : ["m", "map"],
    OsuSet  : ["osuset"],
    Track   : ["track"]

}

/**
 * @typedef  {Object} Command
 * @property {String} Name
 * @property {Flags} Flags
 * 
 * @typedef  {Object} Flags
 * @property {0|1|2|3} m
 * @property {Boolean} rv
 * @property {Boolean} b
 * @property {(false|Number)} g
 * @property {(false|Number)} p
 */

const DiscordJS = require("discord.js")
const print = console.log
const utils = require("./osu-utils")
const GamemodHandle = require("./commands/main")


/**
 * 
 * @param {String} cmd 
 * @param {Command} args 
 * @param {DiscordJS.message} msg 
 * @returns {Promise<DiscordJS.MessageEmbed|String>}
 */
async function Command(cmd, args, msg) {
    args = await utils.ParseArgs(args, cmd, msg)
    print(args)
    for (k in Commands) 
        if (Commands[k].indexOf(cmd) !== -1) 
            return await GamemodHandle[k](args)
            //try { return await eval(`${k}(${JSON.stringify(args)})`) } catch (err) { return HandleError(err, args) }
}

module.exports = {Command}