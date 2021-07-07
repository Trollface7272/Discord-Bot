function Main() {
    return `GIFT-${RandString(5)}-${RandString(5)}-${RandString(5)}`
}

function RandString(len) {
    let out = ""
    for(;len > 0; len--) out += String.fromCharCode(Random(65,91))
    return out
}

function Random(min, max) {
    return Math.random() * (max - min) + min;
}

module.exports = {Main}