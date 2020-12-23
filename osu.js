const
    BitMods = {
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
    },
    BitModsArr = [
        None = 0,
        NoFail = 1 << 0,
        Easy = 1 << 1,
        TouchDevice = 1 << 2,
        Hidden = 1 << 3,
        HardRock = 1 << 4,
        SuddenDeath = 1 << 5,
        DoubleTime = 1 << 6,
        Relax = 1 << 7,
        HalfTime = 1 << 8,
        Nightcore = 1 << 9, // Only set along with DoubleTime. i.e: NC only gives 576
        Flashlight = 1 << 10,
        Autoplay = 1 << 11,
        SpunOut = 1 << 12,
        Relax2 = 1 << 13,    // Autopilot
        Perfect = 1 << 14, // Only set along with SuddenDeath. i.e: PF only gives 16416
        Key4 = 1 << 15,
        Key5 = 1 << 16,
        Key6 = 1 << 17,
        Key7 = 1 << 18,
        Key8 = 1 << 19,
        FadeIn = 1 << 20,
        Random = 1 << 21,
        Cinema = 1 << 22,
        Target = 1 << 23,
        Key9 = 1 << 24,
        KeyCoop = 1 << 25,
        Key1 = 1 << 26,
        Key3 = 1 << 27,
        Key2 = 1 << 28,
        ScoreV2 = 1 << 29,
        Mirror = 1 << 30
    ],
    ModNames = ["Standard", "Taiko", "Catch the Beat!", "Mania"],
    ModLinkNames = ["osu", "taiko", "fruits", "mania"],
    Discord = require("discord.js"),
    NodeOsu = require("node-osu"),
    OsuApi = new NodeOsu.Api('d3bb61f11b973d6c2cdc0dd9ea7998c2a0b15c1e', {
        notFoundAsError: true,
        completeScores: false,
        parseNumeric: true
    }),
    moment = require("moment"),
    ppcalc = require("./calculator"),
    Calculator = new ppcalc()


class Osu {
    Client

    constructor(client) {
        this.Client = client
    }

    /**
     * @param {String} user
     * @param {Number | (0 | 1 | 2 | 3)} [mode=0] - Gamemode to query for 0=std, 1=taiko, 2=ctb, 3=mania, defaults at 0
     */
    async GetOsuProfile(user, mode) {
        if (!mode) mode = 0
        try {
            let profile = await OsuApi.getUser({u: user, m: mode}),
                level = ((profile.level - Math.floor(profile.level)).toFixed(4) * 100).toFixed(2),
                pp = TwoDigitValue(profile.pp.raw),
                accuracy = TwoDigitValue(profile.accuracy),
                description = `**▸ Official Rank:** #${profile.pp.rank} (${profile.country}#${profile.pp.countryRank})\n`
            description += `**▸ Level:** ${parseInt(profile.level)} (${level}%)\n`
            description += `**▸ Total PP:** ${pp}\n`
            description += `**▸ Hit Accuracy:** ${accuracy}%\n`
            description += `**▸ Playcount:** ${profile.counts.plays}`

            return new
            Discord.MessageEmbed()
                .setAuthor(`${ModNames[mode]} Profile for ${profile.name}`, `https://www.countryflags.io/${profile.country.toLowerCase()}/flat/64.png`, `https://osu.ppy.sh/users/${profile.id}/${ModLinkNames[mode]}`)
                .setDescription(description)
                .setFooter(`On osu! Official Server`)
                .setThumbnail(`http://s.ppy.sh/a/${profile.id}`)
        } catch (error) {
            if (error instanceof Error && error.message === "Not found") {
                return `**🔴 ${user} not found.**`
            } else DEBUG.log("Error in GetOsuProfile", error.message, DEBUG.LEVELS.ERRORS)
        }
    }

    /**
     * @param {String} user
     * @param {Number | (0 | 1 | 2 | 3)} [mode=0] - Gamemode to query for 0=std, 1=taiko, 2=ctb, 3=mania, defaults at 0
     */
    async GetRecentPlay(user, mode) {
        if (!mode) mode = 0
        let profile, recentList, beatmap, description,
            tries = 0
        try {
            profile = await OsuApi.getUser({u: user, m: mode})
        } catch (error) {
            if (error instanceof Error && error.message === "Not found") {
                return `**🔴 ${user} not found.**`
            } else DEBUG.log("Error in GetRecentPlay - Profile", error.message, DEBUG.LEVELS.ERRORS)
            return
        }
        try {
            recentList = await OsuApi.getUserRecent({u: user, m: mode, limit: 50})
        } catch (error) {
            if (error instanceof Error && error.message === "Not found") {
                return `**🔴 ${profile.name} has no recent plays.**`
            } else DEBUG.log("Error in GetRecentPlay - Recent", error.message, DEBUG.LEVELS.ERRORS)
            return
        }
        let recent = recentList[0]
        // noinspection JSCheckFunctionSignatures
        beatmap = (await OsuApi.getBeatmaps({
            "b": recent.beatmapId,
            "mods": RemoveNonDiffMods(recent.raw_mods),
            "a": 1,
            "m": mode
        }))[0]

        for (let i = 0; i < recentList.length; i++) {
            if (recentList[i].beatmapId === recent.beatmapId) tries++
            else break
        }

        let fcppDisplay = ""
        if (recent.maxCombo < beatmap.maxCombo - 15 || recent.counts.miss > 0) fcppDisplay = `(${TwoDigitValue(await Calculator.GetFcPP(recent))}pp for ${TwoDigitValue(Calculator.GetFcAcc(recent) * 100)}% FC) `
        description = `▸ ${await this.Client.emojis.resolve(GetRankingEmote(recent.rank))} ▸ **${TwoDigitValue(await Calculator.GetPlayPP(recent))}pp** ${fcppDisplay}▸ ${TwoDigitValue(CalculateAcc(recent.counts) * 100)}%\n`
        description += `▸ ${recent.score} ▸ x${recent.maxCombo}/${beatmap.maxCombo} ▸ [${recent.counts[300]}/${recent.counts[100]}/${recent.counts[50]}/${recent.counts.miss}]`


        if (beatmap.objects.normal + beatmap.objects.slider + beatmap.objects.spinner !== recent.counts[300] + recent.counts[100] + recent.counts[50] + recent.counts.miss)
            description += `\n▸ **Map Completion:** ${TwoDigitValue((recent.counts[300] + recent.counts[100] + recent.counts[50] + recent.counts.miss) / (beatmap.objects.normal + beatmap.objects.slider + beatmap.objects.spinner) * 100)}%`


        return new Discord.MessageEmbed()
            .setAuthor(`${beatmap.title} [${beatmap.version}] +${GetModsFromRaw(recent.raw_mods)} [${TwoDigitValue(beatmap.difficulty.rating)}★]`, `http://s.ppy.sh/a/${profile.id}`, `https://osu.ppy.sh/b/${beatmap.id}`)
            .setThumbnail(`https://b.ppy.sh/thumb/${beatmap.beatmapSetId}l.jpg`)
            .setDescription(description)
            .setFooter(`Try #${tries} | ${DateDiff(new moment(recent.date), new moment(Date.now()))}Ago On osu! Official Server`)

    }

    /**
     * @param {String} user
     * @param {Number | (0 | 1 | 2 | 3)} [mode=0] - Gamemode to query for 0=std, 1=taiko, 2=ctb, 3=mania, defaults at 0
     */
    async GetTopPlays(user, mode) {
        if (!mode) mode = 0
        let topPlays, profile
        try {
            profile = await OsuApi.getUser({u: user, m: mode})
        } catch (error) {
            if (error instanceof Error && error.message === "Not found") {
                return `**🔴 ${user} not found.**`
            } else DEBUG.log("Error in GetRecentPlay - Recent", error.message, DEBUG.LEVELS.ERRORS)
            return
        }
        try {
            topPlays = await OsuApi.getUserBest({u: user, m: mode, limit: 5})
        } catch (error) {
            if (error instanceof Error && error.message === "Not found") {
                return `${profile.name} has no top plays.`
            } else DEBUG.log("Error in GetRecentPlay - Recent", error.message, DEBUG.LEVELS.ERRORS)
            return
        }
        for (let i = 0; i < topPlays.length; i++) {
            topPlays[i].index = i + 1
        }
        let author = [`Top 5 ${ModNames[mode]} Plays for ${profile.name}`, `https://osu.ppy.sh/users/${profile.id}/${ModLinkNames[mode]}`]
        return this.PlaysToEmbed(topPlays, profile, author, mode)
    }

    /**
     * @param {String} user
     * @param {Number | (0 | 1 | 2 | 3)} [mode=0] - Gamemode to query for 0=std, 1=taiko, 2=ctb, 3=mania, defaults at 0
     * @param {Boolean} [sort=true] - Sort by newest -> true
     */
    async GetRecentTopPlays(user, mode, sort) {
        if (sort === undefined) sort = true
        if (!mode) mode = 0
        let topPlays, profile
        try {
            profile = await OsuApi.getUser({u: user, m: mode})
        } catch (error) {
            if (error instanceof Error && error.message === "Not found") {
                return `**🔴 ${user} not found.**`
            } else DEBUG.log("Error in GetRecentPlay - Recent", error.message, DEBUG.LEVELS.ERRORS)
            return
        }
        try {
            topPlays = await OsuApi.getUserBest({u: user, m: mode, limit: 100})
        } catch (error) {
            if (error instanceof Error && error.message === "Not found") {
                return `${profile.name} has no top plays.`
            } else DEBUG.log("Error in GetRecentPlay - Recent", error.message, DEBUG.LEVELS.ERRORS)
            return
        }
        for (let i = 0; i < topPlays.length; i++)
            topPlays[i].index = i + 1

        topPlays.sort(function (a, b) {
            const dateA = new Date(a.date), dateB = new Date(b.date);
            return sort ? dateB - dateA : dateA - dateB
        })
        let sortedPlays = []
        for (let i = 0; i < 5; i++)
            sortedPlays.push(topPlays[i])

        let author = [`5 Recent ${ModNames[mode]} Top Plays for ${profile.name}`, `https://osu.ppy.sh/users/${profile.id}/${ModLinkNames[mode]}`]
        return this.PlaysToEmbed(sortedPlays, profile, author, mode)
    }

    /**
     * @param {String} user
     * @param {Number | (0 | 1 | 2 | 3)} [mode=0] - Gamemode to query for 0=std, 1=taiko, 2=ctb, 3=mania, defaults at 0
     * @param {Boolean} [sort=true] - Sort by newest -> true
     * @param {Number} amount
     */
    async GetRecentTopPlaysGreaterThen(user, mode, sort, amount) {
        if (sort === undefined) sort = true
        if (!mode) mode = 0
        let topPlays, profile
        try {
            profile = await OsuApi.getUser({u: user, m: mode})
        } catch (error) {
            if (error instanceof Error && error.message === "Not found") {
                return `**🔴 ${user} not found.**`
            } else DEBUG.log("Error in GetRecentPlay - Recent", error.message, DEBUG.LEVELS.ERRORS)
            return
        }
        try {
            topPlays = await OsuApi.getUserBest({u: user, m: mode, limit: 100})
        } catch (error) {
            if (error instanceof Error && error.message === "Not found") {
                return `${profile.name} has no top plays.`
            } else DEBUG.log("Error in GetRecentPlay - Recent", error.message, DEBUG.LEVELS.ERRORS)
            return
        }
        for (let i = 0; i < topPlays.length; i++) {
            topPlays[i].index = i + 1
        }
        topPlays.sort(function (a, b) {
            const dateA = new Date(a.date), dateB = new Date(b.date);
            return sort ? dateB - dateA : dateA - dateB
        })
        let sortedPlays = []
        for (let i = 0; i < topPlays.length; i++) {
            if (topPlays[i].pp > amount) sortedPlays.push(topPlays[i])
            if (sortedPlays.length >= 5) break
        }
        let author = [`5 Recent ${ModNames[mode]} Top Plays for ${profile.name}`, `https://osu.ppy.sh/users/${profile.id}/${ModLinkNames[mode]}`]
        return this.PlaysToEmbed(sortedPlays, profile, author, mode)
    }

    /**
     * @param {Score[]} plays
     * @param profile
     * @param author
     * @param {Number | (0 | 1 | 2 | 3)} [mode=0] - Gamemode to query for 0=std, 1=taiko, 2=ctb, 3=mania, defaults at 0
     */
    async PlaysToEmbed(plays, profile, author, mode) {
        let description = ""
        for (let i = 0; i < plays.length; i++) {
            const play = plays[i]

            // noinspection JSCheckFunctionSignatures
            let map = (await OsuApi.getBeatmaps({
                b: play.beatmapId,
                mods: RemoveNonDiffMods(play.raw_mods),
                a: 1,
                m: mode
            }))[0]
            let fcppDisplay = ""
            if (play.maxCombo < map.maxCombo - 15 || play.counts.miss > 0 && mode !== 3) fcppDisplay = `(${TwoDigitValue(await Calculator.GetFcPP(play))}pp for ${TwoDigitValue(Calculator.GetFcAcc(play) * 100)}% FC) `

            description += `**${play.index}. [${map.title} [${map.version}]](https://osu.ppy.sh/b/${map.id}) +${GetModsFromRaw(play.raw_mods)}** [${TwoDigitValue(map.difficulty.rating)}★]\n`
            description += `▸ ${await this.Client.emojis.resolve(GetRankingEmote(play.rank))} ▸ **${TwoDigitValue(play.pp)}pp** ${fcppDisplay}▸ ${TwoDigitValue(CalculateAcc(play.counts) * 100)}%\n`
            description += `▸ ${play.score} ▸ x${play.maxCombo}/${map.maxCombo} ▸ [${play.counts[300]}/${play.counts[100]}/${play.counts[50]}/${play.counts.miss}]\n`
            description += `▸ Score Set ${DateDiff(new moment(play.date), new moment(Date.now()))}Ago\n`
        }
        return new
        Discord.MessageEmbed()
            .setAuthor(author[0], `https://www.countryflags.io/${profile.country.toLowerCase()}/flat/64.png`, author[1])
            .setDescription(description)
            .setFooter("On osu! Official Server")
            .setThumbnail(`http://s.ppy.sh/a/${profile.id}`)
    }

    /**
     * @param {String} user
     * @param {Number | (0 | 1 | 2 | 3)} [mode=0] - Gamemode to query for 0=std, 1=taiko, 2=ctb, 3=mania, defaults at 0
     * @param {Number} ammount
     */
    async GetPlaysGreaterThen(user, mode, ammount) {
        if (!mode) mode = 0
        let profile, topPlays, counter = 0
        try {
            profile = await OsuApi.getUser({u: user, m: mode})
        } catch (error) {
            if (error instanceof Error && error.message === "Not found") {
                return `**🔴 ${user} not found.**`
            } else DEBUG.log("Error in GetRecentPlay - Recent", error.message, DEBUG.LEVELS.ERRORS)
            return
        }
        try {
            topPlays = await OsuApi.getUserBest({u: user, m: mode, limit: 100})
        } catch (error) {
            if (error instanceof Error && error.message === "Not found") {
                return `${profile.name} has no top plays.`
            } else DEBUG.log("Error in GetRecentPlay - Recent", error.message, DEBUG.LEVELS.ERRORS)
            return
        }
        for (let i = 0; i < topPlays.length; i++) {
            const play = topPlays[i];
            if (play.pp > ammount) counter++
        }
        return `**${profile.name} has ${counter} plays worth more then ${parseFloat(ammount+"").toFixed(2)}pp**`
    }

    async GetUserBestOnMap(user, map, mode) {
        let profile, scores, beatmap = (await OsuApi.getBeatmaps({b: map}))[0]
        try {
            profile = await OsuApi.getUser({u: user, m: mode})
        } catch (error) {
            if (error instanceof Error && error.message === "Not found") {
                return `**🔴 ${user} not found.**`
            } else DEBUG.log("Error in GetRecentPlay - Recent", error.message, DEBUG.LEVELS.ERRORS)
            return
        }
        try {
            scores = await OsuApi.getScores({b: map, u: user, m: mode})
        } catch (error) {
            if (error instanceof Error && error.message === "Not found") {
                return `**🔴 No scores found for ${profile.name}.**`
            } else DEBUG.log("Error in GetRecentPlay - Recent", error.message, DEBUG.LEVELS.ERRORS)
            return
        }
        let descriptionArr = []
        for (let i = 0; i < scores.length; i++) {
            let score = scores[i]
            score.beatmapId = map

            let fcppDisplay = ""
            if (score.maxCombo < beatmap.maxCombo - 15 || score.counts.miss > 0) fcppDisplay = `(${TwoDigitValue(await Calculator.GetFcPP(score))}pp for ${TwoDigitValue(Calculator.GetFcAcc(score) * 100)}% FC) `
            let description = `**${i + 1}.** \`${GetModsFromRaw(score.raw_mods)}\` **Score** [${TwoDigitValue(await Calculator.GetStarsWithMods(map, score.raw_mods))}★]\n`
            description += `▸ ${await this.Client.emojis.resolve(GetRankingEmote(score.rank))} ▸ **${TwoDigitValue(score.pp)}pp** ${fcppDisplay}▸ ${TwoDigitValue(CalculateAcc(score.counts) * 100)}%\n`
            description += `▸ ${score.score} ▸ x${score.maxCombo}/${beatmap.maxCombo} ▸ [${score.counts[300]}/${score.counts[100]}/${score.counts[50]}/${score.counts.miss}]\n`
            description += `▸ Score Set ${DateDiff(new moment(score.date), new moment(Date.now()))}Ago\n`
            descriptionArr.push(description)
        }
        let length = descriptionArr.length + 2
        for (let i = 0; i < length; i++) {
            if (descriptionArr[i] === undefined) descriptionArr[i] = ""
        }
        return new
        Discord.MessageEmbed()
            .setAuthor(`Top ${ModNames[mode]} Plays for ${profile.name} on ${beatmap.title} [${beatmap.version}]`, `http://s.ppy.sh/a/${profile.id}`, `https://osu.ppy.sh/b/${map}`)
            .setDescription(descriptionArr[0] + descriptionArr[1] + descriptionArr[2])
            .setThumbnail(`https://b.ppy.sh/thumb/${beatmap.beatmapSetId}l.jpg`)
            .setFooter("On osu! Official Server | Page 1 of 1")
    }

    async GetSpecificPlay(user, play, mode) {
        let profile, score
        try {
            profile = await OsuApi.getUser({u: user, m: mode})
        } catch (error) {
            if (error instanceof Error && error.message === "Not found") {
                return `**🔴 ${user} not found.**`
            } else DEBUG.log("Error in GetRecentPlay - Recent", error.message, DEBUG.LEVELS.ERRORS)
            return
        }
        try {
            score = (await OsuApi.getUserBest({u: user, m: mode, limit: play}))[play - 1]
        } catch (error) {
            if (error instanceof Error && error.message === "Not found") {
                return `**🔴 Score #${play} not found.**`
            } else DEBUG.log("Error in GetRecentPlay - Recent", error.message, DEBUG.LEVELS.ERRORS)
            return
        }
        score.index = play
        let author = [`Top ${play} ${ModNames[mode]} Play for ${profile.name}`, `https://osu.ppy.sh/users/${profile.id}/${ModLinkNames[mode]}`]
        return this.PlaysToEmbed([score], profile, author, mode)
    }

    async GetRecentBest(user, mode) {
        let profile, score
        try {
            profile = await OsuApi.getUser({u: user, m: mode})
        } catch (error) {
            if (error instanceof Error && error.message === "Not found")
                return `**🔴 ${user} not found.**`
            else DEBUG.log("Error in GetRecentPlay - Recent", error.message, DEBUG.LEVELS.ERRORS)
            return
        }
        try {
            score = await OsuApi.getUserBest({u: user, m: mode, limit: 100})
        } catch (error) {
            if (error instanceof Error && error.message === "Not found")
                return `${profile.name} has no top plays.`
            else DEBUG.log("Error in GetRecentPlay - Recent", error.message, DEBUG.LEVELS.ERRORS)
            return
        }
        for (let i = 0; i < score.length; i++) {
            score[i].index = i + 1
        }
        score.sort(function (a, b) {
            const dateA = new Date(a.date), dateB = new Date(b.date);
            return dateB - dateA
        })
        score = score[0]

        let author = [`Top ${score.index} ${ModNames[mode]} Play for ${profile.name}`, `https://osu.ppy.sh/users/${profile.id}/${ModLinkNames[mode]}`]
        return await this.PlaysToEmbed([score], profile, author, mode)
    }

    async GetRecentBestGreaterThen(user, mode, ammount) {
        let profile, score
        try {
            profile = await OsuApi.getUser({u: user, m: mode})
        } catch (error) {
            if (error instanceof Error && error.message === "Not found")
                return `**🔴 ${user} not found.**`
            else DEBUG.log("Error in GetRecentPlay - Recent", error.message, DEBUG.LEVELS.ERRORS)
            return
        }
        try {
            score = await OsuApi.getUserBest({u: user, m: mode, limit: 100})
        } catch (error) {
            if (error instanceof Error && error.message === "Not found")
                return `**🔴 ${profile.name} has no top plays.**`
            else DEBUG.log("Error in GetRecentPlay - Recent", error.message, DEBUG.LEVELS.ERRORS)
            return
        }
        for (let i = 0; i < score.length; i++) {
            score[i].index = i + 1
        }
        score.sort(function (a, b) {
            const dateA = new Date(a.date), dateB = new Date(b.date);
            return dateB - dateA
        })
        for (let i = 0; i < score.length; i++) {
            if (score[i].pp > ammount) {
                score = score[i]
                break
            }
            if (i === score.length - 1) return `**🔴 ${profile.name} has no plays above ${ammount}pp.**`
        }

        let author = [`Top ${score.index} ${ModNames[mode]} Play for ${profile.name}`, `https://osu.ppy.sh/users/${profile.id}/${ModLinkNames[mode]}`]
        return this.PlaysToEmbed([score], profile, author, mode)
    }

    async GetMap(map, mode, mods, custom) {
        if (isNaN(mods) && mods) mods = Calculator.ParseMods(mods)
        else if (!mods) mods = 0
        let beatmap = (await OsuApi.getBeatmaps({b: map, m: mode, mods: RemoveNonDiffMods(mods)}))[0]
        if (mods & BitMods.Easy || mods & BitMods.HardRock || mods & BitMods.DoubleTime || mods & BitMods.HalfTime) beatmap.difficulty = Calculator.GetDifficultyValues(beatmap.difficulty, mods)

        let description = `**Length:** ${Math.floor(beatmap["length"].drain / 60)}:${beatmap["length"].drain % 60} `
        description += `**BPM:** ${beatmap.bpm} `
        description += `**Mods:** ${GetModsFromRaw(mods)}\n`
        description += `**Download:** [map](https://osu.ppy.sh/d/${beatmap.beatmapSetId})([no vid](https://osu.ppy.sh/d/${beatmap.beatmapSetId}n)) [osu!direct](osu://b/${beatmap.beatmapSetId})\n`
        description += `**${beatmap.version}**\n` /*TODO: Add diff emoji*/
        description += `▸**Difficulty:** ${TwoDigitValue(beatmap.difficulty.rating)}★`
        description += `▸**Max Combo:** x${beatmap.maxCombo}\n`
        description += `▸**AR:** ${Math.round(beatmap.difficulty.approach * 100) / 100}`
        description += `▸**OD:** ${Math.round(beatmap.difficulty.overall * 100) / 100}`
        description += `▸**HP:** ${Math.round(beatmap.difficulty.drain * 100) / 100}`
        description += `▸**CS:** ${Math.round(beatmap.difficulty.size * 100) / 100}\n`
        description += `▸**PP:** `
        description += `○ **95%-**${TwoDigitValue(await Calculator.GetSpecificAccPP(beatmap, 95, mods))}`
        if (custom) description += `○ **${Math.round(custom * 100) / 100}%-**${TwoDigitValue(await Calculator.GetSpecificAccPP(beatmap, custom, mods))}`
        else description += `○ **99%-**${TwoDigitValue(await Calculator.GetSpecificAccPP(beatmap, 99, mods))}`
        description += `○ **100%-**${TwoDigitValue(await Calculator.GetSpecificAccPP(beatmap, 100, mods))}`

        return new
        Discord.MessageEmbed()
            .setAuthor(`${beatmap.artist} - ${beatmap.title} by ${beatmap.creator}`, ``, `https://osu.ppy.sh/b/${beatmap.id}`)
            .setThumbnail(`https://b.ppy.sh/thumb/${beatmap.beatmapSetId}l.jpg`)
            .setDescription(description)
            .setFooter(`${beatmap.approvalStatus} | ${beatmap.counts.favourites} ❤︎ | Approved ${beatmap.raw_approvedDate}`)
    }

    /**
     * @param {String} user
     * @param {Number | (0 | 1 | 2 | 3)} [mode=0] - Gamemode to query for 0=std, 1=taiko, 2=ctb, 3=mania, defaults at 0
     */
    async GetRecentDetailed(user, mode) {
        if (!mode) mode = 0
        let profile, recentList, beatmap,
            tries = 0
        try {
            profile = await OsuApi.getUser({u: user, m: mode})
        } catch (error) {
            if (error instanceof Error && error.message === "Not found") {
                return `**🔴 ${user} not found.**`
            } else DEBUG.log("Error in GetRecentPlay - Profile", error.message, DEBUG.LEVELS.ERRORS)
            return
        }
        try {
            recentList = await OsuApi.getUserRecent({u: user, m: mode, limit: 50})
        } catch (error) {
            if (error instanceof Error && error.message === "Not found") {
                return `**🔴 ${profile.name} has no recent plays.**`
            } else DEBUG.log("Error in GetRecentPlay - Recent", error.message, DEBUG.LEVELS.ERRORS)
            return
        }
        let recent = recentList[0]
        beatmap = (await OsuApi.getBeatmaps({b: recent.beatmapId, mods: RemoveNonDiffMods(recent.raw_mods)}))[0]
        let rating = ""
        for (let i = 0; i < parseInt(beatmap.rating); i++) {
            rating += "⭐"
        }
        for (let i = 0; i < recentList.length; i++) {
            if (recentList[i].beatmapId === recent.beatmapId) tries++
            else break
        }
        if (recent.mods !== 0) beatmap.difficulty = await Calculator.GetDifficultyValues(beatmap.difficulty, recent.mods)

        // noinspection JSCheckFunctionSignatures
        return new
        Discord.MessageEmbed()
            .setAuthor(`Most Recent Play by ${profile.name}`, `http://s.ppy.sh/a/${profile.id}`, `https://osu.ppy.sh/users/${profile.id}/${ModLinkNames[mode]}`)
            .addFields(
                {
                    name: "Beatmap",
                    value: `[${beatmap.title}](https://osu.ppy.sh/b/${beatmap.id})\n [${beatmap.version}](https://osu.ppy.sh/b/${beatmap.id}) \n By [${beatmap.creator}](https://osu.ppy.sh/u/${beatmap.creator})\nWith ${GetModsFromRaw(recent.raw_mods)}`,
                    inline: true
                },
                {
                    name: "Downloads",
                    value: `[Official](https://osu.ppy.sh/b/${beatmap.beatmapSetId})\n [Official No Video](https://osu.ppy.sh/d/${beatmap.beatmapSetId}n)\n osu://b/${beatmap.beatmapSetId}\n [Bloodcat](https://bloodcat.com/osu/s/${beatmap.beatmapSetId})`,
                    inline: true
                },
                {name: '\u200B', value: '\u200B', inline: true},

                {
                    name: "Difficulty",
                    value: `AR: ${DiffRounder(beatmap.difficulty.approach)}\nOD: ${DiffRounder(beatmap.difficulty.overall)}\n CS: ${DiffRounder(beatmap.difficulty.size)}\n HP: ${DiffRounder(beatmap.difficulty.drain)}\nSpeed: ${TwoDigitValue(beatmap.difficulty.speed)}\nAim: ${TwoDigitValue(beatmap.difficulty.aim)}`,
                    inline: true
                },
                {
                    name: "Info",
                    value: `BPM: ${beatmap.bpm}\nLength: ${parseInt(beatmap.length.total / 60)}:${beatmap.length.total % 60}${beatmap.length.total === beatmap.length.drain ? "" : "(" + parseInt(beatmap.length.drain / 60) + ":" + beatmap.length.drain % 60 + ")"}\nFavourites: ${beatmap.counts.favourites}\nPasses: ${beatmap.counts.passes}/${beatmap.counts.plays}\nRating: ${rating}`,
                    inline: true
                },
                {name: '\u200B', value: '\u200B', inline: true},

                {
                    name: "Max Performance",
                    value: await GetAccPPs([`100`, `99`, `95`], beatmap, recent.raw_mods),
                    inline: true
                },
                {
                    name: "Play Performance",
                    value: `${TwoDigitValue(CalculateAcc(recent.counts) * 100)}% - ${TwoDigitValue(await Calculator.GetPlayPP(recent))}pp\n${TwoDigitValue(Calculator.GetFcAcc(recent) * 100)}% - ${TwoDigitValue(await Calculator.GetFcPP(recent))}pp for FC`,
                    inline: true
                },
                {name: '\u200B', value: '\u200B', inline: true},

                {
                    name: "Counts",
                    value: `${recent.counts[300]}/${recent.counts[100]}/${recent.counts[50]}/${recent.counts.miss}\n${recent.maxCombo}x/${beatmap.maxCombo}x`,
                    inline: true
                }
            )
            .setFooter(`${beatmap.approvalStatus} | ${beatmap.raw_approvedDate}`)
    }

    async GetTopPlaysSorted(user, mode) {
        if (!mode) mode = 0
        let plays = await OsuApi.getUserBest({u: user, mode: mode, limit: 100})
        for (let i = 0; i < plays.length; i++) plays[i].index = i+1
        plays.sort(function (a, b) {
            const dateA = new Date(a.date), dateB = new Date(b.date);
            return dateB - dateA
        })
        return plays
    }

    async GetOsuPlayerProfile(name, mode) {
        return (await OsuApi.getUser({u: name, m: mode}))
    }

    async CheckIfExists(user) {
        try {
            await OsuApi.getUser({u: user})
            return true
        } catch(err) {
            return false
        }
    }

    async CreateTrackingEmbed(play, user) {
        let profile = await OsuApi.getUser({u: play.user.id, m: user.mode})
        let beatmap = (await OsuApi.getBeatmaps({b: play.beatmapId, mods: RemoveNonDiffMods(play.raw_mods)}))[0]

        let description  = `▸ [**${beatmap.title} [${beatmap.version}]**](https://osu.ppy.sh/b/${beatmap.id})`
            description += `\n▸ **${TwoDigitValue(beatmap.difficulty.rating)}★** ▸ ${Math.floor(beatmap.length.drain / 60)}:${Math.floor(beatmap.length.drain % 60)} ▸ ${beatmap.bpm}bpm ▸ +${GetModsFromRaw(play.raw_mods)}`
            description += `\n▸ **${await this.Client.emojis.resolve(GetRankingEmote(play.rank))}** ▸ **${TwoDigitValue(CalculateAcc(play.counts) * 100)}%** ▸ **${TwoDigitValue(play.pp)}(+${TwoDigitValue(profile.pp.raw - user.pp)})pp**`
            description += `\n▸ ${play.score} ▸ x${play.maxCombo}/${beatmap.maxCombo} ▸ [${play.counts["300"]}/${play.counts["100"]}/${play.counts["50"]}/${play.counts.miss}]`
            description += `\n▸ #${user.rank} → #${profile.pp.rank} (CZ#${user.country_rank} → #${profile.pp.countryRank})`
        let embed = new Discord.MessageEmbed()
            .setAuthor(`New #${play.index} for ${profile.name} in ${ModNames[user.mode]}`, `http://s.ppy.sh/a/${profile.id}`, `https://osu.ppy.sh/u/${profile.id}`)
            .setDescription(description)
            .setFooter(`${DateDiff(new moment(play.date), new moment(Date.now()))}Ago On osu! Official Server`)
            .setThumbnail(`https://b.ppy.sh/thumb/${beatmap.beatmapSetId}l.jpg`)
        embed.index = play.index
        return embed
    }

}

function DiffRounder(num) {
    return (Math.round(num * 100) / 100)
}

function TwoDigitValue(num) {
    return (Math.round(num * 100) / 100).toFixed(2)
}

function GetAccPPs(accs, beatmap, mods) {
    return new Promise(async (resolve) => {
        let performance = ""
        for (let i = 0; i < accs.length; i++) {
            let el = accs[i]
            performance += `${el}% - ${TwoDigitValue(await Calculator.GetSpecificAccPP(beatmap, el, mods))}pp\n`
            if (i === accs.length - 1) resolve(performance)
        }
    })
}

function GetModsFromRaw(rawMods) {
    if (rawMods === 0) return "No Mod"
    // noinspection 
    let modsName = [
            None = "No Mod",
            NoFail = "NF",
            Easy = "EZ",
            TouchDevice = "TD",
            Hidden = "HD",
            HardRock = "HR",
            SuddenDeath = "SD",
            DoubleTime = "DT",
            Relax = "RX",
            HalfTime = "HT",
            Nightcore = "NC",
            Flashlight = "FL",
            Autoplay = "AU",
            SpunOut = "SO",
            Relax2 = "AP",
            Perfect = "PF",
            Key4 = "4K",
            Key5 = "5K",
            Key6 = "6K",
            Key7 = "7K",
            Key8 = "8K",
            FadeIn = "FI",
            Random = "RD",
            Cinema = "CN",
            Target = "TP",
            Key9 = "9K",
            KeyCoop = "2P",
            Key1 = "1K",
            Key3 = "3K",
            Key2 = "2K",
            ScoreV2 = "V2",
            Mirror = "MR"
        ],
        resultMods = ""
    // noinspection JSBitwiseOperatorUsage
    if (rawMods & BitMods.Perfect) rawMods &= ~BitMods.SuddenDeath
    // noinspection JSBitwiseOperatorUsage
    if (rawMods & BitMods.Nightcore) rawMods &= ~BitMods.DoubleTime
    for (let i = 0; i < BitModsArr.length; i++) {
        const mod = BitModsArr[i]
        // noinspection JSBitwiseOperatorUsage
        if (mod & rawMods)
            resultMods += modsName[i]
    }
    return resultMods
}

/**
 * @param {Number} mods
 * @returns {Number}
 */
function RemoveNonDiffMods(mods) {
    return (mods & BitMods.DoubleTime | mods & BitMods.HalfTime | mods & BitMods.HardRock | mods & BitMods.Easy)
}

function DateDiff(playDate, now) {
    // noinspection JSUnresolvedVariable,JSUnresolvedVariable,JSUnresolvedVariable,JSUnresolvedVariable,JSUnresolvedVariable,JSUnresolvedVariable
    let
        diffAr = [],

        //Get Date Differences
        diffObj = moment.duration(now.diff(playDate)),
        yearDiff = diffObj._data.years,
        monthDiff = diffObj._data.months,
        dayDiff = diffObj._data.days,
        hourDiff = diffObj._data.hours,
        minuteDiff = diffObj._data.minutes,
        secondDiff = diffObj._data.seconds

    //Fill diffAr if difference > 0
    if (yearDiff > 0) yearDiffFin = diffAr[diffAr.length] = yearDiff + ' Years '
    if (monthDiff > 0) diffAr[diffAr.length] = monthDiff + ' Months '
    if (dayDiff > 0) diffAr[diffAr.length] = dayDiff + ' Days '
    if (hourDiff > 0) diffAr[diffAr.length] = hourDiff + ' Hours '
    if (minuteDiff > 0) diffAr[diffAr.length] = minuteDiff + ' Minutes '
    if (secondDiff > 0) diffAr[diffAr.length] = secondDiff + ' Seconds '
    return diffAr[1] === undefined ? diffAr[0] : diffAr[0] + diffAr[1]
}

function CalculateAcc(counts) {
    return (counts[50] * 50 + counts[100] * 100 + counts[300] * 300) / (counts[50] * 300 + counts[100] * 300 + counts[300] * 300 + counts.miss * 300)
}

function GetRankingEmote(raw) {
    switch (raw) {
        case 'XH':
            return '585737970816909322'
        case 'SH':
            return '585737970246615050'
        case 'X':
            return '585737970384896017'
        case 'S':
            return '585737969885904897'
        case 'A':
            return '585737969927716866'
        case 'B':
            return '585737970150277131'
        case 'C':
            return '585737970200477696'
        case 'F':
            return '585737969877385217'
        default:
            break;
    }
}


module.exports = Osu


const
    DEBUG = {
        LEVELS: {
            NONE: 0,    //No Debugging
            FATAL: 1,   //Fatal Errors
            ERRORS: 2,  //All Errors
            WARNINGS: 3,//Warnings
            INFO: 4     //Info
        },
        LEVEL: 4,
        log: (label, message, level) => {
            if (!DEBUG.LEVEL >= level)
                return
            console.log(label)
            console.log(message)
        }
    }
