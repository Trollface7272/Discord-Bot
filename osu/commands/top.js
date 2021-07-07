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
 * @param {Command} args 
 * @returns 
 */
async function Normal(args) {
    let profile = await utils.GetProfileFromCache(args.Name, args.Flags.m)
    if (typeof profile == "string") return profile

    let scores = await utils.GetTopScores(args.Name, args.Flags.m)
    if (typeof scores == "string") return scores

    utils.IndexScores(scores)

    if (args.Flags.rv) {
        let out = []
        console.log(scores.length);
        for (let i = scores.length-1; i >= 0; i--) {
            out.push(scores[i])
        }
        scores = out
    }
    
    let description = ""
    for (let i = 0; i < Math.min(scores.length, 5); i++) {
        const score = scores[i]

        let map = await utils.GetMap(score.beatmapId, args.Flags.m, score.mods)

        let fcppDisplay = ""
        if (score.maxCombo < map.maxCombo - 15 || score.counts.miss > 0 &&  args.Flags.m !== 3) fcppDisplay = `(${utils.RoundFixed(await calculator.GetFcPP(score))}pp for ${utils.RoundFixed(calculator.GetFcAcc(score) * 100)}% FC) `

        description += 
`**${score.index}. [${map.title} [${map.version}]](${utils.GetMapLink(map.id)}) +${utils.ModsFromRaw(score.raw_mods)}** [${utils.RoundFixed(await calculator.GetStarsWithMods(map.id, score.raw_mods))}★]
▸ ${emotes.GetEmote(score.rank)} ▸ **${utils.RoundFixed(score.pp)}pp** ${fcppDisplay}▸ ${utils.RoundFixed(utils.CalculateAcc(score.counts) * 100)}%
▸ ${utils.CommaFormat(score.score)} ▸ x${score.maxCombo}/${map.maxCombo} ▸ [${score.counts[300]}/${score.counts[100]}/${score.counts[50]}/${score.counts.miss}]
▸ Score Set ${utils.DateDiff(new moment(score.date), new moment(Date.now()))}Ago\n`
    }
    return new
    DiscordJS.MessageEmbed()
        .setAuthor(`Top ${Math.min(scores.length, 5)} ${utils.ModNames.Name[args.Flags.m]} Plays for ${profile.name}`, utils.GetFlagUrl(profile.country), utils.GetProfileLink(profile.id, args.Flags.m))
        .setDescription(description)
        .setFooter(utils.GetServer())
        .setThumbnail(utils.GetProfileImage(profile.id))
}

/**
 * @param {Command} args 
 */
async function Specific(args) {
    let profile = await utils.GetProfileFromCache(args.Name, args.Flags.m)
    if (typeof profile == "string") return profile

    let scores = await utils.GetTopScores(args.Name, args.Flags.m)
    if (typeof scores == "string") return scores

    utils.IndexScores(scores)

    let out = []
    for (let i = 0; i < args.Flags.p.length; i++) {
        out.push(scores[args.Flags.p[i]])
    }
    scores = out

    
    let description = ""
    for (let i = 0; i < Math.min(scores.length, 5); i++) {
        const score = scores[i]

        let map = await utils.GetMap(score.beatmapId, args.Flags.m, score.mods)

        let fcppDisplay = ""
        if (score.maxCombo < map.maxCombo - 15 || score.counts.miss > 0 &&  args.Flags.m !== 3) fcppDisplay = `(${utils.RoundFixed(await calculator.GetFcPP(score))}pp for ${utils.RoundFixed(calculator.GetFcAcc(score) * 100)}% FC) `

        description += 
`**${score.index}. [${map.title} [${map.version}]](${utils.GetMapLink(map.id)}) +${utils.ModsFromRaw(score.raw_mods)}** [${utils.RoundFixed(await calculator.GetStarsWithMods(map.id, score.raw_mods))}★]
▸ ${emotes.GetEmote(score.rank)} ▸ **${utils.RoundFixed(score.pp)}pp** ${fcppDisplay}▸ ${utils.RoundFixed(utils.CalculateAcc(score.counts) * 100)}%
▸ ${utils.CommaFormat(score.score)} ▸ x${score.maxCombo}/${map.maxCombo} ▸ [${score.counts[300]}/${score.counts[100]}/${score.counts[50]}/${score.counts.miss}]
▸ Score Set ${utils.DateDiff(new moment(score.date), new moment(Date.now()))}Ago\n`
    }
    return new
    DiscordJS.MessageEmbed()
        .setAuthor(`Specific ${utils.ModNames.Name[args.Flags.m]} Top Play${scores.length > 1 ? "s" : ""} for ${profile.name}`, utils.GetFlagUrl(profile.country), utils.GetProfileLink(profile.id, args.Flags.m))
        .setDescription(description)
        .setFooter(utils.GetServer())
        .setThumbnail(utils.GetProfileImage(profile.id))
}

/**
 * @param {Command} args 
 */
async function Recent(args) {
    let profile = await utils.GetProfileFromCache(args.Name, args.Flags.m)
    if (typeof profile == "string") return profile

    let scores = await utils.GetTopScores(args.Name, args.Flags.m)
    if (typeof scores == "string") return scores

    utils.IndexScores(scores)

    utils.SortByDate(scores, args.Flags.rv)
    
    let description = ""
    for (let i = 0; i < Math.min(scores.length, 5); i++) {
        const score = scores[i]

        let map = await utils.GetMap(score.beatmapId, args.Flags.m, score.mods)

        let fcppDisplay = ""
        if (score.maxCombo < map.maxCombo - 15 || score.counts.miss > 0 &&  args.Flags.m !== 3) fcppDisplay = `(${utils.RoundFixed(await calculator.GetFcPP(score))}pp for ${utils.RoundFixed(calculator.GetFcAcc(score) * 100)}% FC) `

        description += 
`**${score.index}. [${map.title} [${map.version}]](${utils.GetMapLink(map.id)}) +${utils.ModsFromRaw(score.raw_mods)}** [${utils.RoundFixed(await calculator.GetStarsWithMods(map.id, score.raw_mods))}★]
▸ ${emotes.GetEmote(score.rank)} ▸ **${utils.RoundFixed(score.pp)}pp** ${fcppDisplay}▸ ${utils.RoundFixed(utils.CalculateAcc(score.counts) * 100)}%
▸ ${utils.CommaFormat(score.score)} ▸ x${score.maxCombo}/${map.maxCombo} ▸ [${score.counts[300]}/${score.counts[100]}/${score.counts[50]}/${score.counts.miss}]
▸ Score Set ${utils.DateDiff(new moment(score.date), new moment(Date.now()))}Ago\n`
    }
    return new
    DiscordJS.MessageEmbed()
        .setAuthor(`Recent ${Math.min(scores.length, 5)} ${utils.ModNames.Name[args.Flags.m]} Top Play${scores.length > 1 ? "s" : ""} for ${profile.name}`, utils.GetFlagUrl(profile.country), utils.GetProfileLink(profile.id, args.Flags.m))
        .setDescription(description)
        .setFooter(utils.GetServer())
        .setThumbnail(utils.GetProfileImage(profile.id))
}

/**
 * @param {Command} args 
 */
async function RecentSpecific(args) {
    let profile = await utils.GetProfileFromCache(args.Name, args.Flags.m)
    if (typeof profile == "string") return profile

    let scores = await utils.GetTopScores(args.Name, args.Flags.m)
    if (typeof scores == "string") return scores

    utils.IndexScores(scores)

    utils.SortByDate(scores, args.Flags.rv)
    
    let out = []
    for (let i = 0; i < args.Flags.p.length; i++) {
        out.push(scores[args.Flags.p[i]])
    }
    scores = out

    let description = ""
    for (let i = 0; i < Math.min(scores.length, 5); i++) {
        const score = scores[i]

        let map = await utils.GetMap(score.beatmapId, args.Flags.m, score.mods)

        let fcppDisplay = ""
        if (score.maxCombo < map.maxCombo - 15 || score.counts.miss > 0 &&  args.Flags.m !== 3) fcppDisplay = `(${utils.RoundFixed(await calculator.GetFcPP(score))}pp for ${utils.RoundFixed(calculator.GetFcAcc(score) * 100)}% FC) `

        description += 
`**${score.index}. [${map.title} [${map.version}]](${utils.GetMapLink(map.id)}) +${utils.ModsFromRaw(score.raw_mods)}** [${utils.RoundFixed(await calculator.GetStarsWithMods(map.id, score.raw_mods))}★]
▸ ${emotes.GetEmote(score.rank)} ▸ **${utils.RoundFixed(score.pp)}pp** ${fcppDisplay}▸ ${utils.RoundFixed(utils.CalculateAcc(score.counts) * 100)}%
▸ ${utils.CommaFormat(score.score)} ▸ x${score.maxCombo}/${map.maxCombo} ▸ [${score.counts[300]}/${score.counts[100]}/${score.counts[50]}/${score.counts.miss}]
▸ Score Set ${utils.DateDiff(new moment(score.date), new moment(Date.now()))}Ago\n`
    }
    return new
    DiscordJS.MessageEmbed()
        .setAuthor(`Specific ${utils.ModNames.Name[args.Flags.m]} Top Play${scores.length > 1 ? "s" : ""} for ${profile.name}`, utils.GetFlagUrl(profile.country), utils.GetProfileLink(profile.id, args.Flags.m))
        .setDescription(description)
        .setFooter(utils.GetServer())
        .setThumbnail(utils.GetProfileImage(profile.id))
}

/**
 * @param {Command} args 
 */
async function GreaterThen(args) {
    let profile = await utils.GetProfile(args.Name, args.Flags.m)
    if (typeof profile == "string") return profile

    let scores = await utils.GetTopScores(args.Name, args.Flags.m)
    if (typeof scores == "string") return scores

    scores = utils.FilterByPP(scores, args.Flags.g)

    return `**${profile.name} has ${scores.length} plays worth more then ${parseFloat(args.Flags.g+"").toFixed(2)}pp**`
}

/**
 * @param {Command} args 
 */
async function RecentGreaterThen(args) {
    let profile = await utils.GetProfileFromCache(args.Name, args.Flags.m)
    if (typeof profile == "string") return profile

    let scores = await utils.GetTopScores(args.Name, args.Flags.m)
    if (typeof scores == "string") return scores

    utils.IndexScores(scores)

    scores = utils.FilterByPP(scores, args.Flags.g)

    utils.SortByDate(scores, args.Flags.rv)
    
    let description = ""
    for (let i = 0; i < Math.min(scores.length, 5); i++) {
        const score = scores[i]

        let map = await utils.GetMap(score.beatmapId, args.Flags.m, score.mods)

        let fcppDisplay = ""
        if (score.maxCombo < map.maxCombo - 15 || score.counts.miss > 0 &&  args.Flags.m !== 3) fcppDisplay = `(${utils.RoundFixed(await calculator.GetFcPP(score))}pp for ${utils.RoundFixed(calculator.GetFcAcc(score) * 100)}% FC) `

        description += 
`**${score.index}. [${map.title} [${map.version}]](${utils.GetMapLink(map.id)}) +${utils.ModsFromRaw(score.raw_mods)}** [${utils.RoundFixed(await calculator.GetStarsWithMods(map.id, score.raw_mods))}★]
▸ ${emotes.GetEmote(score.rank)} ▸ **${utils.RoundFixed(score.pp)}pp** ${fcppDisplay}▸ ${utils.RoundFixed(utils.CalculateAcc(score.counts) * 100)}%
▸ ${utils.CommaFormat(score.score)} ▸ x${score.maxCombo}/${map.maxCombo} ▸ [${score.counts[300]}/${score.counts[100]}/${score.counts[50]}/${score.counts.miss}]
▸ Score Set ${utils.DateDiff(new moment(score.date), new moment(Date.now()))}Ago\n`
    }
    return new
    DiscordJS.MessageEmbed()
        .setAuthor(`Recent ${Math.min(scores.length, 5)} ${utils.ModNames.Name[args.Flags.m]} Top Play${scores.length > 1 ? "s" : ""} for ${profile.name}`, utils.GetFlagUrl(profile.country), utils.GetProfileLink(profile.id, args.Flags.m))
        .setDescription(description)
        .setFooter(utils.GetServer())
        .setThumbnail(utils.GetProfileImage(profile.id))
}


module.exports = {Normal, Specific, Recent, GreaterThen, RecentGreaterThen, RecentSpecific}