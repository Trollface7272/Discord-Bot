const DiscordJS = require("discord.js")
const Client = new DiscordJS.Client()
const globals = require("./globals").instance
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
    ],
    moderation: [
        "retard"
    ],
    troll: [
        "skeetkey"
    ]
}
const SlashCommands = {
    /*osu : [
        "mania", "ctb", "taiko", "osu",
        "r", "rs", "recent",
        "top", "ctbtop", "taikotop", "maniatop", "osutop",
        "c", "compare",
        "m", "map",
        "osuset",
        "track"
    ],*/
    moderation: [
        "retard"
    ],
    troll: [
        "skeetkey"
    ]
}

const CommandModules = {
    osu: require("./osu/osu"),
    moderation: require("./moderation/moderation"),
    troll: require("./troll/troll"),
}

const CommandHandles = {
    osu : CommandModules.osu.Command,
    moderation: CommandModules.moderation.Command,
    troll: CommandModules.troll.Command,
}
const SlashCommandHandles = {
    osu : CommandModules.osu.SlashCommand,
    moderation: CommandModules.moderation.SlashCommand,
    troll: CommandModules.troll.SlashCommand,
}


const print = console.log

/**
 * @param {String} text 
 */
function CheckIfIsCommand(text) {
    for (k in Commands) if (Commands[k].indexOf(text) !== -1) return k
    return false
}

/**
 * @param {String} text 
 */
function CheckIfIsSlashCommand(text) {
    for (k in SlashCommands) if (SlashCommands[k].indexOf(text) !== -1) return k
    return false
}


Client.on("ready", () => {
    print(`Logged in as ${Client.user.tag}`)
    emotes.instance.CreateEmotes(Client)
    globals.client = Client
    globals.SetClient(Client)
    AddSlashCommands()
})

Client.ws.on('INTERACTION_CREATE', async interaction => {
    let cmd = CheckIfIsSlashCommand(interaction.data.name)

    if (!cmd) return Client.api.interactions(interaction.id, interaction.token).callback.post({data: {
        type: 4,
        data: {
            content: 'Unknown command'
        }
    }})
    let resp = await SlashCommandHandles[cmd](interaction.data.name, interaction)
    let out
    resp.forEach(el => {
        if (typeof el == "string") out = el
        else if (typeof el == "function") el(interaction)
    })
    
    Client.api.interactions(interaction.id, interaction.token).callback.post({data: {
        type: 4,
        data: {
            content: out || "Unknown error"
        }
    }})
})

Client.on("message", async message => {
    if (message.author.bot) return
    globals.database.UserMessage(message)
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
        for (let i = 0; i < data.length; i++) {
            const el = data[i];
            if (typeof el == "string") message.channel.send(el)
            else if (typeof el == "function") el(message)
        }
        return
    } else embed = data
    if (!embed || embed == "") embed = "Error"
    message.channel.send(embed)
})

function AddSlashCommands() {
    for (const k in CommandModules) {
        let v = CommandModules[k]
        if (v.AddSlashCommands) v.AddSlashCommands()
    }
}


;([`exit`, `SIGINT`, `SIGUSR1`, `SIGUSR2`, `uncaughtException`, `SIGTERM`]).forEach(eventType => {
    process.on(eventType, exitHandler.bind(null, eventType));
})

async function exitHandler(options, exitCode) {
    try {
        await globals.database.SaveData()
        if (exitCode || exitCode === 0) console.log(exitCode)
        process.exit()
    } catch(err) {
        print(error.message)
        process.exit()
    }
}





Client.login(process.env.token || `NTg0MzIxMzY2MzA4ODE0ODQ4.XPJNrQ._bPg104X-oY2l4mQ0ET9CwpuIzI`).then(() => {
})