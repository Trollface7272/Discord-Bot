const //Constants
    Discord = require("discord.js"),
    OsuFunctions = require("./osu"),
    Database = require("./database"),
    Client = new Discord.Client(),
    db = new Database(),
    PREFIX = "!",
    FLAGS = [
        "g", "r", "o", "p", "m", "b", "d"
    ],
    Osu = new OsuFunctions(Client),
    DEBUG = {
        LEVELS: {
            NONE: 0,    //No Debugging
            FATAL: 1,   //Fatal Errors
            ERRORS: 2,  //All Errors
            WARNINGS: 3,//Warnings
            INFO: 4     //Info
        },
        LEVEL: 4,
        log: (label, message, level) => {
            if (!DEBUG.LEVEL >= level)
                return
            console.log(label + ":")
            console.log(message)
        }
    }
Client.on('ready', async () => {
    DEBUG.log("Ready", `Logged in as ${Client.user.tag}!`, DEBUG.LEVELS.INFO)
})

Client.on("message", async msgData => {
    if (msgData.author.bot) return

    db.CheckIfNew(msgData.author.id, msgData.author.username, msgData.guild.id, msgData.guild.name);
    db.NewMessage(msgData.author.id, msgData.author.username, msgData.guild.id, msgData.guild.name)

    if (!msgData.content.startsWith(PREFIX)) return
    let messages, map,
        msg = msgData.content,                  //Message text
        lcMsg = msg.toLowerCase(),              //Message text in lower case
        splitMsg = lcMsg.substr(1).split(" "),  //Message split by spaces without prefix
        command = splitMsg.shift(),             //First index of split message is always the command
        names = [],                             //Used to store names
        flags = [],                             //Used to store flags
        flagValues = [],                        //Used to store flag value
        gameMode = GetGamemode(command),        //Get selected gamemode
        limit = 5,                              //Limit how many plays to get
        foundFlag = false,
        stopFix = false

    for (let i = 0; i < splitMsg.length; i++) {
        const el = splitMsg[i]
        limit--
        if (FLAGS.indexOf(el) !== -1) { //Is flag check
            flags.push(el)
            limit++
            if (el === "m") if (!isNaN(parseInt(splitMsg[i + 1]))) {
                gameMode = splitMsg[i + 1]
                i++
            } else return msgData.channel.send("**🔴 Please enter valid gamemode.**")
            else if (el === "g") {
                if (!isNaN(parseInt(splitMsg[i + 1]))) {
                    flagValues[flags.length - 1] = splitMsg[i + 1]
                    i++
                } else return msgData.channel.send("**🔴 Please enter valid number after \`g\`.**")
            }
        } else if (!isNaN(parseInt(el)) && !el.includes(".") && el <= 100 && el > 0) {
            flags.push("p")
            flagValues[flags.length - 1] = el
        } else if (el.startsWith("+")) {
            flags.push("mods")
            flagValues[flags.length - 1] = el.substr(1)
        } else if (el.includes(".") && !isNaN(parseInt(el))) {
            flags.push("acc")
            flagValues[flags.length - 1] = el
        } else if (limit < 1) {
        } //Can't really stop looping trough the array cause of flags so just do nothing
        else if (el.length < 3 || el.match(/[^0-9 A-z_-]/)) {} //Minimal username length is 3 | Includes forbidden characters
        else if (names.indexOf(el) !== -1) {
        } // Username already in array
        else names.push(el) //Is username -> add to names
    }


    switch (command) {
        //Player profile
        case "mania":
        case "ctb":
        case "taiko":
        case "osu":
            if (names.length < 1) names.push(db.GetOsuName(msgData.author.id))
            if (names[0] === "Not Found") return msgData.channel.send("**🔴 Please specify user or set default one using osuset command.**")
            //Loop trough names & get userdata
            for (const name1 of names) {
                let profile = await Osu.GetOsuProfile(name1, gameMode) //Get user data from osu api
                await msgData.channel.send(profile) //Get embed from the date and send it
            }
            break

        case "r":
        case "rs":
        case "recent":
            if (names.length < 1) names.push(db.GetOsuName(msgData.author.id))
            if (names[0] === "Not Found") return msgData.channel.send("**🔴 Please specify user or set default one using osuset command.**")

            for (const name1 of names) {
                let recent
                if (flags.indexOf("b") !== -1 && flags.indexOf("g") !== -1) recent = await Osu.GetRecentBestGreaterThen(name1, gameMode, flagValues[flags.indexOf("g")])
                else if (flags.indexOf("b") !== -1) recent = await Osu.GetRecentBest(name1, gameMode)
                else if (flags.indexOf("d") !== -1) recent = await Osu.GetRecentDetailed(name1, gameMode)
                else recent = await Osu.GetRecentPlay(name1, gameMode) //Get user data from osu api
                await msgData.channel.send(recent)
            }
            break

        case "top":
        case "ctbtop":
        case "taikotop":
        case "maniatop":
        case "osutop":
            if (stopFix || foundFlag) return msgData.channel.send("**🔴 Please enter a number after g tag**")
            let name = names[0] || db.GetOsuName(msgData.author.id), plays
            if (name === "Not Found") return msgData.channel.send("**🔴 Please specify user or set default one using osuset command.**")

            if (flags.length === 0)
                plays = await Osu.GetTopPlays(name, gameMode)
            else if (flags.indexOf("p") !== -1)
                plays = await Osu.GetSpecificPlay(name, flagValues[flags.indexOf("p")], gameMode)
            else if (flags.indexOf("g") !== -1 && flags.indexOf("r") !== -1)
                plays = await Osu.GetRecentTopPlaysGreaterThen(name, gameMode, true, flagValues[flags.indexOf("g")])
            else if (flags.indexOf("g") !== -1 && flags.indexOf("o") !== -1)
                plays = await Osu.GetRecentTopPlaysGreaterThen(name, gameMode, false, flagValues[flags.indexOf("g")])
            else if (flags.indexOf("g") !== -1)
                plays = await Osu.GetPlaysGreaterThen(name, gameMode, flagValues[flags.indexOf("g")])
            else if (flags.indexOf("o") !== -1)
                plays = await Osu.GetRecentTopPlays(name, gameMode, false)
            else if (flags.indexOf("r") !== -1)
                plays = await Osu.GetRecentTopPlays(name, gameMode, true)

            await msgData.channel.send(plays)

            //DEBUG.log("Plays", plays, DEBUG.LEVELS.INFO)
            break

        case "c":
        case "compare":
            messages = await msgData.channel.messages.fetch({limit: 50})
            map = GetMapFromMessages(messages)
            if (map === "Not Found") return msgData.channel.send("**🔴 No maps found in conversation.**")

            let nam = names[0] || db.GetOsuName(msgData.author.id)
            if (nam === "Not Found") return msgData.channel.send("**🔴 Please specify user or set default one using osuset command.**")

            await msgData.channel.send(await Osu.GetUserBestOnMap(nam, map, gameMode))
            break

        case "m":
        case "map":
            messages = await msgData.channel.messages.fetch({limit: 50})
            map = GetMapFromMessages(messages)
            let mods = flags.indexOf("mods") !== -1 ? flagValues[flags.indexOf("mods")] : names[0]
            if (map === "Not Found") return msgData.channel.send("**🔴 No maps found in conversation.**")
            await msgData.channel.send(await Osu.GetMap(map, gameMode, mods, flags.indexOf("acc") !== -1 ? flagValues[flags.indexOf("acc")] : undefined))
            break

        case "osuset":
            if (!splitMsg[0]) return msgData.channel.send("**🔴 Please specify user.**")
            if (splitMsg[0].length < 3) return msgData.channel.send("**🔴 Please enter a valid user.**")
            await db.SetOsuUsername(msgData.author.id, splitMsg[0])
            msgData.react("✔")
            break

        case "track":
            if (await Osu.CheckIfExists(names[0])) {
                let profile = await Osu.GetOsuPlayerProfile(names[0], gameMode)
                let newestTopPlay = (await Osu.GetTopPlaysSorted(names[0], gameMode, 100))[0]
                await db.AddToTracking(profile.id, msgData.channel.id, msgData.guild.id, names[0], gameMode, flagValues[flags.indexOf("p")] || 100, profile.pp.raw, newestTopPlay.pp, newestTopPlay.beatmapId, newestTopPlay.score, profile.pp.rank, profile.pp.countryRank)
            } else return msgData.channel.send("**🔴 User does not exist.**")
            msgData.react("✔")
            break

        default:
            break;
    }
})

let lastCheck = 0

async function OsuTracking() {
    let trackedUsers = db.GetTrackedProfiles()
    let user = trackedUsers[lastCheck]
    if (!user) return

    let topPlays = await Osu.GetTopPlaysSorted(user.osu_id, user.gamemode)
    let newTopPlays = []
    for (const el of topPlays) {
        // noinspection EqualityComparisonWithCoercionJS
        if (
            user.play_score == el.score
        ) break
        newTopPlays.push(el)
        // noinspection EqualityComparisonWithCoercionJS
        if (user.play_map == el.beatmapId) break
    }

    if (newTopPlays.length > 0) {
        NewTopPlays(user, newTopPlays)
        let profile = await Osu.GetOsuPlayerProfile(user.osu_id, user.gamemode)
        await db.UpdateTracking(user.id_tu, profile.pp.raw, profile.pp.rank, profile.pp.countryRank, newTopPlays[0].pp, newTopPlays[0].beatmapId, newTopPlays[0].score)
    }

    if (trackedUsers.length >= lastCheck) lastCheck = 0
    else lastCheck++
}
setInterval(OsuTracking, 30 * 1000)

async function NewTopPlays(user, scores) {
    let tracked = db.GetTrackedUsers()
    let embeds = []
    for (const el of scores) embeds.push(await Osu.CreateTrackingEmbed(el, user))

    for (let el of tracked) {
        if (el.id_tu[0] === user.id_tu) {
            let channel = await Client.channels.fetch(el.channel_id)
            embeds.forEach(embed => {
                if (embed.index <= el.t_limit)
                    channel.send(embed)
            })
        }
    }
}


function GetGamemode(name) {
    switch (name) {
        case "mania":
        case "maniatop":
            return 3
        case "ctb":
        case "ctbtop":
            return 2
        case "taiko":
        case "taikotop":
            return 1
        case "osu":
        case "osutop":
        case "top":
        default:
            return 0
    }
}

function GetMapFromMessages(messages) {
    let x
    messages.forEach(msg => {
        if (msg.embeds.length !== 0) {
            if (msg.embeds[0].author && msg.embeds[0].author.url && msg.embeds[0].author.url.startsWith("https://osu.ppy.sh/b/")) {
                x = RetardedFix(x, msg.embeds[0].author && msg.embeds[0].author.url.split("https://osu.ppy.sh/b/")[1])
                x = x.replace(/[)]/g, "")
                return x
            } else if (msg.embeds[0].description && msg.embeds[0].description.includes("https://osu.ppy.sh/b/")) {
                x = RetardedFix(x, msg.embeds[0].description.split("https://osu.ppy.sh/b/", 2)[1].split(")")[0])
                x = x.replace(/[)]/g, "")
                return x
            }
        }
    })
    return x || "Not Found"
}

function RetardedFix(x, y) {
    return x || y
}

[`exit`, `SIGINT`, `SIGUSR1`, `SIGUSR2`, `uncaughtException`, `SIGTERM`].forEach(eventType => {
    // noinspection JSCheckFunctionSignatures
    process.on(eventType, exitHandler.bind(null, eventType));
})

async function exitHandler(options, exitCode) {
    await db.UpdateNow()
    if (exitCode || exitCode === 0) console.log(exitCode)
    process.exit()
}

Client.login(process.env.token || `NTg0MzIxMzY2MzA4ODE0ODQ4.XPJNrQ._bPg104X-oY2l4mQ0ET9CwpuIzI`).then(() => {
})