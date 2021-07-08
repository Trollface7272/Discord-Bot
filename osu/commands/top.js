const utils = require("../osu-utils")
const DiscordJS = require("discord.js")
const moment = require("moment")
const emotes = require("../../emotes").instance
const calc = require("./calculator")
const calculator = new calc()
const print = console.log


async function DisplayTopPlay(args, score) {
    let map = await utils.GetMap(score.beatmapId, args.Flags.m, score.mods), desc = ""

    let fcppDisplay = ""
    if (score.maxCombo < map.maxCombo - 15 || score.counts.miss > 0 &&  args.Flags.m !== 3) fcppDisplay = `(${utils.RoundFixed(await calculator.GetFcPP(score))}pp for ${utils.RoundFixed(calculator.GetFcAcc(score) * 100)}% FC) `
    desc += `**${score.index}. [${map.title} [${map.version}]](${utils.GetMapLink(map.id)}) +${utils.ModsFromRaw(score.raw_mods)}** [${utils.RoundFixed(await calculator.GetStarsWithMods(map.id, score.raw_mods))}★]\n`
    desc += `▸ ${emotes.GetEmote(score.rank)} ▸ **${utils.RoundFixed(score.pp)}pp** ${fcppDisplay}▸ ${utils.GetAccuracy(score.counts, args.Flags.m)}%\n`
    desc += `▸ ${utils.CommaFormat(score.score)} ▸ x${utils.GetCombo(score.maxCombo, map.maxCombo, args.Flags.m)} ▸ [${score.counts[300]}/${score.counts[100]}/${score.counts[50]}/${score.counts.miss}]\n`
    desc += `▸ Score Set ${utils.DateDiff(new moment(score.date), new moment(Date.now()))}Ago\n`

    return desc
}


/**
 * @param {utils.Command} args 
 * @returns 
 */
async function Normal(args) {
    let profile = await utils.GetProfileFromCache(args.Name, args.Flags.m)
    if (typeof profile == "string") return profile

    let scores = await utils.GetTopScores(args.Name, args.Flags.m)
    if (typeof scores == "string") return scores

    utils.IndexScores(scores)

    if (args.Flags.rv) {
        scores = scores.reverse()
    }
    
    let desc = ""
    for (let i = 0; i < Math.min(scores.length, 5); i++) {
        desc += await DisplayTopPlay(args, scores[i])
    }
    return new
    DiscordJS.MessageEmbed()
        .setAuthor(`Top ${Math.min(scores.length, 5)} ${utils.ModNames.Name[args.Flags.m]} Plays for ${profile.name}`, utils.GetFlagUrl(profile.country), utils.GetProfileLink(profile.id, args.Flags.m))
        .setDescription(desc)
        .setFooter(utils.GetServer())
        .setThumbnail(utils.GetProfileImage(profile.id))
}

/**
 * @param {utils.Command} args 
 */
async function Specific(args) {
    let profile = await utils.GetProfileFromCache(args.Name, args.Flags.m)
    if (typeof profile == "string") return profile

    let scores = await utils.GetTopScores(args.Name, args.Flags.m)
    if (typeof scores == "string") return scores

    utils.IndexScores(scores)

    if (args.Flags.rv) scores = scores.reverse()

    let out = []
    for (let i = 0; i < args.Flags.p.length; i++) {
        out.push(scores[args.Flags.p[i]])
    }
    scores = out

    
    let desc = ""
    for (let i = 0; i < Math.min(scores.length, 5); i++) 
        desc += await DisplayTopPlay(args, scores[i])
    
    return new
    DiscordJS.MessageEmbed()
        .setAuthor(`Specific ${utils.ModNames.Name[args.Flags.m]} Top Play${scores.length > 1 ? "s" : ""} for ${profile.name}`, utils.GetFlagUrl(profile.country), utils.GetProfileLink(profile.id, args.Flags.m))
        .setDescription(desc)
        .setFooter(utils.GetServer())
        .setThumbnail(utils.GetProfileImage(profile.id))
}

/**
 * @param {utils.Command} args 
 */
async function Recent(args) {
    let profile = await utils.GetProfileFromCache(args.Name, args.Flags.m)
    if (typeof profile == "string") return profile

    let scores = await utils.GetTopScores(args.Name, args.Flags.m)
    if (typeof scores == "string") return scores

    utils.IndexScores(scores)

    utils.SortByDate(scores, args.Flags.rv)
    
    let desc = ""
    for (let i = 0; i < Math.min(scores.length, 5); i++) 
        desc += await DisplayTopPlay(args, scores[i])
    
    return new
    DiscordJS.MessageEmbed()
        .setAuthor(`Recent ${Math.min(scores.length, 5)} ${utils.ModNames.Name[args.Flags.m]} Top Play${scores.length > 1 ? "s" : ""} for ${profile.name}`, utils.GetFlagUrl(profile.country), utils.GetProfileLink(profile.id, args.Flags.m))
        .setDescription(desc)
        .setFooter(utils.GetServer())
        .setThumbnail(utils.GetProfileImage(profile.id))
}

/**
 * @param {utils.Command} args 
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

    let desc = ""
    for (let i = 0; i < Math.min(scores.length, 5); i++) 
        desc += await DisplayTopPlay(args, scores[i])
    
    return new
    DiscordJS.MessageEmbed()
        .setAuthor(`Specific ${utils.ModNames.Name[args.Flags.m]} Top Play${scores.length > 1 ? "s" : ""} for ${profile.name}`, utils.GetFlagUrl(profile.country), utils.GetProfileLink(profile.id, args.Flags.m))
        .setDescription(desc)
        .setFooter(utils.GetServer())
        .setThumbnail(utils.GetProfileImage(profile.id))
}

/**
 * @param {utils.Command} args 
 */
async function GreaterThan(args) {
    let profile = await utils.GetProfile(args.Name, args.Flags.m)
    if (typeof profile == "string") return profile

    let scores = await utils.GetTopScores(args.Name, args.Flags.m)
    if (typeof scores == "string") return scores

    scores = utils.FilterByPP(scores, args.Flags.g, args.Flags.rv)

    return `**${profile.name} has ${scores.length} plays worth more than ${parseFloat(args.Flags.g+"").toFixed(2)}pp**`
}

/**
 * @param {utils.Command} args 
 */
async function RecentGreaterThan(args) {
    let profile = await utils.GetProfileFromCache(args.Name, args.Flags.m)
    if (typeof profile == "string") return profile

    let scores = await utils.GetTopScores(args.Name, args.Flags.m)
    if (typeof scores == "string") return scores

    utils.IndexScores(scores)

    scores = utils.FilterByPP(scores, args.Flags.g, false)

    utils.SortByDate(scores, args.Flags.rv)
    
    let desc = ""
    for (let i = 0; i < Math.min(scores.length, 5); i++) 
        desc += await DisplayTopPlay(args, scores[i])
    
    return new
    DiscordJS.MessageEmbed()
        .setAuthor(`Recent ${Math.min(scores.length, 5)} ${utils.ModNames.Name[args.Flags.m]} Top Play${scores.length > 1 ? "s" : ""} for ${profile.name}`, utils.GetFlagUrl(profile.country), utils.GetProfileLink(profile.id, args.Flags.m))
        .setDescription(desc)
        .setFooter(utils.GetServer())
        .setThumbnail(utils.GetProfileImage(profile.id))
}


module.exports = {Normal, Specific, Recent, GreaterThan, RecentGreaterThan, RecentSpecific}