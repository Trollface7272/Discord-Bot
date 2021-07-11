
const print = console.log
const globals = require("../globals").instance
var utils = require("./moderation-utils")
var CommandHandles = {
    retard: require("./commands/retard").Main
}

const SlashCommands = {
    retard: {
        name: "Retard",
        command: "retard",
        commandHandle: CommandHandles.retard,
        data: {
            name: "retard",
            description: "Gives the sacred roles.",
            options: [
                {
                  type: 6,
                  name: "user",
                  description: "🐒",
                  required: true
                }
            ],
        }
    }
}


async function Command(command, args, message) {
    let data = utils.ParseEverything(message, args)
    return await CommandHandles[command](data)
}

async function SlashCommand(command, interaction) {
    let data = utils.ParseEverythingSlash(interaction)
    return await SlashCommands[command]?.commandHandle(data, interaction)
}

async function AddSlashCommands() {
    for (const k in SlashCommands) {
        let data = SlashCommands[k].data
        globals.AddSlashBase().commands.post({data})
    }
}

module.exports = {Command, AddSlashCommands, SlashCommand}