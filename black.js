function GetSkeetKey() {
    return `GIFT-${RandString(5)}-${RandString(5)}-${RandString(5)}`
}

function RandString(len) {
    const list = "ABCDEFGHIJKLMNPQRSTUVWXYZ";
    var res = "";
    for(var i = 0; i < len; i++) {
        var rnd = Math.floor(Math.random() * list.length);
        res = res + list.charAt(rnd);
    }
    return res;
}

const timer_start = process.hrtime();

for (let i = 0; i < 500000; i++) console.log(GetSkeetKey())

const timer_end = process.hrtime(timer_start);
console.log(`Execution time: ${timer_end[0] > 0 ? timer_end[0] + ' s ' : ''}${timer_end[1] / 1000000} ms`);