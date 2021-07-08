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

const utils = require("../osu-utils")
const DiscordJS = require("discord.js")
const database = require("../../database").instance
const Handles = {
    Profile : require("./profile"),
    Recent  : require("./recent"),
    Top     : require("./top"),
    Map     : require("./map"),
    Compare : require("./compare")
}
 /**
  * 
  * @param {Command} args
  * @returns {Promise<(DiscordJS.MessageEmbed|String)>} 
  */
async function Profile(args) {
    return await Handles.Profile.Normal(args)
}
 
 /**
  * 
  * @param {Command} args 
  * @returns {Promise<(DiscordJS.MessageEmbed|String)>} 
  */
async function Recent(args) {
    if (args.Flags.b && args.Flags.g) return await Handles.Recent.BestGreaterThen(args)
    if (args.Flags.b) return await Handles.Recent.Best(args)
    return await Handles.Recent.Normal(args)
}

/**
 * @param {Command} args 
 */
async function Top(args) {
    if (args.Flags.g && args.Flags.b) return await Handles.Top.RecentGreaterThan(args)
    if (args.Flags.p && args.Flags.b) return await Handles.Top.RecentSpecific(args)
    if (args.Flags.g) return await Handles.Top.GreaterThan(args)
    if (args.Flags.b) return await Handles.Top.Recent(args)
    if (args.Flags.p) return await Handles.Top.Specific(args)
    return await Handles.Top.Normal(args)
}

/**
 * @param {Command} args 
 */
async function Map(args) {
    return await Handles.Map.Normal(args)
}

/**
 * @param {Command} args 
 */
async function Compare(args) {
    return await Handles.Compare.Normal(args)
}

async function OsuSet(args) {
    return ["Successfully set your osu username to " + args.Name + ".", function(msg){database.SetOsuUsername(msg.author.id, args.Name)}]
}

module.exports = {utils, Profile, Recent, Top, Map, Compare, OsuSet}