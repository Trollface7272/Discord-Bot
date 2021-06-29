const ojsama = require("ojsama")
const request = require("request")
const fs = require("fs")
const print = console.log
const BitMods = {
    None: 0,
    NoFail: 1 << 0,
    Easy: 1 << 1,
    TouchDevice: 1 << 2,
    Hidden: 1 << 3,
    HardRock: 1 << 4,
    SuddenDeath: 1 << 5,
    DoubleTime: 1 << 6,
    Relax: 1 << 7,
    HalfTime: 1 << 8,
    Nightcore: 1 << 9, // Only set along with DoubleTime. i.e: NC only gives 576
    Flashlight: 1 << 10,
    Autoplay: 1 << 11,
    SpunOut: 1 << 12,
    Relax2: 1 << 13,    // Autopilot
    Perfect: 1 << 14, // Only set along with SuddenDeath. i.e: PF only gives 16416
    Key4: 1 << 15,
    Key5: 1 << 16,
    Key6: 1 << 17,
    Key7: 1 << 18,
    Key8: 1 << 19,
    FadeIn: 1 << 20,
    Random: 1 << 21,
    Cinema: 1 << 22,
    Target: 1 << 23,
    Key9: 1 << 24,
    KeyCoop: 1 << 25,
    Key1: 1 << 26,
    Key3: 1 << 27,
    Key2: 1 << 28,
    ScoreV2: 1 << 29,
    Mirror: 1 << 30
}
const OD0_MS = 80
const OD10_MS = 20
const AR0_MS = 1800
const AR5_MS = 1200
const AR10_MS = 450
const OD_MS_STEP = (OD0_MS - OD10_MS) / 10.0
const AR_MS_STEP1 = (AR0_MS - AR5_MS) / 5.0
const AR_MS_STEP2 = (AR5_MS - AR10_MS) / 5.0
const basePath = "./cache/maps/0/"

class ppCalculator {
    constructor() {
        let path = "."
        let split = basePath.split("/")
        for (let i = 1; i < split.length; i++) {
            const el = split[i]
            if (!fs.existsSync(path + "/" + el))
            fs.mkdirSync(path + "/" + el)
            path += "/" + el
        }
    }
    async GetFcPP(play) {
        return await PPCalc(play, true)
    }

    async GetPlayPP(play) {
        return await PPCalc(play, false)
    }

    async GetSpecificAccPP(map, acc, mods) {
        return await SpecificAccPP(map, acc, mods)
    }

    GetFcAcc({counts}) {
        return GetFcAcc(counts)
    }

    async GetStarsWithMods(map, mods) {
        return await StarWithMods(map, mods)
    }

    ParseMods(mods) {
        return ojsama.modbits.from_string(mods)
    }

    GetDifficultyValues(difficulty, mods) {
        return GetDiffRating(difficulty, mods)
    }
}

module.exports = ppCalculator


async function StarWithMods(map, mods) {
    return new Promise((resolve) => {
        fs.readFile(basePath + map + ".osu", 'utf8', async function (err, data) {
            if (err) {
                data = await GetBeatmapOsuFile(map)
            }
            const parser = new ojsama.parser().feed(data);
            resolve(new ojsama.diff().calc({map: parser.map, mods: mods}).total)
        })
    })
}

async function SpecificAccPP(map, acc, mods) {
    return new Promise((resolve) => {
        fs.readFile(basePath + map.id + ".osu", 'utf8', async function (err, data) {
            if (err) {
                data = await GetBeatmapOsuFile(map.id)
            }
            resolve(GetAccPP(data, acc, mods))
        })
    })
}

async function PPCalc(play, fc) {
    return new Promise((resolve) => {
        fs.readFile(basePath + play.beatmapId + ".osu", 'utf8', async function (err, data) {
            if (err) {
                data = await GetBeatmapOsuFile(play.beatmapId)
            }
            if (fc) resolve(GetFcPP(data, play))
            else resolve(GetPlayPP(data, play))
        })
    })
}

async function GetBeatmapOsuFile(id) {
    return new Promise((resolve) => {
        request("http://osu.ppy.sh/osu/" + id, function (err, res, body) {
            fs.writeFile(basePath + id + ".osu", body, (err) => {
                if (err) console.log(err)
            })
            resolve(body)
        })
    })

}

function GetPlayPP(beatmap, play) {
    const parser = new ojsama.parser().feed(beatmap);
    return ojsama.ppv2({
        map: parser.map,
        combo: play.maxCombo,
        mods: play.raw_mods,
        acc_percent: GetPlayAcc(play.counts) * 100,
        nmiss: play.counts.miss
    }).total
}

function GetFcPP(beatmap, play) {
    const parser = new ojsama.parser().feed(beatmap);
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

function GetAccPP(beatmap, acc, mods) {
    const parser = new ojsama.parser().feed(beatmap);
    return ojsama.ppv2({
        map: parser.map,
        combo: beatmap.maxCombo,
        mods: mods,
        acc_percent: acc,
        nmiss: 0
    }).total
}

function GetPlayAcc(counts) {
    return (counts[300] * 300 + counts[100] * 100 + counts[50] * 50) / ((counts[300] + counts[100] + counts[50] + counts.miss) * 300)
}

function GetDiffRating(difficulty, mods) {
    let speed = 1, multiplier = 1

    if (mods & BitMods.DoubleTime) speed = 1.5
    else {
        if (mods & BitMods.HalfTime) speed = 0.75
    }

    if (mods & BitMods.HardRock) {
        multiplier = 1.4
        difficulty.size *= 1.3
        difficulty.size = Math.min(10, difficulty.size)
    } else {
        if (mods & BitMods.Easy) {
            multiplier = 0.5
            difficulty.size *= 1.3
        }
    }
    difficulty.drain *= multiplier;
    difficulty.drain = Math.min(10.0, difficulty.drain);
    difficulty.approach = modify_ar(difficulty.approach, speed, multiplier)
    difficulty.overall = modify_od(difficulty.overall, speed, multiplier)
    return difficulty
}

function modify_ar(base_ar, speed_mul, multiplier) {
    let ar = base_ar;
    ar *= multiplier

    // convert AR into milliseconds window

    let arms = (
        ar < 5.0 ?
            AR0_MS - AR_MS_STEP1 * ar
            : AR5_MS - AR_MS_STEP2 * (ar - 5.0)
    );

    // stats must be capped to 0-10 before HT/DT which
    // brings them to a range of -4.42->11.08 for OD and
    // -5->11 for AR

    arms = Math.min(AR0_MS, Math.max(AR10_MS, arms))
    arms /= speed_mul

    ar = (
        arms > AR5_MS ?
            (AR0_MS - arms) / AR_MS_STEP1
            : 5.0 + (AR5_MS - arms) / AR_MS_STEP2
    )
    return ar
}

function modify_od(base_od, speed_mul, multiplier) {
    let od = base_od;
    od *= multiplier
    let odms = OD0_MS - Math.ceil(OD_MS_STEP * od);
    odms = Math.min(OD0_MS, Math.max(OD10_MS, odms))
    odms /= speed_mul
    od = (OD0_MS - odms) / OD_MS_STEP
    return od
}