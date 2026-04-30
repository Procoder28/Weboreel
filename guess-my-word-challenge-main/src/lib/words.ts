// Curated 5-letter word list for the answer pool
export const ANSWERS = [
  "apple","brave","crane","drift","eagle","flame","glide","haven","ivory","joker",
  "knight","lemon","mango","noble","ocean","piano","quiet","raven","stone","tiger",
  "ultra","vivid","whale","xenon","youth","zebra","amber","blush","cloud","dream",
  "earth","frost","grape","honey","input","jolly","karma","light","music","novel",
  "olive","peach","quartz","river","sugar","trust","unity","vault","water","yield",
  "blaze","charm","depth","ember","fable","glory","heart","irony","jewel","lunar",
  "magic","north","oasis","pride","quest","rapid","sword","torch","urban","valor",
  "witty","zonal","alert","brick","candy","dance","elite","field","ghost","horse",
  "image","juice","knock","label","money","nurse","onion","pixel","queen","robot",
  "spice","table","unite","voice","world","yacht","zesty","actor","beach","cabin"
];

// Larger set of valid guesses (includes answers)
export const VALID_GUESSES = new Set<string>([
  ...ANSWERS,
  "about","above","abuse","adapt","admin","admit","adopt","adult","after","again",
  "agent","agree","ahead","alarm","album","alive","allow","alone","along","alter",
  "anger","angle","angry","apart","apply","arena","argue","arise","array","aside",
  "asset","avoid","awake","award","aware","badly","baker","bases","basic","basis",
  "begin","being","below","bench","billy","birth","black","blade","blame","blind",
  "block","blood","board","boost","booth","bound","brain","brand","bread","break",
  "breed","brief","bring","broad","broke","brown","build","built","buyer","cable",
  "calif","carry","catch","cause","chain","chair","chart","chase","cheap","check",
  "chest","chief","child","china","chose","civil","claim","class","clean","clear",
  "click","clock","close","coach","coast","could","count","court","cover","craft",
  "crash","cream","crime","cross","crowd","crown","curve","cycle","daily","dated",
  "dealt","death","debut","delay","depot","doing","doubt","dozen","draft","drama",
  "drawn","dress","drill","drink","drive","drove","dying","eager","early","eight",
  "elite","empty","enemy","enjoy","enter","entry","equal","error","event","every",
  "exact","exist","extra","faith","false","fault","fiber","fifth","fifty","fight",
  "final","first","fixed","flash","fleet","floor","fluid","focus","force","forth",
  "forty","forum","found","frame","frank","fraud","fresh","front","fruit","fully",
  "funny","giant","given","glass","globe","going","grace","grade","grand","grant",
  "grass","great","green","gross","group","grown","guard","guess","guest","guide",
  "happy","harry","heard","heavy","hello","hence","henry","hills","hindu","hired",
  "hobby","holds","holes","holly","homes","honor","hoped","hopes","hotel","hours",
  "house","human","hurry","ideal","ideas","idiot","image","imply","index","inner",
  "issue","japan","jimmy","joint","jones","judge","known","label","large","laser",
  "later","laugh","layer","learn","lease","least","leave","legal","level","lewis",
  "light","limit","links","lives","local","logic","loose","lower","lucky","lunch",
  "lying","magic","major","maker","march","maria","match","maybe","mayor","meant",
  "media","metal","might","minor","minus","mixed","model","money","month","moral",
  "motor","mount","mouse","mouth","moved","movie","music","needs","never","newly",
  "night","noise","north","noted","novel","nurse","occur","ocean","offer","often",
  "order","other","ought","paint","panel","paper","party","peace","peter","phase",
  "phone","photo","piece","pilot","pitch","place","plain","plane","plant","plate",
  "point","pound","power","press","price","pride","prime","print","prior","prize",
  "proof","proud","prove","queen","quick","quiet","quite","radio","raise","range",
  "rapid","ratio","reach","ready","refer","right","rival","river","robin","roger",
  "roman","rough","round","route","royal","rural","scale","scene","scope","score",
  "sense","serve","seven","shall","shape","share","sharp","sheet","shelf","shell",
  "shift","shirt","shock","shoot","short","shown","sight","since","sixth","sixty",
  "sized","skill","sleep","slide","small","smart","smile","smith","smoke","solid",
  "solve","sorry","sound","south","space","spare","speak","speed","spend","spent",
  "split","spoke","sport","staff","stage","stake","stand","start","state","steam",
  "steel","stick","still","stock","stone","stood","store","storm","story","strip",
  "stuck","study","stuff","style","sugar","suite","super","sweet","table","taken",
  "taste","taxes","teach","teams","teeth","terry","texas","thank","theft","their",
  "theme","there","these","thick","thing","think","third","those","three","threw",
  "throw","tight","times","tired","title","today","topic","total","touch","tough",
  "tower","track","trade","train","treat","trend","trial","tried","tries","truck",
  "truly","trunk","trust","truth","twice","under","undue","union","unity","until",
  "upper","upset","urban","usage","usual","valid","value","video","virus","visit",
  "vital","voice","waste","watch","water","wheel","where","which","while","white",
  "whole","whose","woman","women","world","worry","worse","worst","worth","would",
  "wound","write","wrong","wrote","yield","young","youth"
]);

// Pick the daily answer based on UTC date
export function getDailyWord(): string {
  const start = Date.UTC(2024, 0, 1);
  const today = new Date();
  const todayUTC = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  const dayIndex = Math.floor((todayUTC - start) / (1000 * 60 * 60 * 24));
  return ANSWERS[((dayIndex % ANSWERS.length) + ANSWERS.length) % ANSWERS.length];
}

export function getRandomWord(): string {
  return ANSWERS[Math.floor(Math.random() * ANSWERS.length)];
}

export function getDailyKey(): string {
  const t = new Date();
  return `${t.getUTCFullYear()}-${t.getUTCMonth() + 1}-${t.getUTCDate()}`;
}
