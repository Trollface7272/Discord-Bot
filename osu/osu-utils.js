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
 * 
 * @typedef {Object} Counts
 * @property {Number} [300]
 * @property {Number} [100]
 * @property {Number} [50]
 * @property {Number} miss
 */
const Errors = {
    NoUsernameSet   : '**🔴 Please specify user or set default one using osuset command.**',
    UnknownError    : '**🔴 Unknown error occured while getting {Where}.**',
    MapNotFound     : '**🔴 Map not found.**',
    ProfileNotFound : '**🔴 ${Name} not found.**',
    NoRecentPlays   : '**🔴 ${Name} has no recent plays.**',
    NoTopPlays      : '**🔴 ${Name} has no top plays.**',
    NoScores        : '**🔴 ${Name} has no scores on given map.**',
}
const Gamemodes = {
    "taiko" : 1,
    "taikotop" : 1,
    "ctb" : 2,
    "ctbtop" : 2,
    "mania" : 3,
    "maniatop" : 3
}

const ModNames = {
    Name : ["Standard", "Taiko", "Catch the Beat!", "Mania"],
    Link : ["osu", "taiko", "fruits", "mania"]
}

const Mods = {
    Bit : {
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
    BitArr : [
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
    ],
    Names : [
        None = "No Mod",
        NoFail = "NF",
        Easy = "EZ",
        TouchDevice = "TD",
        Hidden = "HD",
        HardRock = "HR",
        SuddenDeath = "SD",
        DoubleTime = "DT",
        Relax = "RX",
        HalfTime = "HT",
        Nightcore = "NC",
        Flashlight = "FL",
        Autoplay = "AU",
        SpunOut = "SO",
        Relax2 = "AP",
        Perfect = "PF",
        Key4 = "4K",
        Key5 = "5K",
        Key6 = "6K",
        Key7 = "7K",
        Key8 = "8K",
        FadeIn = "FI",
        Random = "RD",
        Cinema = "CN",
        Target = "TP",
        Key9 = "9K",
        KeyCoop = "2P",
        Key1 = "1K",
        Key3 = "3K",
        Key2 = "2K",
        ScoreV2 = "V2",
        Mirror = "MR"
    ],
}

const print = console.log
const NodeOsu = require("node-osu")
const moment = require("moment")
const database = require("../database").instance
const Api = new NodeOsu.Api('d3bb61f11b973d6c2cdc0dd9ea7998c2a0b15c1e', {
    notFoundAsError: true,
    completeScores: false,
    parseNumeric: true
})

/**
 * @param {Array} args
 * @returns {Flags}
 */
async function ParseArgs(args, cmd, msg) {
    let out = {}
    out.Flags = {
        m   : Gamemodes[cmd] || 0,
        b   : false,
        rv  : false,
        g   : false,
        p   : false,
        mods: false,
        acc : false,
        map : false,
    }
    for (let i = 0; i < args.length; i++) {
        const el = args[i]
        if (el == "b") out.Flags.b = true
        else if (el == "r") out.Flags.b = true
        else if (el == "o") {out.Flags.rv = true; out.Flags.b = true}
        else if (el == "rv") out.Flags.rv = true
        else if (el == "g") {
            if (i == args.length - 1) break
            out.Flags.g = args[i+1]
            i++
        }
        else if (!isNaN(el) && el > 0 && el < 101) {
            if (out.Flags.p == false) out.Flags.p = []
            out.Flags.p.push(el-1)
        }
        else if (el == "m") {
            if (i == args.length - 1) break
            out.Flags.m = args[i+1]
            if (isNaN(out.Flags.m)) out.Flags.m = Gamemodes[out.Flags.m] || 0
            i++
        }
        else if (el.startsWith("+")) out.Flags.mods = el.substr(1)
        else if (el.includes("osu.ppy.sh")) out.Flags.map = el
        else if (el.length >= 3) out.Name = el
    }
    if (cmd == "map" || cmd == "m" || cmd == "c" || cmd == "compare") {
        if (!out.Flags.map) out.Flags.map = await FindMapInConversation(msg)
        if (out.Flags.map.startsWith("http")) {
            out.Flags.map = out.Flags.map.split("/").pop()
        }
    }
    if (!out.Name) {
        let userData = await database.GetUser(msg)
        out.Name = userData.osu.username
    }
    return out
}

/**
 * @param {String|Number} id 
 * @param {0|1|2|3} mode 
 * @returns {Promise<NodeOsu.User>|Promise<String>} Profile Data
 */
async function GetProfile(id, mode) {
    try {
        return await Api.getUser({u:id, m:mode})
    } catch(err) {
        if (!id) return Errors.NoUsernameSet
        if (err.message == "Not found") return Errors.ProfileNotFound.replace("${Name}", id)
        print("Unhandled error")
        print(err.message)
        return Errors.UnknownError.replace("{Where}", "profile data")
    }
}

/**
 * @param {String} id 
 * @param {0|1|2|3} mode 
 * @returns {Promise<NodeOsu.User>|Promise<String>} Profile Data
 */
async function GetProfileFromCache(id, mode) {
    return await GetProfile(id, mode)
}

/**
 * @param {String} id 
 * @param {0|1|2|3} mode 
 * @param {Number} limit 
 * @returns {Promise<Array<NodeOsu.Score>>|Promise<String>} Map data
 */
async function GetRecent(id, mode, limit=50) {
    try {
        return await Api.getUserRecent({u: id, m: mode, limit: limit})
    } catch(err) {
        if (err.message == "Not found") return Errors.NoRecentPlays.replace("${Name}", id)
        print("Unhandled error")
        print(err.message)
        return Errors.UnknownError.replace("{Where}", "recent scores")
    }
}

/**
 * @param {String} id 
 * @param {0|1|2|3} mode 
 * @param {Number} mods 
 * @returns {Promise<NodeOsu.Beatmap>|Promise<String>}
 */
async function GetMap(id, mode, mods=0) {
    mods = RemoveNonDiffMods(mods)
    try {
        return (await Api.getBeatmaps({b:id, m:mode, mods:mods, a:1}))[0]
    } catch (err) {
        if (err.message == "Not found") return Errors.MapNotFound
        print("Unhandled error")
        print(err.message)
        return Errors.UnknownError.replace("{Where}", "map data")
    }
}

/**
 * @param {String} id 
 * @param {0|1|2|3} mode 
 * @param {Number} limit 
 * @returns 
 */
async function GetTopScores(id, mode, limit=100) {
    try {
        return Api.getUserBest({u:id, m:mode, limit:limit})
    } catch (err) {
        if (err.message == "Not found") return Errors.NoTopPlays.replace("${Name}", id)
        print("Unhandled error")
        print(err.message)
        return Errors.UnknownError.replace("{Where}", "top plays")
    }
}

async function GetScores(id, map, mode) {
    try {
        return await Api.getScores({b:map, m:mode, u: id})
    } catch (err) {
        if (err == "Not found") return Errors.NoScores.replace("${Name}", id)
        print("Unhandled error")
        print(err.message)
        return Errors.UnknownError.replace("{Where}", "scores")
    }
}

/**
 * @param {Number} num 
 * @param {Number} digits
 * @returns {String}
 */
function RoundFixed(num, digits=2) {
    return (Math.round(num * Math.pow(10, digits)) / Math.pow(10, digits)).toFixed(digits)
}

/**
 * @param {Number|String} num 
 * @returns {String}
 */
function CommaFormat(num) {
    if (typeof(num) == "number") num = num.toString()
    num = num.split(".")
    let decimals = num[1] ? "." + num[1] : ""
    num = num[0]
    let formatted = ""
    for (let i = num.length-1; i >= 0; i--) formatted = ((i - num.length) % 3 == 0 && i > 0 ? "," : "") + num[i] + formatted
    return formatted + decimals
}

/**
 * @param {String} country 
 * @returns {String} url
 */
function GetFlagUrl(country) {
    return `https://www.countryflags.io/${country.toLowerCase()}/flat/64.png`
}

/**
 * @param {Number} id 
 * @param {0|1|2|3} mode 
 * @returns {String}
 */
function GetProfileLink(id, mode) {
    return `https://osu.ppy.sh/users/${id}/${ModNames.Link[mode]}`
}

/**
 * @returns {String}
 */
function GetServer() {
    return `On osu! Official Server`
}

/**
 * @param {Number} id 
 * @returns {String}
 */
function GetProfileImage(id) {
    return `http://s.ppy.sh/a/${id}?newFix=${new Date()*1}`
}

/**
 * @param {Number} mods 
 * @returns 
 */
function RemoveNonDiffMods(mods) {
    return (mods & Mods.Bit.DoubleTime | mods & Mods.Bit.HalfTime | mods & Mods.Bit.HardRock | mods & Mods.Bit.Easy)
}

/**
 * @param {Counts} counts 
 * @returns {Number}
 */
function StdAccuracy(counts) {
    return (counts[50] * 50 + counts[100] * 100 + counts[300] * 300) / (counts[50] * 300 + counts[100] * 300 + counts[300] * 300 + counts.miss * 300)
}

/**
 * @param {Number} rawMods 
 * @returns {String}
 */
function ModsFromRaw(rawMods) {
    if (rawMods === 0) return "No Mod"

    let resultMods = ""
    if (rawMods & Mods.Bit.Perfect) rawMods &= ~Mods.Bit.SuddenDeath
    if (rawMods & Mods.Bit.Nightcore) rawMods &= ~Mods.Bit.DoubleTime
    for (let i = 0; i < Mods.BitArr.length; i++) {
        const mod = Mods.BitArr[i]
        if (mod & rawMods)
            resultMods += Mods.Names[i]
    }
    return resultMods
}

/**
 * @param {String|Number} id 
 * @returns {String}
 */
function GetMapLink(id) {
    return `https://osu.ppy.sh/b/${id}`
}

/**
 * @param {String|Number} id 
 * @returns {String}
 */
function GetMapImage(id) {
    return `https://b.ppy.sh/thumb/${id}l.jpg`
}

/**
 * @param {Date} playDate 
 * @param {Date} now 
 * @returns 
 */
function DateDiff(playDate, now) {
    let diffAr = []

    let diffObj = moment.duration(now.diff(playDate))
    let yearDiff = diffObj._data.years
    let monthDiff = diffObj._data.months
    let dayDiff = diffObj._data.days
    let hourDiff = diffObj._data.hours
    let minuteDiff = diffObj._data.minutes
    let secondDiff = diffObj._data.seconds


    if (yearDiff > 0)   diffAr[diffAr.length] = yearDiff   + (yearDiff   > 1 ? ' Years '   : " Year ")
    if (monthDiff > 0)  diffAr[diffAr.length] = monthDiff  + (monthDiff  > 1 ? ' Months '  : " Month ")
    if (dayDiff > 0)    diffAr[diffAr.length] = dayDiff    + (dayDiff    > 1 ? ' Days '    : " Day ")
    if (hourDiff > 0)   diffAr[diffAr.length] = hourDiff   + (hourDiff   > 1 ? ' Hours '   : " Hour ")
    if (minuteDiff > 0) diffAr[diffAr.length] = minuteDiff + (minuteDiff > 1 ? ' Minutes ' : " Minute ")
    if (secondDiff > 0) diffAr[diffAr.length] = secondDiff + (secondDiff > 1 ? ' Seconds ' : " Second ")
    return diffAr[1] === undefined ? diffAr[0] : diffAr[0] + diffAr[1]
}

/**
 * @param {Array<NodeOsu.Score>} scores 
 */
function IndexScores(scores) {
    for (let i = 0; i < scores.length; i++) {
        scores[i].index = i+1
    }
}

/**
 * @param {Array} arr 
 * @param {Boolean} way 
 */
function SortByDate(arr, way) {
    arr.sort((a,b) => {
        const dateA = new Date(a.date), dateB = new Date(b.date)
        return way ? dateA - dateB : dateB - dateA
    })
}

/**
 * @param {Array} arr 
 * @param {Number} min 
 * @returns {Array}
 */
function FilterByPP(arr, min) {
    return arr.filter(item => item.pp >= min)
}

/**
 * @param {Number} num 
 * @param {Number} digits 
 * @returns {Number}
 */
function Round(num, digits=2) {
    return Math.round(num * Math.pow(10, digits)) / Math.pow(10, digits)
}

/**
 * @param {DiscordJS.Message} msg 
 */
async function FindMapInConversation(msgs) {
    messages = await msgs.channel.messages.fetch({limit: 50})
    let map
    messages.forEach(msg => {
        if (msg.embeds.length < 1 || map) return

        console.log(msg.embeds[0].author?.url, msg.embeds[0].author?.url?.startsWith("https://osu.ppy.sh/b/"));

        if (msg.embeds[0].author?.url?.startsWith("https://osu.ppy.sh/b/")) {
            map = map || msg.embeds[0].author && msg.embeds[0].author.url.split("https://osu.ppy.sh/b/")[1]
            map = map.replace(/[)]/g, "")
            return map
        } else if (msg.embeds[0].description?.includes("https://osu.ppy.sh/b/")) {
            map = map || msg.embeds[0].description.split("https://osu.ppy.sh/b/", 2)[1].split(")")[0]
            map = map.replace(/[)]/g, "")
            return map
        }
        
    })
    return map || "Not Found"
}

/**
 * @param {Number} num 
 */
function FillZeros(num) {
    if (num < 10) num = "0" + num
    return num
}

/**
 * 
 * @param {Object} counts 
 */
function CtbAccuracy(counts) {
    return (counts[300] + counts[100] + counts[50]) / (counts[300] + counts[100] + counts[50] + counts.miss)
}

function GetCombo(combo, maxCombo, mode) {
    if (mode == 3) return `${combo}x`
    return `${combo}x/${maxCombo}x`
}

function GetAccuracy(counts, mode) {
    let acc = 0
    if (mode == 2) acc = CtbAccuracy(counts)
    else acc = StdAccuracy(counts)
    acc = RoundFixed(acc * 100)
    return acc
}

function GetProgress(objects, counts, mode) {
    return utils.RoundFixed((counts[300] + counts[100] + counts[50] + counts.miss) / (objects.normal + objects.slider + objects.spinner) * 100)
}

function GetHitsDisplay(counts, mode) {
    return `[${counts[300]}/${counts[100]}/${counts[50]}/${counts.miss}]`
}


module.exports = {ModNames, Mods, ParseArgs, GetProfile, RoundFixed, CommaFormat, GetFlagUrl, GetProfileLink, GetServer, GetProfileImage, GetRecent, GetMap, GetProfileFromCache, RemoveNonDiffMods, ModsFromRaw, GetMapLink, GetMapImage, DateDiff, IndexScores, GetTopScores, SortByDate, Round, FilterByPP, FillZeros, GetScores, CtbAccuracy, GetCombo, GetAccuracy, GetHitsDisplay, GetProgress}