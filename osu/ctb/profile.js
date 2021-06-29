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

const utils = require ("../osu-utils")
const DiscordJS = require("discord.js")
const print = console.log
/**
 * 
 * @param {Command} args 
 * @returns 
 */
async function Normal(args) {
    const profile = await utils.GetProfile(args.Name, args.Flags.m)
    if (typeof profile == "string") return profile

    const level = ((profile.level - Math.floor(profile.level)).toFixed(4) * 100).toFixed(2)
    const pp    = utils.RoundFixed(profile.pp.raw)
    const acc   = utils.RoundFixed(profile.accuracy, 2)

    const desc  =
`**▸ Official Rank:** #${utils.CommaFormat(profile.pp.rank)} (${profile.country}#${profile.pp.countryRank})
**▸ Level:** ${parseInt(profile.level)} (${level}%)
**▸ Total PP:** ${utils.CommaFormat(pp)}
**▸ Hit Accuracy:** ${acc}%
**▸ Playcount:** ${utils.CommaFormat(profile.counts.plays)}`

    return new DiscordJS.MessageEmbed()
    .setAuthor(`${utils.ModNames.Name[args.Flags.m]} Profile for ${profile.name}`, utils.GetFlagUrl(profile.country), utils.GetProfileLink(profile.id, args.Flags.m))
    .setDescription(desc)
    .setFooter(utils.GetServer())
    .setThumbnail(utils.GetProfileImage(profile.id))
}

module.exports = {Normal}