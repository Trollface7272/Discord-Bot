const //Constants
    Discord = require("discord.js"),
    OsuFunctions = require("./osu"),
    Database = require("./database"),
    Client = new Discord.Client(),
    db = new Database(),
    PREFIX = "!",
    FLAGS = {
        osu: [""],
        topPlays: ["g", "r", "o", "p"],
        recent: ["m"]
    },
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
    db.CheckIfNew(msgData.author.id, msgData.author.username)
    db.NewMessage(msgData.author.id, msgData.author.username)
    let
    msg = msgData.content,                  //Message text
    lcMsg = msg.toLowerCase(),              //Message text in lower case
    splitMsg = lcMsg.substr(1).split(" "),  //Message splited by spaces without prefix
    command = splitMsg.shift(),             //First index of splited message is always the command
    names = [],                             //Used to store names
    flags = [],                             //Used to store flags
    flag,                                   //Used to store flag value
    lengthLimiter = 0,                      //Used to limit the names to 5
    gameMode = GetGamemode(command),        //Get selected gamemode
    foundMode = false,                      //Variable that is set to true when flag that required another input is found
    limit = 5,                              //Limit how many plays to get
    foundFlag = false,
    stopFix = false

    if (!lcMsg.startsWith(PREFIX)) return
    switch (command) {
        //Player profile
        case "mania":
        case "ctb":
        case "taiko":
        case "osu":
            //Loop trough message for flags and usernames
            splitMsg.forEach(el => {
                lengthLimiter++ 
                if (FLAGS.osu.indexOf(el) != -1) { //Is flag check
                    flags.push(el)  
                    lengthLimiter-- //Decrement the length limiter cause flags are not users
                }
                else if (lengthLimiter > limit) {} //Can't really stop looping trough the array cause of flags so just do nothing
                else if (el.length < 3 || el.match(/[^0-9 A-z_-]/)) msgData.channel.send("**🔴 Please enter valid user.**") //Minimal username lenght is 3 | Includes forbidden characters
                else if (names.indexOf(el) != -1) {} // Username already in array
                else names.push(el) //Is username -> add to names
            })
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
            splitMsg.forEach(el => {
                lengthLimiter++ 
                if (FLAGS.osu.indexOf(el) != -1) { //Is flag check
                    flags.push(el)  
                    lengthLimiter-- //Decrement the length limiter cause flags are not users
                    foundMode = true
                }
                else if (foundMode) {
                    if (isNaN(el)) return message.channel.send("**🔴 Please enter valid gamemode.**")
                    gameMode = el
                    foundMode = false
                }
                else if (lengthLimiter > 5) {} //Can't really stop looping trough the array cause of flags so just do nothing
                else if (el.length < 3 || el.match(/[^0-9 A-z_-]/)) msgData.channel.send("**🔴 Please enter valid user.**") //Minimal username lenght is 3 | Includes forbidden characters
                else if (names.indexOf(el) != -1) {} // Username already in array
                else names.push(el) //Is username -> add to names
            })
            if (names.length < 1) names.push(db.GetOsuName(msgData.author.id))
            if (names[0] == "Not Found") return msgData.channel.send("**🔴 Please specify user or set default one usin osuset command.**")

            names.forEach(async name => {
                let recent = await Osu.GetRecentPlay(name, gameMode) //Get user data from osu api
                msgData.channel.send(recent) //Get embed from the date and send it
            }) 
            break

        case "top":
        case "ctbtop":
        case "taikotop":
        case "maniatop":
        case "osutop":
            splitMsg.forEach(el => {
                if (FLAGS.topPlays.indexOf(el) != -1) {
                    flags.push(el)
                    if (el == "g") foundFlag = true
                }
                else if (foundFlag) {
                    foundFlag = false
                    if (isNaN(el))
                        stopFix = true
                    flag = el
                }
                else if (el.length <= 3 && !isNaN(el) && el <= 100) {
                    flags.push("p")
                    flag = el
                }
                else if (el.length < 3 ) msgData.channel.send("**🔴 Please enter valid user.**")
                else if (el.match(/[^0-9 A-z_-]/)) msgData.channel.send("**🔴 Please enter valid user.**")
                else names.push(el)
            })
            if(stopFix || foundFlag) return msgData.channel.send("**🔴 Please enter a number after g tag**")
            let name = names[0] || db.GetOsuName(msgData.author.id), plays
            if (name == "Not Found") return msgData.channel.send("**🔴 Please specify user or set default one usin osuset command.**")

            if (flags.length == 0) 
                plays = await Osu.GetTopPlays(name, gameMode)
            else if (flags.indexOf("p") != -1)
                plays = await Osu.GetSpecificPlay(name, flag, gameMode)
            else if (flags.indexOf("g") != -1 && flags.indexOf("r") != -1)
                plays = await Osu.GetRecentTopPlaysGreaterThen(name, gameMode, true, flag)
            else if (flags.indexOf("g") != -1 && flags.indexOf("o") != -1)
                plays = await Osu.GetRecentTopPlaysGreaterThen(name, gameMode, false, flag)
            else if (flags.indexOf("g") != -1) 
                plays = await Osu.GetPlaysGreaterThen(name, gameMode, flag)
            else if (flags.indexOf("o") != -1) 
                plays = await Osu.GetRecentTopPlays(name, gameMode, false)
            else if (flags.indexOf("r") != -1) 
                plays = await Osu.GetRecentTopPlays(name, gameMode, true)

            msgData.channel.send(plays)
            
            //DEBUG.log("Plays", plays, DEBUG.LEVELS.INFO)
        break
        
        case "c":
        case "compare":
            let messages = await msgData.channel.messages.fetch({limit: 50})
            let map = GetMapFromMessages(messages)
            if (map == "Not Found") return msgData.channel.send("**🔴 No maps found in conversation.**")

            splitMsg.forEach(el => {
                if (FLAGS.topPlays.indexOf(el) != -1) {
                    flags.push(el)
                }
                else if (foundFlag) {
                    foundFlag = false
                }
                else if (el.length < 3 ) msgData.channel.send("**🔴 Please enter valid user.**")
                else if (el.match(/[^0-9 A-z_-]/)) msgData.channel.send("**🔴 Please enter valid user.**")
                else names.push(el)
            })
            let nam = names[0] || db.GetOsuName(msgData.author.id)
            if (nam == "Not Found") return msgData.channel.send("**🔴 Please specify user or set default one usin osuset command.**")

            msgData.channel.send(await Osu.GetUserBestOnMap(nam, map, gameMode))
            break

        case "osuset":
            if (!splitMsg[0]) return msgData.channel.send("**🔴 Please specify user.**")
            if (splitMsg[0].length < 3) return msgData.channel.send("**🔴 Please enter a valid user.**")
            db.SetOsuUsername(msgData.author.id, splitMsg[0])
            msgData.react("✔️")
            break

        default:
            break;
    }
})

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
            } else if (msg.embeds[0].description.includes("https://osu.ppy.sh/b/")) {
                x = RetardedFix(x, msg.embeds[0].description.split("https://osu.ppy.sh/b/", 2)[1].split(")")[0])
                return x
            }
        }
    })
    return x || "Not Found"
}
function RetardedFix(x,y) {
    if (x) return x
    else return y
}
[`exit`, `SIGINT`, `SIGUSR1`, `SIGUSR2`, `uncaughtException`, `SIGTERM`].forEach(eventType => {
    process.on(eventType, exitHandler.bind(null, eventType));
})
async function exitHandler(options, exitCode) {
    await db.UpdateNow()
    if (exitCode || exitCode === 0) console.log(exitCode);
    process.exit();
}

Client.login(process.env.token ||'NTg0MzIxMzY2MzA4ODE0ODQ4.XPJNrQ._bPg104X-oY2l4mQ0ET9CwpuIzI')