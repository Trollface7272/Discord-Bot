const DiscordJS = require("discord.js")
const Client = new DiscordJS.Client()
const osu = require("./osu/osu")
const database = require("./database").instance
const emotes = require("./emotes")
const Commands = {
    osu : [
        "mania", "ctb", "taiko", "osu",
        "r", "rs", "recent",
        "top", "ctbtop", "taikotop", "maniatop", "osutop",
        "c", "compare",
        "m", "map",
        "osuset",
        "track"
    ]
}

const CommandHandles = {
    osu : osu.Command
}


const print = console.log

/**
 * 
 * @param {String} text 
 * @param {String} prefix 
 */
function CheckIfIsCommand(text) {
    for (k in Commands) if (Commands[k].indexOf(text) !== -1) return k
    return false
}


Client.on("ready", () => {
    print(`Logged in as ${Client.user.tag}`)
    emotes.instance.CreateEmotes(Client)
})

Client.on("message", async message => {
    if (message.author.bot) return
    database.UserMessage(message)
    let prefix = "."
    let content = message.content.toLowerCase()
    let args = content.split(" ")
    let command = args.shift()

    if (!command.startsWith(prefix)) return

    command = command.substr(prefix.length)
    let commandType = CheckIfIsCommand(command)

    if (!commandType) return

    let data = await CommandHandles[commandType](command, args, message), embed
    if (Array.isArray(data)) {
        data[1](message)
        embed = data[0]
    } else embed = data
    if (!embed || embed == "") embed = "Error"
    message.channel.send(embed)
});



([`exit`, `SIGINT`, `SIGUSR1`, `SIGUSR2`, `uncaughtException`, `SIGTERM`]).forEach(eventType => {
    process.on(eventType, exitHandler.bind(null, eventType));
})

async function exitHandler(options, exitCode) {
    await database.SaveData()
    if (exitCode || exitCode === 0) console.log(exitCode)
    process.exit()
}





Client.login(process.env.token || `NTg0MzIxMzY2MzA4ODE0ODQ4.XPJNrQ._bPg104X-oY2l4mQ0ET9CwpuIzI`).then(() => {
})