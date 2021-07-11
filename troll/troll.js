const globals = require("../globals").instance
const discord = require("discord.js")
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
    return (await SlashCommands[command]?.commandHandle()) || ["Error"]
}

async function AddSlashCommands() {
    for (const k in SlashCommands) {
        let data = SlashCommands[k].data
        globals.AddSlashBase().commands.post({data})
    }
}

/**
 * 
 * @param {discord.Message} message 
 */
function ParseMessage(message) {
    let out = {
        user: {
            id: message.author.id,
            raw_user: message.author,
            raw_member: message.member
        }
    }
    return out
}

function ParseInteraction(interaction) {
    print(interaction)
    let out = {
        user: {
            id: message.author.id,
            raw_user: message.author,
            raw_member: message.member
        }
    }
    return out
}

module.exports = {Command, AddSlashCommands, SlashCommand}