const DiscordJS = require("discord.js")
const Utils = require("./utils")
const NodeOsu = require("node-osu")
const OsuApi = new NodeOsu.Api('d3bb61f11b973d6c2cdc0dd9ea7998c2a0b15c1e', {
    notFoundAsError: true,
    completeScores: false,
    parseNumeric: true
})
const Mods = {
    Bit = {
        None: 0,
        NoFail: 1 << 0,
        Easy: 1 << 1,
        TouchDevice: 1 << 2,
        Hidden: 1 << 3,
        HardRock: 1 << 4,
        SuddenDeath: 1 << 5,
        DoubleTime: 1 << 6,
        Relax: 1 << 7,
        HalfTime: 1 << 8,
        Nightcore: 1 << 9,
        Flashlight: 1 << 10,
        Autoplay: 1 << 11,
        SpunOut: 1 << 12,
        Relax2: 1 << 13,
        Perfect: 1 << 14,
        Key4: 1 << 15,
        Key5: 1 << 16,
        Key6: 1 << 17,
        Key7: 1 << 18,
        Key8: 1 << 19,
        FadeIn: 1 << 20,
        Random: 1 << 21,
        Cinema: 1 << 22,
        Target: 1 << 23,
        Key9: 1 << 24,
        KeyCoop: 1 << 25,
        Key1: 1 << 26,
        Key3: 1 << 27,
        Key2: 1 << 28,
        ScoreV2: 1 << 29,
        Mirror: 1 << 30
    },
    BitArr = [
        None = 0,
        NoFail = 1 << 0,
        Easy = 1 << 1,
        TouchDevice = 1 << 2,
        Hidden = 1 << 3,
        HardRock = 1 << 4,
        SuddenDeath = 1 << 5,
        DoubleTime = 1 << 6,
        Relax = 1 << 7,
        HalfTime = 1 << 8,
        Nightcore = 1 << 9,
        Flashlight = 1 << 10,
        Autoplay = 1 << 11,
        SpunOut = 1 << 12,
        Relax2 = 1 << 13,
        Perfect = 1 << 14,
        Key4 = 1 << 15,
        Key5 = 1 << 16,
        Key6 = 1 << 17,
        Key7 = 1 << 18,
        Key8 = 1 << 19,
        FadeIn = 1 << 20,
        Random = 1 << 21,
        Cinema = 1 << 22,
        Target = 1 << 23,
        Key9 = 1 << 24,
        KeyCoop = 1 << 25,
        Key1 = 1 << 26,
        Key3 = 1 << 27,
        Key2 = 1 << 28,
        ScoreV2 = 1 << 29,
        Mirror = 1 << 30
    ]
}
const Commands = {
    Profile : ["mania", "ctb", "taiko", "osu"],
    Recent  : ["r", "rs", "recent"],
    Top     : ["top", "ctbtop", "taikotop", "maniatop", "osutop"],
    Compare : ["c", "compare"],
    Map     : ["m", "map"],
    OsuSet  : ["osuset"],
    Track   : ["track"]

}
const Gamemodes = {
    "taiko" : 1,
    "taikotop" : 1,
    "ctb" : 2,
    "ctbtop" : 2,
    "mania" : 3,
    "maniatop" : 3
}
const Mods = {
    Name : ["Standard", "Taiko", "Catch the Beat!", "Mania"],
    Link : ["osu", "taiko", "fruits", "mania"]
}

function print(text) {
    console.log(text)
}

function RemoveNonDiffMods(mods) {
    return (mods & Mods.Bit.DoubleTime | mods & Mods.Bit.HalfTime | mods & Mods.Bit.HardRock | mods & Mods.Bit.Easy)
}

/**
 * 
 * @param {Array} args 
 */
function ParseArgs(args, cmd) {
    let out = {}
    out.Flags = {}
    out.Flags.m = Gamemodes[cmd] || 0
    for (let i = 0; i < args.length; i++) {
        const el = args[i]
        if (el == "b") out.Flags.b = true
        else if (el == "g") {
            if (i == args.length - 1) break
            out.Flags.g = args[i+1]
            i++
        }
        else if (el == "m") {
            if (i == args.length - 1) break
            out.Flags.m = args[i+1]
            if (isNaN(out.Flags.m)) out.Flags.m = Gamemodes[out.Flags.m] || 0
            i++
        }
        else if (el.length >= 3) out.Name = el
        
    }
    return out
}

/**
 * 
 * @param {Error} err 
 * @param {Object} arg 
 * @param {String} arg.Name
 * @param {Object} args.Flags
 * @param {Number} arg.Flags.m 
 */
function HandleError(err, arg) {
    if (!arg.Name) return `**🔴 Please specify user or set default one using osuset command.**`
    if (err.message == "Not found") return `**🔴 ${arg.Name} not found.**`

    print("Error")
    print("Name - " + err.name)
    print("Message - " + err.message)
}


/**
 * 
 * @param {String} cmd
 * @param {Array} args
 */
async function Command(cmd, args) {
    args = ParseArgs(args, cmd)
    for (k in Commands) 
        if (Commands[k].indexOf(cmd) !== -1) 
            try { return await eval(`${k}(${JSON.stringify(args)})`) } catch (err) { return HandleError(err, JSON.parse(args)) }
}

/**
 * 
 * @param {Object} args 
 * @param {String} args.Name
 * @param {Object} args.Flags
 * @param {Number} args.Flags.m
 */
async function Profile(args) {
    const profile = await OsuApi.getUser({u: args.Name, m: args.Flags.m})
    const Embed = new DiscordJS.MessageEmbed()
    const level = ((profile.level - Math.floor(profile.level)).toFixed(4) * 100).toFixed(2)
    const pp    = Utils.ToFixedRound(profile.pp.raw, 2)
    const acc   = Utils.ToFixedRound(profile.accuracy, 2)
    const desc  =
`**▸ Official Rank:** #${Utils.FormatNumberWithCommas(profile.pp.rank)} (${profile.country}#${profile.pp.countryRank})
**▸ Level:** ${parseInt(profile.level)} (${level}%)
**▸ Total PP:** ${Utils.FormatNumberWithCommas(pp)}
**▸ Hit Accuracy:** ${acc}%
**▸ Playcount:** ${Utils.FormatNumberWithCommas(profile.counts.plays)}`
    return Embed
    .setAuthor(`${Mods.Name[args.Flags.m]} Profile for ${profile.name}`, `https://www.countryflags.io/${profile.country.toLowerCase()}/flat/64.png`, `https://osu.ppy.sh/users/${profile.id}/${Mods.Link[args.Flags.m]}`)
    .setDescription(desc)
    .setFooter(`On osu! Official Server`)
    .setThumbnail(`http://s.ppy.sh/a/${profile.id}?hjdjkf=${new Date().getHours()}`)
}

/**
 * 
 * @param {Object} args
 * @param {Object} args.Flags
 * @param {Boolean} args.Flags.b
 * @param {Number} args.Flags.m
 * @param {Number} args.Flags.g
 * @param {String} args.Name
 */
async function Recent(args) {
    if (args.Flags.g && args.Flags.b) return await RecentBestAbove(args)
    if (args.Flags.b) return await RecentBest(args)
    let profile = await OsuApi.getUser({u: user, m: mode})
    let recent
    try { recent = await OsuApi.getUserRecent({u: user, m: mode, limit: 50}) } catch(e) { return `**🔴 ${profile.name} has no recent plays.**` }
    
    let mostRecent = recentList[0]

    beatmap = (await OsuApi.getBeatmaps({
        "b": mostRecent.beatmapId,
        "mods": RemoveNonDiffMods(mostRecent.raw_mods),
        "a": 1,
        "m": mode
    }))[0]

    let tries = 0
    for (let i = 0; i < recentList.length; i++) {
        if (recentList[i].beatmapId === recent.beatmapId) tries++
        else break
    }

    let fcppDisplay = ""
    //if (recent.maxCombo < beatmap.maxCombo - 15 || recent.counts.miss > 0) fcppDisplay = `(${TwoDigitValue(await Calculator.GetFcPP(recent))}pp for ${TwoDigitValue(Calculator.GetFcAcc(recent) * 100)}% FC) `
    description = `▸ ${await this.Client.emojis.resolve(GetRankingEmote(recent.rank))} ▸ **${TwoDigitValue(await Calculator.GetPlayPP(recent))}pp** ${fcppDisplay}▸ ${TwoDigitValue(CalculateAcc(recent.counts) * 100)}%\n`
    description += `▸ ${recent.score} ▸ x${recent.maxCombo}/${beatmap.maxCombo} ▸ [${recent.counts[300]}/${recent.counts[100]}/${recent.counts[50]}/${recent.counts.miss}]`

}

/**
 * 
 * @param {Object} args
 * @param {Object} args.Flags
 * @param {Boolean} args.Flags.b
 * @param {Number} args.Flags.m
 * @param {Number} args.Flags.g
 * @param {String} args.Name
 */
async function RecentBestAbove(args) {
    
}

/**
 * 
 * @param {Object} args
 * @param {Object} args.Flags
 * @param {Boolean} args.Flags.b
 * @param {Number} args.Flags.m
 * @param {Number} args.Flags.g
 * @param {String} args.Name
 */
async function RecentBest(args) {
    
}


/**
 * 
 * @param {Array} args 
 */
function Top(args) {
    
}

/**
 * 
 * @param {Array} args 
 */
function Compare(args) {
    
}

/**
 * 
 * @param {Array} args 
 */
function Map(args) {
    
}

/**
 * 
 * @param {Array} args 
 */
function OsuSet(args) {
    
}

/**
 * 
 * @param {Array} args 
 */
function Track(args) {
    
}

module.exports = {Command}