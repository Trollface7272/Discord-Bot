const 
      ojsama = require("ojsama"),
      request = require("request"),
      fs = require("fs")


class ppCalculator {
    async GetFcPP(play) {
        return await PPCalc(play, true)
    }
    async GetPlayPP(play) {
        return await PPCalc(play, false)
    }
    GetFcAcc({counts}) {
        return GetFcAcc(counts)
    }
    async GetStarsWithMods(map, mods) {
        return await StarWithMods(map, mods)
    }
}
module.exports = ppCalculator


async function StarWithMods(map, mods) {
    return new Promise((resolve, reject) => {
        fs.readFile('./cache/'+map+".osu", 'utf8', async function (err,data) {
            if (err) {
                data = await GetBeatmapOsuFile(map, fc, play)
            }
            var parser = new ojsama.parser().feed(data)
            resolve(new ojsama.diff().calc({map: parser.map, mods:mods}).total)
        })
    })
}

async function PPCalc(play, fc) {
    return new Promise((resolve, reject) => {
        fs.readFile('./cache/'+play.beatmapId+".osu", 'utf8', async function (err,data) {
            if (err) {
                if (err.errno == -4058)  data = await GetBeatmapOsuFile(play.beatmapId, fc, play)
                else return console.log(err)
            }
            if (fc) resolve(GetFcPP(data, play))
            else resolve(GetPlayPP(data, play))
        })
    })
}
async function GetBeatmapOsuFile(id, fc, play) {
    return new Promise((resolve, reject) => {
        request("http://osu.ppy.sh/osu/"+id, function(err, res, body) {
            fs.writeFile("./cache/"+id+".osu", body, () => {})
            resolve(body)
        })
    })
    
}
function GetPlayPP(beatmap, play) {
    var parser = new ojsama.parser().feed(beatmap)
    return ojsama.ppv2({
        map: parser.map,
        combo: play.maxCombo,
        mods: play.raw_mods,
        acc_percent: GetPlayAcc(play.counts) * 100,
        nmiss: play.counts.miss
    }).total    
}
function GetFcPP(beatmap, play) {
    var parser = new ojsama.parser().feed(beatmap)
    return ojsama.ppv2({
        map: parser.map,
        combo: beatmap.maxCombo,
        mods: play.raw_mods,
        acc_percent: GetFcAcc(play.counts) * 100,
        nmiss: 0
    }).total
}
function GetFcAcc(counts) {
    return ((counts[300] + counts.miss) * 300 + counts[100] * 100 + counts[50] * 50) / ((counts[300] + counts[100] + counts[50] + counts.miss) * 300)
}
function GetPlayAcc(counts) {
    return (counts[300] * 300 + counts[100] * 100 + counts[50] * 50) / ((counts[300] + counts[100] + counts[50] + counts.miss) * 300)
}