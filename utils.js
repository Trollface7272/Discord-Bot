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

module.exports = {ToFixedRound, FormatNumberWithCommas}