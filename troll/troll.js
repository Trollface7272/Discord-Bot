const globals = require("../globals").instance
const CommandHandles = {
    skeetkey: require("./commands/skeetkey").Main
}
const SlashCommands = {
    skeetkey: {
        name: "SkeetKey",
        command: "skeetkey",
        commandHandle: CommandHandles.skeetkey,
        data: {
            name: "skeetkey",
            description: "Generate a gamesense.is key."
        }
    }
}


async function Command(command, args, message) {
    return await CommandHandles[command](args)
}

async function SlashCommand(command, interaction) {
    let args = {}
    return await SlashCommands[command]?.commandHandle()
}

async function AddSlashCommands() {
    for (const k in SlashCommands) {
        let data = SlashCommands[k].data
        globals.AddSlashBase().commands.post({data})
    }
}

module.exports = {Command, AddSlashCommands, SlashCommand}