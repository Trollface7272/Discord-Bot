const request = require("request")
const fs = require("fs")
const NodeOsu = require("node-osu")
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
const basePath = "./cache/maps/2/"

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

    /**
     * 
     * @param {NodeOsu.Beatmap} beatmap 
     * @param {NodeOsu.Score} score 
     */
    GetFcPP(score, beatmap) {
        score.counts[300] += score.counts.katu + score.counts.miss
        score.counts.katu = 0
        score.counts.miss = 0
        score.maxCombo = beatmap.maxCombo
        return CalculateCtbpp(score, beatmap)
    }
    async GetFcAcc(score) {

    }
    GetPlayPP(score, beatmap) {
        return CalculateCtbpp(score, beatmap)
    }
}

module.exports = ppCalculator



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


/**
 * 
 * @param {NodeOsu.Beatmap} map 
 * @param {NodeOsu.Score} score 
 */
function CalculateCtbpp(score, map) {
    const aim = map.difficulty.aim
    const counts = score.counts
    const combo = score.maxCombo
    const ar = map.difficulty.approach
    const mods = score.raw_mods
	// We are heavily relying on aim in catch the beat
	let _value = Math.pow(5 * Math.max(1, aim / 0.0049) - 4, 2) / 100000

	// Longer maps are worth more. "Longer" means how many hits there are which can contribute to combo
	let numTotalHits = counts[300] + counts[100] + counts.miss

	// Longer maps are worth more
	let lengthBonus =
		0.95 + 0.3 * Math.min(1, numTotalHits / 2500) +
		(numTotalHits > 2500 ? Math.log10(numTotalHits / 2500) * 0.475 : 0)

	// Longer maps are worth more
	_value *= lengthBonus

	// Penalize misses exponentially. This mainly fixes tag4 maps and the likes until a per-hitobject solution is available
	_value *= Math.pow(0.97, counts.miss)

	// Combo scaling
	let beatmapMaxCombo = map.maxCombo
	if (beatmapMaxCombo > 0)
		_value *= Math.min(Math.pow(combo, 0.8) / Math.pow(beatmapMaxCombo, 0.8), 1)

	let approachRate = ar
	let approachRateFactor = 1
	if (approachRate > 9)
		approachRateFactor += 0.1 * (approachRate - 9.0) // 10% for each AR above 9
	if (approachRate > 10)
		approachRateFactor += 0.1 * (approachRate - 10) // Additional 10% at AR 11, 30% total
	else if (approachRate < 8)
		approachRateFactor += 0.025 * (8.0 - approachRate) // 2.5% for each AR below 8

	_value *= approachRateFactor;

	if ((mods & BitMods.Hidden) > 0)
	{
		// Hiddens gives almost nothing on max approach rate, and more the lower it is
		if (approachRate <= 10)
			_value *= 1.05 + 0.075 * (10.0 - approachRate) // 7.5% for each AR below 10
		else if (approachRate > 10)
			_value *= 1.01 + 0.04 * (11 - Math.min(11, approachRate)) // 5% at AR 10, 1% at AR 11
	}

	if ((mods & BitMods.Flashlight) > 0)
		// Apply length bonus again if flashlight is on simply because it becomes a lot harder on longer maps.
		_value *= 1.35 * lengthBonus

	// Scale the aim value with accuracy _slightly_
	_value *= Math.pow((counts[50] + counts[100] + counts[300]) / (counts[50] + counts[100] + counts[300] + counts.miss + counts.katu), 5.5)

	// Custom multipliers for NoFail and SpunOut.
	if ((mods & BitMods.NoFail) > 0)
		_value *= 0.90

	if ((mods & BitMods.SpunOut) > 0)
		_value *= 0.95
    return _value
}