const 
    BitMods = {
        None           : 0,
        NoFail         : 1 << 0,
        Easy           : 1 << 1,
        TouchDevice    : 1 << 2,
        Hidden         : 1 << 3,
        HardRock       : 1 << 4,
        SuddenDeath    : 1 << 5,
        DoubleTime     : 1 << 6,
        Relax          : 1 << 7,
        HalfTime       : 1 << 8,
        Nightcore      : 1 << 9, // Only set along with DoubleTime. i.e: NC only gives 576
        Flashlight     : 1 << 10,
        Autoplay       : 1 << 11,
        SpunOut        : 1 << 12,
        Relax2         : 1 << 13,    // Autopilot
        Perfect        : 1 << 14, // Only set along with SuddenDeath. i.e: PF only gives 16416  
        Key4           : 1 << 15,
        Key5           : 1 << 16,
        Key6           : 1 << 17,
        Key7           : 1 << 18,
        Key8           : 1 << 19,
        FadeIn         : 1 << 20,
        Random         : 1 << 21,
        Cinema         : 1 << 22,
        Target         : 1 << 23,
        Key9           : 1 << 24,
        KeyCoop        : 1 << 25,
        Key1           : 1 << 26,
        Key3           : 1 << 27,
        Key2           : 1 << 28,
        ScoreV2        : 1 << 29,
        Mirror         : 1 << 30
    },
    BitModsArr = [
        None           = 0,
        NoFail         = 1 << 0,
        Easy           = 1 << 1,
        TouchDevice    = 1 << 2,
        Hidden         = 1 << 3,
        HardRock       = 1 << 4,
        SuddenDeath    = 1 << 5,
        DoubleTime     = 1 << 6,
        Relax          = 1 << 7,
        HalfTime       = 1 << 8,
        Nightcore      = 1 << 9, // Only set along with DoubleTime. i.e: NC only gives 576
        Flashlight     = 1 << 10,
        Autoplay       = 1 << 11,
        SpunOut        = 1 << 12,
        Relax2         = 1 << 13,    // Autopilot
        Perfect        = 1 << 14, // Only set along with SuddenDeath. i.e: PF only gives 16416  
        Key4           = 1 << 15,
        Key5           = 1 << 16,
        Key6           = 1 << 17,
        Key7           = 1 << 18,
        Key8           = 1 << 19,
        FadeIn         = 1 << 20,
        Random         = 1 << 21,
        Cinema         = 1 << 22,
        Target         = 1 << 23,
        Key9           = 1 << 24,
        KeyCoop        = 1 << 25,
        Key1           = 1 << 26,
        Key3           = 1 << 27,
        Key2           = 1 << 28,
        ScoreV2        = 1 << 29,
        Mirror         = 1 << 30
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
     * @param {String|Number} user 
     * @param {0|1|2|3} [mode=0] - Gamemode to query for 0=std, 1=taiko, 2=ctb, 3=mania, defaults at 0
     */
    async GetOsuProfile(user, mode) {
        if(!mode) mode = 0
        try {
            let profile = await OsuApi.getUser({u: user, m: mode}),
                level = ((profile.level - Math.floor(profile.level)).toFixed(4) * 100).toFixed(2),
                pp = TwoDigitValue(profile.pp.raw),
                accuracy = TwoDigitValue(profile.accuracy),
                description  = `**▸ Official Rank:** #${profile.pp.rank} (${profile.country}#${profile.pp.countryRank})\n`
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
            if (error instanceof Error && error.message == "Not found") {
                return `**🔴 ${user} not found.**`
            }
            else DEBUG.log("Error in GetOsuProfile", error.message, DEBUG.LEVELS.ERRORS)
            return
        }
    }
    /**
     * @param {String|Number} user 
     * @param {0|1|2|3} [mode=0] - Gamemode to query for 0=std, 1=taiko, 2=ctb, 3=mania, defaults at 0
     */
    async GetRecentPlay(user, mode) {
        if(!mode) mode = 0
        let profile, recentList, beatmap, description,
            tries = 0
        try {
            profile = await OsuApi.getUser({u: user, m: mode})
        } catch (error) {
            if (error instanceof Error && error.message == "Not found") {
                return `**🔴 ${user} not found.**`
            }
            else DEBUG.log("Error in GetRecentPlay - Profile", error.message, DEBUG.LEVELS.ERRORS)
            return
        }
        try {
            recentList = await OsuApi.getUserRecent({u: user, m: mode, limit: 50})
        } catch (error) {
            if (error instanceof Error && error.message == "Not found") {
                return `**🔴 ${profile.name} has no recent plays.**`
            }
            else DEBUG.log("Error in GetRecentPlay - Recent", error.message, DEBUG.LEVELS.ERRORS)
            return
        }
        let recent = recentList[0]

        beatmap = (await OsuApi.getBeatmaps({b: recent.beatmapId, mods: RemoveNonDiffMods(recent.raw_mods), a: 1, m: mode}))[0]

        for (let i = 0; i < recentList.length; i++) {
            if (recentList[i].beatmapId == recent.beatmapId) tries++
            else break
        }

        let fcppDisplay = ""
        if (recent.maxCombo < beatmap.maxCombo - 15 || recent.counts.miss > 0) fcppDisplay = `(${TwoDigitValue(await Calculator.GetFcPP(recent))}pp for ${TwoDigitValue(Calculator.GetFcAcc(recent) * 100)}% FC) `
        description =  `▸ ${this.Client.emojis.resolve(getRankingEmote(recent.rank))} ▸ **${TwoDigitValue(await Calculator.GetPlayPP(recent))}pp** ${fcppDisplay}▸ ${TwoDigitValue(CalculateAcc(recent.counts) * 100)}%\n`
        description += `▸ ${recent.score} ▸ x${recent.maxCombo}/${beatmap.maxCombo} ▸ [${recent.counts[300]}/${recent.counts[100]}/${recent.counts[50]}/${recent.counts.miss}]`

        return new Discord.MessageEmbed()
            .setAuthor(`${beatmap.title} [${beatmap.version}] +${GetModsFromRaw(recent.raw_mods)} [${TwoDigitValue(beatmap.difficulty.rating)}★]`, `http://s.ppy.sh/a/${profile.id}`, `https://osu.ppy.sh/b/${beatmap.id}`)
            .setThumbnail(`https://assets.ppy.sh/beatmaps/${beatmap.beatmapSetId}/covers/cover.jpg`)
            .setDescription(description)
            .setFooter(`Try #${tries} | ${DateDiff(new moment(recent.date), new moment(Date.now()))} Ago On osu! Official Server`)

    }
    /**
     * @param {String|Number} user 
     * @param {0|1|2|3} [mode=0] - Gamemode to query for 0=std, 1=taiko, 2=ctb, 3=mania, defaults at 0
     */
    async GetTopPlays(user, mode) {
        if (!mode) mode = 0
        let topPlays, profile
        try {
            profile = await OsuApi.getUser({u: user, m: mode})
        } catch (error) {
            if (error instanceof Error && error.message == "Not found") {
                return `**🔴 ${user} not found.**`
            }
            else DEBUG.log("Error in GetRecentPlay - Recent", error.message, DEBUG.LEVELS.ERRORS)
            return
        }
        try {
            topPlays = await OsuApi.getUserBest({u: user, m: mode, limit: 5})
        } catch (error) {
            if (error instanceof Error && error.message == "Not found") {
                return `${profile.name} has no top plays.`
            }
            else DEBUG.log("Error in GetRecentPlay - Recent", error.message, DEBUG.LEVELS.ERRORS)
            return
        }
        for (let i = 0; i < topPlays.length; i++) {
            topPlays[i].index = i+1 
        }
        let author = [`Top 5 ${ModNames[mode]} Plays for ${profile.name}`, `https://osu.ppy.sh/users/${profile.id}/${ModLinkNames[mode]}`]
        return this.PlaysToEmbed(topPlays, profile, author, mode)
    }
    /**
     * @param {String|Number} user 
     * @param {0|1|2|3} [mode=0] - Gamemode to query for 0=std, 1=taiko, 2=ctb, 3=mania, defaults at 0
     * @param {Boolean} [sort=true] - Sort by newest -> true
     */
    async GetRecentTopPlays(user, mode, sort) {
        if (sort == undefined) sort = true
        if (!mode) mode = 0
        let topPlays, profile
        try {
            profile = await OsuApi.getUser({u: user, m: mode})
        } catch (error) {
            if (error instanceof Error && error.message == "Not found") {
                return `**🔴 ${user} not found.**`
            }
            else DEBUG.log("Error in GetRecentPlay - Recent", error.message, DEBUG.LEVELS.ERRORS)
            return
        }
        try {
            topPlays = await OsuApi.getUserBest({u: user, m: mode, limit: 100})
        } catch (error) {
            if (error instanceof Error && error.message == "Not found") {
                return `${profile.name} has no top plays.`
            }
            else DEBUG.log("Error in GetRecentPlay - Recent", error.message, DEBUG.LEVELS.ERRORS)
            return
        }
        for (let i = 0; i < topPlays.length; i++) {
            topPlays[i].index = i+1 
        }
        topPlays.sort(function(a, b) {
            var dateA = new Date(a.date), dateB = new Date(b.date);
            return sort ? dateB - dateA : dateA - dateB
        })
        let sortedPlays = []
        for (let i = 0; i < 5; i++) 
            sortedPlays.push(topPlays[i])

        let author = [`5 Recent ${ModNames[mode]} Top Plays for ${profile.name}`, `https://osu.ppy.sh/users/${profile.id}/${ModLinkNames[mode]}`]
        return this.PlaysToEmbed(sortedPlays, profile, author, mode)
    }
    /**
     * @param {String|Number} user 
     * @param {0|1|2|3} [mode=0] - Gamemode to query for 0=std, 1=taiko, 2=ctb, 3=mania, defaults at 0
     * @param {Boolean} [sort=true] - Sort by newest -> true
     * @param {Number} ammount
     */
    async GetRecentTopPlaysGreaterThen(user, mode, sort, ammount) {
        if (sort == undefined) sort = true
        if (!mode) mode = 0
        let topPlays, profile
        try {
            profile = await OsuApi.getUser({u: user, m: mode})
        } catch (error) {
            if (error instanceof Error && error.message == "Not found") {
                return `**🔴 ${user} not found.**`
            }
            else DEBUG.log("Error in GetRecentPlay - Recent", error.message, DEBUG.LEVELS.ERRORS)
            return
        }
        try {
            topPlays = await OsuApi.getUserBest({u: user, m: mode, limit: 100})
        } catch (error) {
            if (error instanceof Error && error.message == "Not found") {
                return `${profile.name} has no top plays.`
            }
            else DEBUG.log("Error in GetRecentPlay - Recent", error.message, DEBUG.LEVELS.ERRORS)
            return
        }
        for (let i = 0; i < topPlays.length; i++) {
            topPlays[i].index = i+1 
        }
        topPlays.sort(function(a, b) {
            var dateA = new Date(a.date), dateB = new Date(b.date);
            return sort ? dateB - dateA : dateA - dateB
        })
        let sortedPlays = []
        for (let i = 0; i < topPlays.length; i++) {
            if (topPlays[i].pp > ammount) sortedPlays.push(topPlays[i])
            if (sortedPlays.length >= 5) break
        }
        let author = [`5 Recent ${ModNames[mode]} Top Plays for ${profile.name}`, `https://osu.ppy.sh/users/${profile.id}/${ModLinkNames[mode]}`]
        return this.PlaysToEmbed(sortedPlays, profile, author, mode)
    }
    async PlaysToEmbed(plays, profile, author, mode) {
        let description = ""
        for (let i = 0; i < plays.length; i++) {
            const play = plays[i]
            let map = (await OsuApi.getBeatmaps({b: play.beatmapId, a: 1, mods: RemoveNonDiffMods(play.raw_mods), a:1, m: mode}))[0]
            let fcppDisplay = ""
            if (play.maxCombo < map.maxCombo - 15 || play.counts.miss > 0) fcppDisplay = `(${TwoDigitValue(await Calculator.GetFcPP(play))}pp for ${TwoDigitValue(Calculator.GetFcAcc(play) * 100)}% FC) `
            
            description += `**${play.index}. [${map.title} [${map.version}]](https://osu.ppy.sh/b/${map.id}) +${GetModsFromRaw(play.raw_mods)}** [${TwoDigitValue(map.difficulty.rating)}★]\n`
            description += `▸ ${this.Client.emojis.resolve(getRankingEmote(play.rank))} ▸ **${TwoDigitValue(play.pp)}pp** ${fcppDisplay}▸ ${TwoDigitValue(CalculateAcc(play.counts)*100)}%\n`
            description += `▸ ${play.score} ▸ x${play.maxCombo}/${map.maxCombo} ▸ [${play.counts[300]}/${play.counts[100]}/${play.counts[50]}/${play.counts.miss}]\n`
            description += `▸ Score Set ${DateDiff(new moment(play.date), new moment(Date.now()))} Ago\n`
        }
        return new
            Discord.MessageEmbed()
            .setAuthor(author[0], `https://www.countryflags.io/${profile.country.toLowerCase()}/flat/64.png`, author[1])
            .setDescription(description)
            .setFooter("On osu! Official Server")
            .setThumbnail(`http://s.ppy.sh/a/${profile.id}`)
    }
    /**
     * @param {String|Number} user 
     * @param {0|1|2|3} [mode=0] - Gamemode to query for 0=std, 1=taiko, 2=ctb, 3=mania, defaults at 0
     * @param {Number} ammount 
     */
    async GetPlaysGreaterThen(user, mode, ammount) {
        if (!mode) mode = 0
        let profile, topPlays, counter = 0
        try {
            profile = await OsuApi.getUser({u: user, m: mode})
        } catch (error) {
            if (error instanceof Error && error.message == "Not found") {
                return `**🔴 ${user} not found.**`
            }
            else DEBUG.log("Error in GetRecentPlay - Recent", error.message, DEBUG.LEVELS.ERRORS)
            return
        }
        try {
            topPlays = await OsuApi.getUserBest({u: user, m: mode, limit: 100})
        } catch (error) {
            if (error instanceof Error && error.message == "Not found") {
                return `${profile.name} has no top plays.`
            }
            else DEBUG.log("Error in GetRecentPlay - Recent", error.message, DEBUG.LEVELS.ERRORS)
            return
        }
        for (let i = 0; i < topPlays.length; i++) {
            const play = topPlays[i];
            if (play.pp > ammount) counter++
        }
        return `**${profile.name} has ${counter} plays worth more then ${(ammount/1).toFixed(2)}pp**`
    }
    async GetUserBestOnMap(user, map, mode) {
        let profile, scores, beatmap = (await OsuApi.getBeatmaps({b: map}))[0]
        try {
            profile = await OsuApi.getUser({u: user, m: mode}) 
        } catch (error) {
            if (error instanceof Error && error.message == "Not found") {
                return `**🔴 ${user} not found.**`
            }
            else DEBUG.log("Error in GetRecentPlay - Recent", error.message, DEBUG.LEVELS.ERRORS)
            return
        }
        try {
            scores = await OsuApi.getScores({b: map, u: user, m: mode}) 
        } catch (error) {
            if (error instanceof Error && error.message == "Not found") {
                return `**🔴 No scores found for ${profile.name}.**`
            }
            else DEBUG.log("Error in GetRecentPlay - Recent", error.message, DEBUG.LEVELS.ERRORS)
            return
        }
        let descriptionArr = []
        for (let i = 0; i < scores.length; i++) {
            let score = scores[i]
            score.beatmapId = map

            let fcppDisplay = ""
            if (score.maxCombo < beatmap.maxCombo - 15 || score.counts.miss > 0) fcppDisplay = `(${TwoDigitValue(await Calculator.GetFcPP(score))}pp for ${TwoDigitValue(Calculator.GetFcAcc(score) * 100)}% FC) `
            let description  = `**${i+1}.** \`${GetModsFromRaw(score.raw_mods)}\` **Score** [${TwoDigitValue(await Calculator.GetStarsWithMods(map, score.raw_mods))}★]\n`
                description += `▸ ${this.Client.emojis.resolve(getRankingEmote(score.rank))} ▸ **${TwoDigitValue(score.pp)}pp** ${fcppDisplay}▸ ${TwoDigitValue(CalculateAcc(score.counts) * 100)}%\n`
                description += `▸ ${score.score} ▸ x${score.maxCombo}/${beatmap.maxCombo} ▸ [${score.counts[300]}/${score.counts[100]}/${score.counts[50]}/${score.counts.miss}]\n`
                description += `▸ Score Set ${DateDiff(new moment(score.date), new moment(Date.now()))} Ago\n`
            descriptionArr.push(description)
        }
        let length = descriptionArr.length + 2
        for (let i = 0; i < length; i++) {
            if (descriptionArr[i] == undefined) descriptionArr[i] = ""
        }
        return new 
            Discord.MessageEmbed()
            .setAuthor(`Top ${ModNames[mode]} Plays for ${profile.name} on ${beatmap.title} [${beatmap.version}]`, `http://s.ppy.sh/a/${profile.id}`, `https://osu.ppy.sh/b/${map}`)
            .setDescription(descriptionArr[0] + descriptionArr[1] + descriptionArr[2])
            .setThumbnail(`https://assets.ppy.sh/beatmaps/${beatmap.beatmapSetId}/covers/cover.jpg`)
            .setFooter("On osu! Official Server | Page 1 of 1")
    }
    async GetSpecificPlay(user, play, mode) {
        let profile, score, map
        try {
            profile = await OsuApi.getUser({u: user, m: mode}) 
        } catch (error) {
            if (error instanceof Error && error.message == "Not found") {
                return `**🔴 ${user} not found.**`
            }
            else DEBUG.log("Error in GetRecentPlay - Recent", error.message, DEBUG.LEVELS.ERRORS)
            return
        }
        try {
            score = (await OsuApi.getUserBest({u: user, m: mode, limit: play}))[play-1]
        } catch (error) {
            if (error instanceof Error && error.message == "Not found") {
                return `**🔴 Score #${play} not found.**`
            }
            else DEBUG.log("Error in GetRecentPlay - Recent", error.message, DEBUG.LEVELS.ERRORS)
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
            if (error instanceof Error && error.message == "Not found") 
                return `**🔴 ${user} not found.**`
            else DEBUG.log("Error in GetRecentPlay - Recent", error.message, DEBUG.LEVELS.ERRORS)
            return
        }
        try {
            score = await OsuApi.getUserBest({u: user, m: mode, limit: 100})
        } catch (error) {
            if (error instanceof Error && error.message == "Not found") 
                return `${profile.name} has no top plays.`
            else DEBUG.log("Error in GetRecentPlay - Recent", error.message, DEBUG.LEVELS.ERRORS)
            return
        }
        for (let i = 0; i < score.length; i++) {
            score[i].index = i+1
        }
        score.sort(function(a, b) {
            var dateA = new Date(a.date), dateB = new Date(b.date);
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
            if (error instanceof Error && error.message == "Not found") 
                return `**🔴 ${user} not found.**`
            else DEBUG.log("Error in GetRecentPlay - Recent", error.message, DEBUG.LEVELS.ERRORS)
            return
        }
        try {
            score = await OsuApi.getUserBest({u: user, m: mode, limit: 100})
        } catch (error) {
            if (error instanceof Error && error.message == "Not found") 
                return `**🔴 ${profile.name} has no top plays.**`
            else DEBUG.log("Error in GetRecentPlay - Recent", error.message, DEBUG.LEVELS.ERRORS)
            return
        }
        for (let i = 0; i < score.length; i++) {
            score[i].index = i+1
        }
        score.sort(function(a, b) {
            var dateA = new Date(a.date), dateB = new Date(b.date);
            return dateB - dateA
        })
        for (let i = 0; i < score.length; i++) {
            if (score[i].pp > ammount) {
                score = score[i]
                break
            }
            if (i == score.length-1) return `**🔴 ${profile.name} has no plays above ${ammount}pp.**`   
        }

        let author = [`Top ${score.index} ${ModNames[mode]} Play for ${profile.name}`, `https://osu.ppy.sh/users/${profile.id}/${ModLinkNames[mode]}`]
        return this.PlaysToEmbed([score], profile, author, mode)
    }
    async GetMap(map, mode, mods, custom) {
        if (isNaN(mods) && mods) mods = Calculator.ParseMods(mods)
        else if (!mods) mods = 0
        let beatmap = (await OsuApi.getBeatmaps({b: map, m:mode, mods: RemoveNonDiffMods(mods)}))[0]
        if (mods & BitMods.Easy || mods & BitMods.HardRock || mods & BitMods.DoubleTime || mods & BitMods.HalfTime) beatmap.difficulty = Calculator.GetDifficultyValues(beatmap.difficulty, mods)
        
        let description  = `**Length:** ${Math.floor(beatmap["length"].drain / 60)}:${beatmap["length"].drain % 60} `
            description += `**BPM:** ${beatmap.bpm} `
            description += `**Mods:** ${GetModsFromRaw(mods)}\n`
            description += `**Download:** [map](https://osu.ppy.sh/d/${beatmap.beatmapSetId})([no vid](https://osu.ppy.sh/d/${beatmap.beatmapSetId}n)) [osu!direct](osu://b/${beatmap.beatmapSetId})\n`
            description += `**${beatmap.version}**\n` /*TODO: Add diff emoji*/
            description += `▸**Difficulty:** ${TwoDigitValue(beatmap.difficulty.rating)}★`
            description += `▸**Max Combo:** x${beatmap.maxCombo}\n`
            description += `▸**AR:** ${Math.round(beatmap.difficulty.approach * 100) / 100}`
            description += `▸**OD:** ${Math.round(beatmap.difficulty.overall * 100) / 100}`
            description += `▸**HP:** ${Math.round(beatmap.difficulty.drain * 100)  / 100}`
            description += `▸**CS:** ${Math.round(beatmap.difficulty.size * 100)  / 100}\n`
            description += `▸**PP:** `
            description += `○ **95%-**${TwoDigitValue(await Calculator.GetSpecificAccPP(beatmap, 95, mods))}`
            if (custom) description += `○ **${Math.round(custom*100)/100}%-**${TwoDigitValue(await Calculator.GetSpecificAccPP(beatmap, custom, mods))}`
            else description += `○ **99%-**${TwoDigitValue(await Calculator.GetSpecificAccPP(beatmap, 99, mods))}`
            description += `○ **100%-**${TwoDigitValue(await Calculator.GetSpecificAccPP(beatmap, 100, mods))}`

        return new
            Discord.MessageEmbed()
            .setAuthor(`${beatmap.artist} - ${beatmap.title} by ${beatmap.creator}`, ``, `https://osu.ppy.sh/b/${beatmap.id}`)
            .setThumbnail(`https://assets.ppy.sh/beatmaps/${beatmap.beatmapSetId}/covers/cover.jpg`)
            .setDescription(description)
            .setFooter(`${beatmap.approvalStatus} | ${beatmap.counts.favourites} ❤︎ | Approved ${beatmap.raw_approvedDate}`)
    }
    async GetRecentDetailed(user, mode) {
        if(!mode) mode = 0
        let profile, recentList, beatmap,
            tries = 0
        try {
            profile = await OsuApi.getUser({u: user, m: mode})
        } catch (error) {
            if (error instanceof Error && error.message == "Not found") {
                return `**🔴 ${user} not found.**`
            }
            else DEBUG.log("Error in GetRecentPlay - Profile", error.message, DEBUG.LEVELS.ERRORS)
            return
        }
        try {
            recentList = await OsuApi.getUserRecent({u: user, m: mode, limit: 50})
        } catch (error) {
            if (error instanceof Error && error.message == "Not found") {
                return `**🔴 ${profile.name} has no recent plays.**`
            }
            else DEBUG.log("Error in GetRecentPlay - Recent", error.message, DEBUG.LEVELS.ERRORS)
            return
        }
        let recent = recentList[0]
        beatmap = (await OsuApi.getBeatmaps({b: recent.beatmapId, mods: RemoveNonDiffMods(recent.raw_mods)}))[0]
        let rating = ""
        for (let i = 0; i < parseInt(beatmap.rating); i++) {
            rating += "⭐"
        }
        for (let i = 0; i < recentList.length; i++) {
            if (recentList[i].beatmapId == recent.beatmapId) tries++
            else break
        }
        if (recent.mods != 0) beatmap.difficulty = await Calculator.GetDifficultyValues(beatmap.difficulty, mods)
        
        return new
            Discord.MessageEmbed()
            .setAuthor(`Most Recent Play by ${profile.name}`, `http://s.ppy.sh/a/${profile.id}`, `https://osu.ppy.sh/users/${profile.id}/${ModLinkNames[mode]}`)
            .addFields(
                {name: "Beatmap", value: `[${beatmap.title}](https://osu.ppy.sh/b/${beatmap.id})\n [${beatmap.version}](https://osu.ppy.sh/b/${beatmap.id}) \n By [${beatmap.creator}](https://osu.ppy.sh/u/${beatmap.creator})`, inline: true},
                {name: "Downloads", value: `[Official](https://osu.ppy.sh/b/${beatmap.beatmapSetId})\n [Official No Video](https://osu.ppy.sh/d/${beatmap.beatmapSetId}n)\n osu://b/${beatmap.beatmapSetId}\n [Bloodcat](https://bloodcat.com/osu/s/${beatmap.beatmapSetId})`, inline: true},
                {name: '\u200B', value: '\u200B', inline: true},

                {name: "Difficulty", value: `AR: ${DiffRounder(beatmap.difficulty.approach)}\nOD: ${DiffRounder(beatmap.difficulty.overall)}\n CS: ${DiffRounder(beatmap.difficulty.size)}\n HP: ${DiffRounder(beatmap.difficulty.drain)}\nSpeed: ${TwoDigitValue(beatmap.difficulty.speed)}\nAim: ${TwoDigitValue(beatmap.difficulty.aim)}`, inline: true},
                {name: "Info", value: `BPM: ${beatmap.bpm}\nLength: ${parseInt(beatmap.length.total / 60)}:${beatmap.length.total % 60}${beatmap.length.total == beatmap.length.drain ? "" : "(" + parseInt(beatmap.length.drain / 60) + ":" + beatmap.length.drain % 60 + ")"}\nMods: ${GetModsFromRaw(recent.raw_mods)}\nFavourites: ${beatmap.counts.favourites}\nPasses: ${beatmap.counts.passes}/${beatmap.counts.plays}\nRating: ${rating}`, inline: true},
                {name: '\u200B', value: '\u200B', inline: true},

                {name: "Max Performance", value: await GetAccPPs([`100`, `99`, `95`], beatmap, recent.raw_mods), inline: true},
                {name: "Play Performance", value: `${TwoDigitValue(CalculateAcc(recent.counts) * 100)}% - ${TwoDigitValue(await Calculator.GetPlayPP(recent))}pp\n${TwoDigitValue(Calculator.GetFcAcc(recent) * 100)}% - ${TwoDigitValue(await Calculator.GetFcPP(recent))}pp for FC`, inline: true},
                {name: '\u200B', value: '\u200B', inline: true},
                
                {name: "Counts", value: `${recent.counts[300]}/${recent.counts[100]}/${recent.counts[50]}/${recent.counts.miss}\n${recent.maxCombo}x/${beatmap.maxCombo}x`, inline:true}
            )
            .setFooter(`${beatmap.approvalStatus} | ${beatmap.raw_approvedDate}`)
    }
}

function DiffRounder(num) {
    return (Math.round(num*100)/100)
}

function TwoDigitValue(num) {
    return (Math.round(num*100)/100).toFixed(2)
}

function GetAccPPs(accs, beatmap, mods) {
    return new Promise(async (resolve, reject) => {
        let performance = ""
        for (let i = 0; i < accs.length; i++) {
            let el = accs[i]
            performance += `${el}% - ${TwoDigitValue(await Calculator.GetSpecificAccPP(beatmap, el, mods))}pp\n`
            if (i == accs.length - 1) resolve(performance)
        }
    })
}

function GetModsFromRaw(rawMods) {
    if(rawMods == 0) return "No Mod"
    modsName = [
        None           = "No Mod",
        NoFail         = "NF",
        Easy           = "EZ",
        TouchDevice    = "TD",
        Hidden         = "HD",
        HardRock       = "HR",
        SuddenDeath    = "SD",
        DoubleTime     = "DT",
        Relax          = "RX",
        HalfTime       = "HT",
        Nightcore      = "NC",
        Flashlight     = "FL",
        Autoplay       = "AU",
        SpunOut        = "SO",
        Relax2         = "AP",
        Perfect        = "PF",
        Key4           = "4K",
        Key5           = "5K",
        Key6           = "6K",
        Key7           = "7K",
        Key8           = "8K",
        FadeIn         = "FI",
        Random         = "RD",
        Cinema         = "CN",
        Target         = "TP",
        Key9           = "9K",
        KeyCoop        = "2P",
        Key1           = "1K",
        Key3           = "3K",
        Key2           = "2K",
        ScoreV2        = "V2",
        Mirror         = "MR"
    ],
    resultMods = ""
    for (let i = 0; i < BitModsArr.length; i++) {
        const mod = BitModsArr[i]
        
        if((mod & rawMods) && 
            (i != 7 || (!(rawMods & BitMods.Nightcore))) &&//NC fix
            (i != 6 || (!(rawMods & BitMods.Perfect))))  //PF fix
        resultMods += modsName[i]
    }
    
    return resultMods
}

function RemoveNonDiffMods(mods) {
    return (mods & BitMods.DoubleTime | mods & BitMods.HalfTime | mods & BitMods.HardRock | mods & BitMods.Easy)
}

function DateDiff(playDate, now) {
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
    if(yearDiff > 0) yearDiffFin = diffAr[diffAr.length] = yearDiff + ' Years '
    if(monthDiff > 0) diffAr[diffAr.length] = monthDiff + ' Months '
    if(dayDiff > 0) diffAr[diffAr.length] = dayDiff + ' Days '
    if(hourDiff > 0) diffAr[diffAr.length] = hourDiff + ' Hours '
    if(minuteDiff > 0) diffAr[diffAr.length] = minuteDiff + ' Minutes '
    if(secondDiff > 0) diffAr[diffAr.length] = secondDiff + ' Seconds '
    return diffAr[1] == undefined ? diffAr[0] : diffAr[0] + diffAr[1]
}

function CalculateAcc(counts) {
    return (counts[50] * 50 + counts[100] * 100 + counts[300] * 300) / (counts[50] * 300 + counts[100] * 300 + counts[300] * 300 + counts.miss * 300)
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

class osu {
    /**
     * @param {Player} user 
     */
    getProfileEmbed(user) {
        let description  = `**▸ Official Rank:** #${user.rank} (${user.country}#${user.countryRank})\n`
            description += `**▸ Level:** ${user.level.level} (${user.level.progress}%)\n`
            description += `**▸ Total PP:** ${user.pp}\n`
            description += `**▸ Hit Accuracy:** ${user.accuracy}%\n`
            description += `**▸ Playcount:** ${user.playcount}`
        return new 
            Discord.MessageEmbed()
            .setAuthor(`${user.mod} Profile for ${user.name}`, `https://www.countryflags.io/${user.country.toLowerCase()}/flat/64.png`, `https://osu.ppy.sh/users/${user.id}/${user.modRaw}`)
            .setDescription(description)
            .setFooter(`On osu! Official Server`)
            .setThumbnail(`http://s.ppy.sh/a/${user.id}`)
    }
    /**
     * @param {String|Number} name - Name or id to query for 
     * @param {0|1|2|3} [mode=0] - Gamemode to query for 0=std, 1=taiko, 2=ctb, 3=mania, defaults at 0
     * @returns {Object|String} - Returns userdata or "User Not Found" when user was not found
     */
    async getTopPlays(user, mode, limit) {
        if(!mode) mode = 0
        var plays = await this.osuApi.getUserBest({u: user, m: mode, limit: limit})
        DEBUG.log("Scores", plays, DEBUG.LEVELS.INFO)
        var result = []
        for(let el of plays) {
            const map = el._beatmap
            
            result.push(new structs.Score())
        }
        return result
    }
    /**
     * @param {Object[]} plays - 5 plays to convert into embed
     * @param {Number} plays.score
     * @param {String} plays.beatmapId
     * @param {String} plays.setId
     * @param {String} plays.title
     * @param {String} plays.artist
     * @param {String} plays.mapper
     * @param {String} plays.difficulty
     * @param {Number} plays.fcCombo
     * @param {Number} plays.stars
     * @param {Object} plays.counts
     * @param {Number} plays.counts.50
     * @param {Number} plays.counts.100
     * @param {Number} plays.counts.300
     * @param {Number} plays.counts.miss
     * @param {Number} plays.mods
     * @param {String} plays.rank
     * @param {Number} plays.maxCombo
     * @param {String} plays.date
     * @param {Number} plays.pp
     * 
     * @param {Object} user 
     * @param {String} user.id
     * @param {String} user.name
     * @param {String} user.mod
     * @param {String} user.modRaw
     * @param {String} user.country
     * @param {Number} user.rank
     * @param {Number} user.countryRank
     * @param {Number} user.pp
     * @param {Object} user.level
     * @param {Number} user.level.level
     * @param {Number} user.level.progress
     * @param {Number} user.accuracy
     * @param {Number} user.playcount
     */
    getPlaysEmbed(plays, user) {
        let description = ""
        for (let i = 0; i < plays.length; i++) {
            const play = plays[i]
            let ifFc = play.counts.miss > 0 || play.maxCombo < play.fcCombo - play.fcCombo * 0.05 ? getIfFc(play) : "",
            acc = Math.round((play.counts["300"]*300 + play.counts["100"]*100 + play.counts["50"]*50 + play.counts.miss*0) / ((play.counts["300"] + play.counts["100"] + play.counts["50"] + play.counts.miss)*300)*10000)/100

            description += `**${i+1}. [${play.title} [${play.difficulty}]](https://osu.ppy.sh/b/${play.beatmapId}) +${GetModsFromRaw(play.mods)}** [${(Math.round(play.stars*100)/100).toFixed(2)}★]\n`
            description += `▸ ${this.client.emojis.resolve(getRankingEmote(play.rank))} ▸ **${play.pp}PP** ▸${acc.toFixed(2)}% ${ifFc}\n`
            description += `▸ ${play.score} ▸ x${play.maxCombo}/${play.fcCombo} ▸ [${play.counts["300"]}/${play.counts["100"]}/${play.counts["50"]}/${play.counts.miss}]\n`
            description += `▸ Score Set ${DateDiff(moment(play.date), moment(new Date()))}Ago\n`
        }
        return new 
            Discord.MessageEmbed()
            .setAuthor(`Top 5 ${user.mod} Plays for ${user.name}`, `https://www.countryflags.io/${user.country.toLowerCase()}/flat/64.png`, `https://osu.ppy.sh/users/${user.id}/${user.modRaw}`)
            .setDescription(description)
            .setFooter("On osu! Official Server")
            .setThumbnail(`http://s.ppy.sh/a/${user.id}`)
    }
    /**
     * @param {String|Number} map - Beatmap id to query
     * @param {Number} mods - Raw mods
     * @param {0|1|2|3} [mode=0] - Gamemode to query for 0=std, 1=taiko, 2=ctb, 3=mania, defaults at 0
     * @returns {Object|String} - Returns map data or "Map Not Found" when map was not found
     */
    async getBeatmap(map, mods, mode) {
        if(!mode) mode = 0
        var map = (await this.osuApi.getBeatmaps({b: map, mods: RemoveNonDiffMods(mods), m: mode}))[0]
        return {
            id: map.id,
            setId: map.beatmapSetId,
            title: map.title,
            mapper: map.mapper,
            diff: map.version,
            artist: map.artist,
            stars: map.difficulty.rating,
            objects: map.objects.normal + map.objects.slider,
            aim: map.difficulty.aim,
            speed: map.difficulty.speed,
            approachRate: map.difficulty.approach,
            overall: map.difficulty.overall,
        }
    }
}





function getRankingEmote(raw) {
    switch (raw) {
        case 'XH': return '585737970816909322'
        case 'SH': return '585737970246615050'
        case 'X':  return '585737970384896017'
        case 'S':  return '585737969885904897'
        case 'A':  return '585737969927716866'
        case 'B':  return '585737970150277131'
        case 'C':  return '585737970200477696'
        case 'F':  return '585737969877385217'
        default:
            break;
    }
}
function getIfFc(play) {
    let counts = play.counts
    counts["300"] += counts.miss
    counts.miss = 0
    return `(${Math.round(play.fcpp*100)/100}pp for ${(Math.round(getAccuracy(counts)*10000)/100).toFixed(2)}% FC)`
    /*request.get("https://osu.ppy.sh/osu/"+play.beatmapId).then(osu => {
        let beatmap = ppcalc.Beatmap.fromOsu(osu)
        let score = {
            maxcombo: play.maxCombo,
            count50: play.counts["50"],
            count100: play.counts["100"],
            count300: play.counts["300"],
            countMiss: play.counts.miss,
            mods: play.mods
        }

    })*/
    /*let play = plays
    play.counts["100"] += play.counts.miss
    play.counts.miss = 0
    */
}



// /**
//  * 
//  * @param {Object} play 
//  * @param {Number} play.aim
//  * @param {Number} play.mods
//  * @param {Object} play.counts
//  * @param {Number} play.counts.300
//  * @param {Number} play.counts.100
//  * @param {Number} play.counts.50
//  * @param {Number} play.counts.miss
//  * @param {Number} play.fcCombo
//  * @param {Number} play.approachRate
//  * @param {Number} play.overall
//  */
// function totalValue(play) {
//     const mods = play.mods

// 	// Don't count scores made with supposedly unranked mods
// 	if ((mods & MODS.Relax) ||
// 		(mods & MODS.Relax2) ||
//         (mods & MODS.Autoplay)) 
//         return 0

// 	// Custom multipliers for NoFail and SpunOut.
// 	let multiplier = 1.12 // This is being adjusted to keep the final pp value scaled around what it used to be when changing things

// 	if (mods & MODS.NoFail)
// 		multiplier *= 0.90;

// 	if (mods & MODS.SpunOut)
// 		multiplier *= 0.95;

//     console.log(aimValue(play), speedValue(play), accValue(play))
// 	return Math.pow(
// 			Math.pow(aimValue(play), 1.1) +
// 			Math.pow(speedValue(play), 1.1) +
// 			Math.pow(accValue(play), 1.1), 1.0 / 1.1
// 		) * multiplier;
// }
// /**
//  * 
//  * @param {Object} play 
//  * @param {Number} play.aim
//  * @param {Number} play.mods
//  * @param {Object} play.counts
//  * @param {Number} play.counts.300
//  * @param {Number} play.counts.100
//  * @param {Number} play.counts.50
//  * @param {Number} play.counts.miss
//  * @param {Number} play.fcCombo
//  * @param {Number} play.approachRate
//  * @param {Number} play.overall
//  */
// function aimValue(play) {
//     const 
//     aim = play.aim,
//     mods = play.mods, 
//     counts = play.counts,
//     fcCombo = play.fcCombo,
//     maxCombo = play.maxCombo,
//     approachRate = play.approachRate,
//     overall = play.overall

//     let result, 
//     rawAim = aim

// 	if (mods & MODS.TouchDevice)
// 		rawAim = Math.pow(rawAim, 0.8)

// 	result = Math.pow(5 * Math.max(1.0, rawAim / 0.0675) - 4.0, 3.0) / 100000

// 	let numTotalHits = totalHits(counts)

// 	// Longer maps are worth more
// 	let LengthBonus = 0.95 + 0.4 * Math.min(1.0, numTotalHits / 2000.0) +
// 		(numTotalHits > 2000 ? Math.log10(numTotalHits / 2000.0) * 0.5 : 0.0)

// 	result *= LengthBonus

// 	// Penalize misses exponentially. This mainly fixes tag4 maps and the likes until a per-hitobject solution is available
// 	result *= Math.pow(0.97, counts.miss)

// 	// Combo scaling
// 	if (fcCombo > 0)
// 		result *= Math.min(Math.pow(maxCombo, 0.8 / Math.pow(fcCombo, 0.8)), 1.0)

// 	let approachRateFactor = 1.0
// 	if (approachRate > 10.33)
// 		approachRateFactor += 0.3 * (approachRate - 10.33)
// 	else if (approachRate < 8.0)
// 		approachRateFactor += 0.01 * (8.0 - approachRate)
	

// 	result *= approachRateFactor

// 	// We want to give more reward for lower AR when it comes to aim and HD. This nerfs high AR and buffs lower AR.
// 	if (mods & MODS.Hidden)
// 		result *= 1.0 + 0.04 * (12.0 - approachRate)
	
// 	if (mods & MODS.Flashlight) 
// 		// Apply object-based bonus for flashlight.
// 		result *= 1.0 + 0.35 * Math.min(1.0, numTotalHits / 200.0) +
//          		(numTotalHits > 200 ? 0.3 * Math.min(1.0, (numTotalHits - 200) / 300.0) +
//          		(numTotalHits > 500 ? (numTotalHits - 500) / 1200.0 : 0.0) : 0.0)

// 	// Scale the aim value with accuracy _slightly_
// 	result *= 0.5 + getAccuracy(counts) / 2.0
// 	// It is important to also consider accuracy difficulty when doing that
//     result *= 0.98 + Math.pow(overall, 2) / 2500
//     return result
// }

// /**
//  * 
//  * @param {Object} play
//  * @param {Number} play.speed
//  * @param {Number} play.mods
//  * @param {Object} play.counts
//  * @param {Number} play.counts.300
//  * @param {Number} play.counts.100
//  * @param {Number} play.counts.50
//  * @param {Number} play.counts.miss
//  * @param {Number} play.fcCombo
//  * @param {Number} play.approachRate
//  * @param {Number} play.overall
//  */
// function speedValue(play) {
//     const 
//     mods = play.mods, 
//     counts = play.counts,
//     fcCombo = play.fcCombo,
//     maxCombo = play.maxCombo,
//     approachRate = play.approachRate,
//     overall = play.overall,
//     speed = play.speed

// 	let result = Math.pow(5.0 * Math.max(1.0, speed / 0.0675) - 4.0, 3.0) / 100000.0

// 	let numTotalHits = totalHits(counts)

// 	let approachRateFactor = 1.0;
// 	if (approachRate > 10.33)
// 		approachRateFactor += 0.3 * (approachRate - 10.33)

//     result *= approachRateFactor;
	
// 	// Longer maps are worth more
// 	result *=
// 		0.95 + 0.4 * Math.min(1.0, numTotalHits / 2000.0) +
// 		(numTotalHits > 2000 ? Math.log10((numTotalHits) / 2000.0) * 0.5 : 0.0)

// 	// Penalize misses exponentially. This mainly fixes tag4 maps and the likes until a per-hitobject solution is available
// 	result *= Math.pow(0.97, counts.miss)

// 	// Combo scaling
// 	if (fcCombo > 0)
//         result *= Math.min((Math.pow(maxCombo, 0.8) / Math.pow(fcCombo, 0.8)), 1.0)

// 	// We want to give more reward for lower AR when it comes to speed and HD. This nerfs high AR and buffs lower AR.
// 	if (mods & MODS.Hidden)
//         result *= 1.0 + 0.04 * (12.0 - approachRate)

// 	// Scale the speed value with accuracy _slightly_
// 	result *= 0.02 + getAccuracy(counts)
// 	// It is important to also consider accuracy difficulty when doing that
//     result *= 0.96 + (Math.pow(overall, 2) / 1600)
//     return result
// }

// /**
//  * 
//  * @param {Object} play
//  * @param {Number} play.speed
//  * @param {Number} play.mods
//  * @param {Object} play.counts
//  * @param {Number} play.counts.300
//  * @param {Number} play.counts.100
//  * @param {Number} play.counts.50
//  * @param {Number} play.counts.miss
//  * @param {Number} play.fcCombo
//  * @param {Number} play.approachRate
//  * @param {Number} play.overall
//  */
// function accValue(play) {
//     const 
//     mods = play.mods, 
//     overall = play.overall,
//     counts = play.counts,
//     numHitObjectsWithAccuracy = play.objects
// 	// This percentage only considers HitCircles of any value - in this part of the calculation we focus on hitting the timing hit window

//     let numHitObjectsWithAccuracy = totalHits(counts),
//     betterAccuracyPercentage = getAccuracy(counts)


// 	// Lots of arbitrary values from testing.
// 	// Considering to use derivation from perfect accuracy in a probabilistic manner - assume normal distribution
// 	result = Math.pow(1.52163, overall) * Math.pow(betterAccuracyPercentage, 24) * 2.83

// 	// Bonus for many hitcircles - it's harder to keep good accuracy up for longer
// 	result *= Math.min(1.15, Math.pow(numHitObjectsWithAccuracy / 1000.0, 0.3))

// 	if (mods & MODS.Hidden)
//         result *= 1.08;

// 	if (mods & MODS.Flashlight)
//         result *= 1.02;
//     return result
// }

 function totalHits(counts) {
     return counts["300"] + counts["100"] + counts["50"] + counts.miss
 }
 function getAccuracy(counts) {
     return Math.min(Math.max((counts["50"] * 50 + counts["100"] * 100 + counts["300"] * 300) / (totalHits(counts) * 300), 0.0), 1.0)
 }