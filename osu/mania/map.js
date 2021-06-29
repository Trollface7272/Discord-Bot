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
 * @property {(false|Number)} mods
 * @property {(false|Number)} acc
 * @property {(false|Number)} map
 */

const utils = require("../osu-utils")
const DiscordJS = require("discord.js")
const moment = require("moment")
const emotes = require("../../emotes").instance
const calc = require("./calculator")
const calculator = new calc()
const print = console.log


/**
 * 
 * @param {Command} args 
 * @returns 
 */
async function Normal(args) {
    if (!args.Flags.map) return "**🔴 Map not found.**"
    let mods = 0
    if (args.Flags.mods) mods = calculator.ParseMods(args.Flags.mods)
    let beatmap = await utils.GetMap(args.Flags.map, args.Flags.m, mods)
    if (typeof beatmap == "string") return beatmap
    if (mods & utils.Mods.Bit.Easy || mods & utils.Mods.Bit.HardRock || mods & utils.Mods.Bit.DoubleTime || mods & utils.Mods.Bit.HalfTime) beatmap.difficulty = calculator.GetDifficultyValues(beatmap.difficulty, mods)

    let description = `**Length:** ${utils.FillZeros(Math.floor(beatmap["length"].drain / 60))}:${utils.FillZeros(beatmap["length"].drain % 60)} `
    description += `**BPM:** ${beatmap.bpm} `
    description += `**Mods:** ${utils.ModsFromRaw(mods)}\n`
    description += `**Download:** [map](https://osu.ppy.sh/d/${beatmap.beatmapSetId})([no vid](https://osu.ppy.sh/d/${beatmap.beatmapSetId}n)) osu://b/${beatmap.beatmapSetId}\n`
    description += `**${emotes.GetDiffEmote(beatmap.difficulty.rating, args.Flags.m)}${beatmap.version}**\n`
    description += `▸**Difficulty:** ${utils.RoundFixed(beatmap.difficulty.rating)}★`
    description += `▸**Max Combo:** x${beatmap.maxCombo}\n`
    description += `▸**AR:** ${utils.Round(beatmap.difficulty.approach)}`
    description += `▸**OD:** ${utils.Round(beatmap.difficulty.overall)}`
    description += `▸**HP:** ${utils.Round(beatmap.difficulty.drain)}`
    description += `▸**CS:** ${utils.Round(beatmap.difficulty.size)}\n`
    description += `▸**PP:** `
    description += `○ **95%-**${utils.RoundFixed(await calculator.GetSpecificAccPP(beatmap, 95, mods))}`
    if (args.Flags.acc) description += `○ **${utils.Round(args.Flags.acc)}%-**${utils.RoundFixed(await calculator.GetSpecificAccPP(beatmap, args.Flags.acc, mods))}`
    else description += `○ **99%-**${utils.RoundFixed(await calculator.GetSpecificAccPP(beatmap, 99, mods))}`
    description += `○ **100%-**${utils.RoundFixed(await calculator.GetSpecificAccPP(beatmap, 100, mods))}`

    return new
    DiscordJS.MessageEmbed()
        .setAuthor(`${beatmap.artist} - ${beatmap.title} by ${beatmap.creator}`, ``, utils.GetMapLink(beatmap.id))
        .setThumbnail(utils.GetMapLink(beatmap.beatmapSetId))
        .setDescription(description)
        .setFooter(`${beatmap.approvalStatus} | ${beatmap.counts.favourites} ❤︎ | Approved ${beatmap.raw_approvedDate}`)
}

module.exports = {Normal}