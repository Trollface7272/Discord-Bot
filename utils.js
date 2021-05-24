var Emotes = {}
/**
 * 
 * @param {Number} num 
 */
function ToFixedRound(num, decimals) {
    return (Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals)).toFixed(decimals)
}

/**
 * 
 * @param {Number/String} num 
 */
function FormatNumberWithCommas(num) {
    if (typeof(num) == "number") num = num.toString()
    num = num.split(".")
    let decimals = num[1] ? "." + num[1] : ""
    num = num[0]
    let formatted = ""
    for (let i = num.length-1; i >= 0; i--) formatted = ((i - num.length) % 3 == 0 && i > 0 ? "," : "") + num[i] + formatted
    return formatted + decimals
}

async function CreateEmotes(client) {
    Emotes.XH = await client.emojis.resolve("585737970816909322")
    Emotes.SH = await client.emojis.resolve("585737970246615050")
    Emotes.X  = await client.emojis.resolve("585737970384896017")
    Emotes.S  = await client.emojis.resolve("585737969885904897")
    Emotes.A  = await client.emojis.resolve("585737969927716866")
    Emotes.B  = await client.emojis.resolve("585737970150277131")
    Emotes.C  = await client.emojis.resolve("585737970200477696")
    Emotes.D  = await client.emojis.resolve("585737969877385217")
    Emotes.F  = await client.emojis.resolve("585737969877385217")    
}

function GetEmoji(emoji) {
    return Emotes[emoji]
}

module.exports = {ToFixedRound, FormatNumberWithCommas, CreateEmotes, GetEmoji}