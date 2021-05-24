const DiscordJS = require("discord.js")
const DisCl = new DiscordJS.Client()

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
    osu : require("./osu").Command
}


/**
 * 
 * @param {String} text 
 */
function print(text) {
    console.log(text)
}

/**
 * 
 * @param {String} text 
 * @param {String} prefix 
 */
function CheckIfIsCommand(text) {
    for (k in Commands) if (Commands[k].indexOf(text) !== -1) return k
    return false
}


DisCl.on("ready", () => {
    print(`Logged in as ${DisCl.user.tag}`)
})

DisCl.on("message", async message => {
    if (message.author.bot) return
    let prefix = "."
    let content = message.content.toLowerCase()
    let args = content.split(" ")
    let command = args.shift()

    if (!command.startsWith(prefix)) return

    command = command.substr(prefix.length)
    let commandType = CheckIfIsCommand(command)

    if (!commandType) return

    let embed = await CommandHandles[commandType](command, args)
    message.channel.send(embed)
})









DisCl.login(process.env.token || `NTg0MzIxMzY2MzA4ODE0ODQ4.XPJNrQ._bPg104X-oY2l4mQ0ET9CwpuIzI`).then(() => {
})