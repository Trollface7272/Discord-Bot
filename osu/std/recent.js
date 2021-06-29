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
    let profile = await utils.GetProfileFromCache(args.Name, args.Flags.m)
    if (typeof profile == "string") return profile

    let recent = await utils.GetRecent(profile.name, args.Flags.m)
    if (typeof recent == "string") return recent
    
    let mostRecent = recent[0]

    let beatmap = await utils.GetMap(mostRecent.beatmapId, args.Flags.m, utils.RemoveNonDiffMods(mostRecent.raw_mods))
    if (typeof beatmap == "string") return beatmap

    let tries = 0
    for (let i = 0; i < recent.length; i++) {
        if (recent[i].beatmapId === mostRecent.beatmapId) tries++
        else break
    }

    let fcppDisplay = ""
    if (mostRecent.maxCombo < beatmap.maxCombo - 15 || mostRecent.counts.miss > 0) fcppDisplay = `(${utils.RoundFixed(await calculator.GetFcPP(mostRecent))}pp for ${utils.RoundFixed(calculator.GetFcAcc(mostRecent) * 100)}% FC) `
    let description = 
`▸ ${emotes.GetEmote(mostRecent.rank)} ▸ **${utils.RoundFixed(mostRecent.pp < 0.01 ? await calculator.GetPlayPP(mostRecent) : mostRecent.pp)}pp** ${fcppDisplay}▸ ${utils.RoundFixed(utils.CalculateAcc(mostRecent.counts) * 100)}%
▸ ${utils.CommaFormat(mostRecent.score)} ▸ x${mostRecent.maxCombo}/${beatmap.maxCombo} ▸ [${mostRecent.counts[300]}/${mostRecent.counts[100]}/${mostRecent.counts[50]}/${mostRecent.counts.miss}]`
    
    if (beatmap.objects.normal + beatmap.objects.slider + beatmap.objects.spinner !== mostRecent.counts[300] + mostRecent.counts[100] + mostRecent.counts[50] + mostRecent.counts.miss)
        description += `\n▸ **Map Completion:** ${utils.RoundFixed((mostRecent.counts[300] + mostRecent.counts[100] + mostRecent.counts[50] + mostRecent.counts.miss) / (beatmap.objects.normal + beatmap.objects.slider + beatmap.objects.spinner) * 100)}%`


    return new 
    DiscordJS.MessageEmbed()
        .setAuthor(`${beatmap.title} [${beatmap.version}] +${utils.ModsFromRaw(mostRecent.raw_mods)} [${utils.RoundFixed(beatmap.difficulty.rating)}★]`, utils.GetProfileImage(profile.id), utils.GetMapLink(beatmap.id))
        .setThumbnail(utils.GetMapImage(beatmap.beatmapSetId))
        .setDescription(description)
        .setFooter(`Try #${tries} | ${utils.DateDiff(new moment(mostRecent.date), new moment(Date.now()))}Ago ${utils.GetServer()}`)

}

/**
 * @param {Command} args 
 */
async function Best(args) {
    let profile = await utils.GetProfile(args.Name, args.Flags.m)
    if (typeof profile == "string") return profile

    let scores = await utils.GetTopScores(args.Name, args.Flags.m)
    if (typeof scores == "string") return scores

    utils.IndexScores(scores)

    utils.SortByDate(scores, args.Flags.rv)

    let score = scores[0]

    let map = await utils.GetMap(score.beatmapId, args.Flags.m, score.raw_mods)

    let fcppDisplay = ""
    if (score.maxCombo < map.maxCombo - 15 || score.counts.miss > 0 && mode !== 3) fcppDisplay = `(${utils.RoundFixed(await calculator.GetFcPP(score))}pp for ${utils.RoundFixed(calculator.GetFcAcc(score) * 100)}% FC) `

    let description = `
**${score.index}. [${map.title} [${map.version}]](${utils.GetMapLink(map.id)}) +${utils.ModsFromRaw(score.raw_mods)}** [${utils.RoundFixed(map.difficulty.rating)}★]
▸ ${emotes.GetEmote(score.rank)} ▸ **${utils.RoundFixed(score.pp)}pp** ${fcppDisplay}▸ ${utils.RoundFixed(utils.CalculateAcc(score.counts) * 100)}%
▸ ${utils.CommaFormat(score.score)} ▸ x${score.maxCombo}/${map.maxCombo} ▸ [${score.counts[300]}/${score.counts[100]}/${score.counts[50]}/${score.counts.miss}]
▸ Score Set ${utils.DateDiff(new moment(score.date), new moment(Date.now()))}Ago`
    return new
        DiscordJS.MessageEmbed()
            .setAuthor(`Top ${score.index} ${utils.ModNames.Name[args.Flags.m]} Play for ${profile.name}`, utils.GetFlagUrl(profile.country), utils.GetProfileLink(profile.id, args.Flags.m))
            .setDescription(description)
            .setFooter(utils.GetServer())
            .setThumbnail(utils.GetProfileImage(profile.id))
}

/**
 * @param {Command} args 
 */
async function BestGreaterThen(args) {
    let profile = await utils.GetProfile(args.Name, args.Flags.m)
    if (typeof profile == "string") return profile

    let scores = await utils.GetTopScores(args.Name, args.Flags.m)
    if (typeof scores == "string") return scores

    utils.IndexScores(scores)

    scores = utils.FilterByPP(scores, args.Flags.g)

    utils.SortByDate(scores, args.Flags.rv)

    let score = scores[0]

    let map = await utils.GetMap(score.beatmapId, args.Flags.m, score.raw_mods)

    let fcppDisplay = ""
    if (score.maxCombo < map.maxCombo - 15 || score.counts.miss > 0 && mode !== 3) fcppDisplay = `(${utils.RoundFixed(await calculator.GetFcPP(score))}pp for ${utils.RoundFixed(calculator.GetFcAcc(score) * 100)}% FC) `

    let description = `
**${score.index}. [${map.title} [${map.version}]](${utils.GetMapLink(map.id)}) +${utils.ModsFromRaw(score.raw_mods)}** [${utils.RoundFixed(map.difficulty.rating)}★]
▸ ${emotes.GetEmote(score.rank)} ▸ **${utils.RoundFixed(score.pp)}pp** ${fcppDisplay}▸ ${utils.RoundFixed(utils.CalculateAcc(score.counts) * 100)}%
▸ ${utils.CommaFormat(score.score)} ▸ x${score.maxCombo}/${map.maxCombo} ▸ [${score.counts[300]}/${score.counts[100]}/${score.counts[50]}/${score.counts.miss}]
▸ Score Set ${utils.DateDiff(new moment(score.date), new moment(Date.now()))}Ago`
    return new
        DiscordJS.MessageEmbed()
            .setAuthor(`Top ${score.index} ${utils.ModNames.Name[args.Flags.m]} Play for ${profile.name}`, utils.GetFlagUrl(profile.country), utils.GetProfileLink(profile.id, args.Flags.m))
            .setDescription(description)
            .setFooter(utils.GetServer())
            .setThumbnail(utils.GetProfileImage(profile.id))
}

module.exports = {Normal, Best, BestGreaterThen}