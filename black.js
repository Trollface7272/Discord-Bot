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
const timer_start = process.hrtime();
let out = ""
for (let i = 0; i < 500000; i++) out += Main() + "\n"
console.log(out);
const timer_end = process.hrtime(timer_start);
console.log(`Execution time: ${timer_end[0] > 0 ? timer_end[0] + ' s ' : ''}${timer_end[1] / 1000000} ms`);