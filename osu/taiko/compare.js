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
 * @param {Command} args 
 * @returns 
 */
async function Normal(args) {
    let profile = await utils.GetProfileFromCache(args.Name, args.Flags.m)
    if (typeof profile == "string") return profile

    let scores = await utils.GetScores(profile.name, args.Flags.map, args.Flags.m)
    if (typeof scores == "string") return scores

    let beatmap = await utils.GetMap(args.Flags.map, args.Flags.m, args.Flags.mods)
    if (typeof beatmap == "string") return beatmap

    let descriptionArr = []
    for (let i = 0; i < scores.length; i++) {
        let score = scores[i]
        score.beatmapId = beatmap.id

        let fcppDisplay = ""
        if (score.maxCombo < beatmap.maxCombo - 15 || score.counts.miss > 0) fcppDisplay = `(${utils.RoundFixed(await calculator.GetFcPP(score))}pp for ${utils.RoundFixed(calculator.GetFcAcc(score) * 100)}% FC) `
        let description = `**${i + 1}.** \`${utils.ModsFromRaw(score.raw_mods)}\` **Score** [${utils.RoundFixed(await calculator.GetStarsWithMods(beatmap.id, score.raw_mods))}★]\n`
        description += `▸ ${emotes.GetEmote(score.rank)} ▸ **${utils.RoundFixed(score.pp)}pp** ${fcppDisplay}▸ ${utils.RoundFixed(utils.CalculateAcc(score.counts) * 100)}%\n`
        description += `▸ ${score.score} ▸ x${score.maxCombo}/${beatmap.maxCombo} ▸ [${score.counts[300]}/${score.counts[100]}/${score.counts[50]}/${score.counts.miss}]\n`
        description += `▸ Score Set ${utils.DateDiff(new moment(score.date), new moment(Date.now()))}Ago\n`
        descriptionArr.push(description)
    }
    let length = descriptionArr.length + 2
    for (let i = 0; i < length; i++) {
        if (descriptionArr[i] === undefined) descriptionArr[i] = ""
    }
    return new
    DiscordJS.MessageEmbed()
        .setAuthor(`Top ${utils.ModNames.Name[args.Flags.m]} Plays for ${profile.name} on ${beatmap.title} [${beatmap.version}]`, utils.GetProfileImage(profile.id), utils.GetMapLink(beatmap.id))
        .setDescription(descriptionArr[0] + descriptionArr[1] + descriptionArr[2])
        .setThumbnail(utils.GetMapImage(beatmap.beatmapSetId))
        .setFooter("On osu! Official Server | Page 1 of 1")
}

module.exports = {Normal}