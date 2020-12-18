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
    Osu = new OsuFunctions(Client)

var //Variables
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

    db.CheckIfNew(msgData.author.id, msgData.author.username, msgData.guild.id, msgData.guild.name)
    db.NewMessage(msgData.author.id, msgData.author.username)

    if (!msgData.content.startsWith(PREFIX)) return
    let messages, map, 
    msg = msgData.content,                  //Message text
    lcMsg = msg.toLowerCase(),              //Message text in lower case
    splitMsg = lcMsg.substr(1).split(" "),  //Message splited by spaces without prefix
    command = splitMsg.shift(),             //First index of splited message is always the command
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
        if (FLAGS.indexOf(el) != -1) { //Is flag check
            flags.push(el)  
            limit++
            if (el == "m") {
                if (!isNaN(splitMsg[i+1]))  {
                    gameMode = splitMsg[i+1]
                    i++
                } else return msgData.channel.send("**🔴 Please enter valid gamemode.**")
            } else if (el == "g") {
                if (!isNaN(splitMsg[i+1])) {
                    flagValues[flags.length-1] = splitMsg[i+1]
                    i++
                }else return msgData.channel.send("**🔴 Please enter valid number after \`g\`.**")
            }
        }
        else if (!isNaN(el) && !el.includes(".") && el <= 100 && el > 0) {
            flags.push("p")
            flagValues[flags.length-1] = el
        }
        else if (el.startsWith("+")) {
            flags.push("mods")
            flagValues[flags.length-1] = el.substr(1)
        }
        else if (el.includes(".") && !isNaN(el)) {
            flags.push("acc")
            flagValues[flags.length-1] = el
        }
        else if (limit < 1) {} //Can't really stop looping trough the array cause of flags so just do nothing
        else if (el.length < 3 || el.match(/[^0-9 A-z_-]/)) msgData.channel.send("**🔴 Please enter valid user.**") //Minimal username lenght is 3 | Includes forbidden characters
        else if (names.indexOf(el) != -1) {} // Username already in array
        else names.push(el) //Is username -> add to names
    }





    switch (command) {
        //Player profile
        case "mania":
        case "ctb":
        case "taiko":
        case "osu":
            if (names.length < 1) names.push(db.GetOsuName(msgData.author.id)) 
            if (names[0] == "Not Found") return msgData.channel.send("**🔴 Please specify user or set default one usin osuset command.**")
            //Loop trough names & get userdata
            names.forEach(async name => {
                let profile = await Osu.GetOsuProfile(name, gameMode) //Get user data from osu api
                msgData.channel.send(profile) //Get embed from the date and send it
            })    
            break
        
        case "r":
        case "rs":
        case "recent":
            if (names.length < 1) names.push(db.GetOsuName(msgData.author.id))
            if (names[0] == "Not Found") return msgData.channel.send("**🔴 Please specify user or set default one usin osuset command.**")

            names.forEach(async name => {
                let recent
                if (flags.indexOf("b") != -1 && flags.indexOf("g") != -1) recent = await Osu.GetRecentBestGreaterThen(name, gameMode, flagValues[flags.indexOf("g")])
                else if (flags.indexOf("b") != -1) recent = await Osu.GetRecentBest(name, gameMode)
                else if (flags.indexOf("d") != -1) recent = await Osu.GetRecentDetailed(name, gameMode)
                else recent = await Osu.GetRecentPlay(name, gameMode) //Get user data from osu api
                msgData.channel.send(recent) //Get embed from the date and send it
            }) 
            break

        case "top":
        case "ctbtop":
        case "taikotop":
        case "maniatop":
        case "osutop":
            if(stopFix || foundFlag) return msgData.channel.send("**🔴 Please enter a number after g tag**")
            let name = names[0] || db.GetOsuName(msgData.author.id), plays
            if (name == "Not Found") return msgData.channel.send("**🔴 Please specify user or set default one using osuset command.**")

            if (flags.length == 0) 
                plays = await Osu.GetTopPlays(name, gameMode)
            else if (flags.indexOf("p") != -1)
                plays = await Osu.GetSpecificPlay(name, flagValues[flags.indexOf("p")], gameMode)
            else if (flags.indexOf("g") != -1 && flags.indexOf("r") != -1)
                plays = await Osu.GetRecentTopPlaysGreaterThen(name, gameMode, true, flagValues[flags.indexOf("g")])
            else if (flags.indexOf("g") != -1 && flags.indexOf("o") != -1)
                plays = await Osu.GetRecentTopPlaysGreaterThen(name, gameMode, false, flagValues[flags.indexOf("g")])
            else if (flags.indexOf("g") != -1) 
                plays = await Osu.GetPlaysGreaterThen(name, gameMode, flagValues[flags.indexOf("g")])
            else if (flags.indexOf("o") != -1) 
                plays = await Osu.GetRecentTopPlays(name, gameMode, false)
            else if (flags.indexOf("r") != -1) 
                plays = await Osu.GetRecentTopPlays(name, gameMode, true)

            msgData.channel.send(plays)
            
            //DEBUG.log("Plays", plays, DEBUG.LEVELS.INFO)
        break
        
        case "c":
        case "compare":
            messages = await msgData.channel.messages.fetch({limit: 50})
            map = GetMapFromMessages(messages)
            if (map == "Not Found") return msgData.channel.send("**🔴 No maps found in conversation.**")

            let nam = names[0] || db.GetOsuName(msgData.author.id)
            if (nam == "Not Found") return msgData.channel.send("**🔴 Please specify user or set default one usin osuset command.**")

            msgData.channel.send(await Osu.GetUserBestOnMap(nam, map, gameMode))
            break

        case "m":
        case "map":
            messages = await msgData.channel.messages.fetch({limit: 50})
            map = GetMapFromMessages(messages)
            let mods = flags.indexOf("mods") != -1 ? flagValues[flags.indexOf("mods")] : 0
            if (map == "Not Found") return msgData.channel.send("**🔴 No maps found in conversation.**")
            msgData.channel.send(await Osu.GetMap(map, gameMode, mods, flags.indexOf("acc") != -1 ? flagValues[flags.indexOf("acc")] : undefined))
            break

        case "osuset":
            if (!splitMsg[0]) return msgData.channel.send("**🔴 Please specify user.**")
            if (splitMsg[0].length < 3) return msgData.channel.send("**🔴 Please enter a valid user.**")
            db.SetOsuUsername(msgData.author.id, splitMsg[0])
            msgData.react("✔️")
            break

        case "track": 
            db.AddToTracking(Osu.GetOsuPlayerId(names[0]), msgData.channel.id, msgData.guild.id, names[0], gameMode, flagValues[flags.indexOf("p")])
        break

        default:
            break;
    }
})

async function OsuTracking() {
    
}
setInterval(OsuTracking, 6000)

function GetGamemode(name) {
    switch(name) {
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
        if (msg.embeds.length != 0) {
            if (msg.embeds[0].author && msg.embeds[0].author.url && msg.embeds[0].author.url.startsWith("https://osu.ppy.sh/b/")) {
                x = RetardedFix(x, msg.embeds[0].author && msg.embeds[0].author.url.split("https://osu.ppy.sh/b/")[1])
                return x
            } else if (msg.embeds[0].description && msg.embeds[0].description.includes("https://osu.ppy.sh/b/")) {
                x = RetardedFix(x, msg.embeds[0].description.split("https://osu.ppy.sh/b/", 2)[1].split(")")[0])
                return x
            }
        }
    })
    return x || "Not Found"
}
function RetardedFix(x,y) {
    return x || y
}
[`exit`, `SIGINT`, `SIGUSR1`, `SIGUSR2`, `uncaughtException`, `SIGTERM`].forEach(eventType => {
    process.on(eventType, exitHandler.bind(null, eventType));
})
async function exitHandler(options, exitCode) {
    await db.UpdateNow()
    if (exitCode || exitCode === 0) console.log(exitCode)
    process.exit()
}

Client.login(process.env.token ||'NTg0MzIxMzY2MzA4ODE0ODQ4.XPJNrQ._bPg104X-oY2l4mQ0ET9CwpuIzI')