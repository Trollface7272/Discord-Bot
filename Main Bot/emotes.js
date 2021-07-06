var Emotes = {}
Emotes[0] = []
Emotes[1] = []
Emotes[2] = []
Emotes[3] = []
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

  Emotes[0][0] = await client.emojis.resolve("858310858303864852")
  Emotes[0][1] = await client.emojis.resolve("858310858362978324")
  Emotes[0][2] = await client.emojis.resolve("858310858311729163")
  Emotes[0][3] = await client.emojis.resolve("858310858165190667")
  Emotes[0][4] = await client.emojis.resolve("858310858299408384")
  Emotes[0][5] = await client.emojis.resolve("858310857909075999")

  Emotes[1][0] = await client.emojis.resolve("858310830269399071")
  Emotes[1][1] = await client.emojis.resolve("858310830847557642")
  Emotes[1][2] = await client.emojis.resolve("858310830763671572")
  Emotes[1][3] = await client.emojis.resolve("858310830671003649")
  Emotes[1][4] = await client.emojis.resolve("858310830927118356")
  Emotes[1][5] = await client.emojis.resolve("858310830714257408")

  Emotes[2][0] = await client.emojis.resolve("858310941186850876")
  Emotes[2][1] = await client.emojis.resolve("858310941208215582")
  Emotes[2][2] = await client.emojis.resolve("858310941178724372")
  Emotes[2][3] = await client.emojis.resolve("858310941263134720")
  Emotes[2][4] = await client.emojis.resolve("858310941170466836")
  Emotes[2][5] = await client.emojis.resolve("858310941182394398")

  Emotes[3][0] = await client.emojis.resolve("858310914922381343")
  Emotes[3][1] = await client.emojis.resolve("858310915279290398")
  Emotes[3][2] = await client.emojis.resolve("858310915053322251")
  Emotes[3][3] = await client.emojis.resolve("858310914959605763")
  Emotes[3][4] = await client.emojis.resolve("858310915241803796")
  Emotes[3][5] = await client.emojis.resolve("858310915266445322")
}

function GetEmote(id) {
  return Emotes[id]
}

function GetDiffEmote(diff, mode) {
  if (diff < 2) return Emotes[mode][0]
  if (diff < 2.7) return Emotes[mode][1]
  if (diff < 4) return Emotes[mode][2]
  if (diff < 5.3) return Emotes[mode][3]
  if (diff < 6.5) return Emotes[mode][4]
  return Emotes[mode][5]
}

// create a unique, global symbol name
// -----------------------------------

const Key = Symbol.for("osu.ranking-emotes");

// check if the global object has this symbol
// add it if it does not have the symbol, yet
// ------------------------------------------

var globalSymbols = Object.getOwnPropertySymbols(global);
var exists = (globalSymbols.indexOf(Key) > -1);

if (!exists){
  global[Key] = {
    CreateEmotes,GetEmote,GetDiffEmote
  };
}

// define the singleton API
// ------------------------

var singleton = {};

Object.defineProperty(singleton, "instance", {
  get: function(){
    return global[Key];
  }
});

// ensure the API is never changed
// -------------------------------

Object.freeze(singleton);

// export the singleton API only
// -----------------------------

module.exports = singleton;