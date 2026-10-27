// Asian Cup 2027 (Saudi Arabia) teams and fixtures. All kickoff times are KSA (UTC+3).

export type Stage = "group" | "r16" | "qf" | "sf" | "final";

export const STAGES: Stage[] = ["group", "r16", "qf", "sf", "final"];

export const STAGE_NAMES: Record<Stage, string> = {
  group: "دور المجموعات",
  r16: "دور الـ16",
  qf: "ربع النهائي",
  sf: "نصف النهائي",
  final: "النهائي",
};

// [correct winner/draw, exact score total]
export const STAGE_POINTS: Record<Stage, { outcome: number; exact: number }> = {
  group: { outcome: 3, exact: 8 },
  r16: { outcome: 4, exact: 10 },
  qf: { outcome: 5, exact: 12 },
  sf: { outcome: 6, exact: 15 },
  final: { outcome: 8, exact: 20 },
};

export const QUALIFIER_BONUS = 2;
export const CHAMPION_BONUS = 40;
// Points per team by distance between predicted and actual group position
export const GROUP_POSITION_POINTS = [10, 5, 2, 0];

export interface Team {
  code: string;
  name: string;
  flag: string;
  group: string;
}

export const TEAMS: Team[] = [
  { code: "KSA", name: "السعودية", flag: "🇸🇦", group: "A" },
  { code: "KUW", name: "الكويت", flag: "🇰🇼", group: "A" },
  { code: "OMA", name: "عمان", flag: "🇴🇲", group: "A" },
  { code: "PLE", name: "فلسطين", flag: "🇵🇸", group: "A" },
  { code: "UZB", name: "أوزبكستان", flag: "🇺🇿", group: "B" },
  { code: "BHR", name: "البحرين", flag: "🇧🇭", group: "B" },
  { code: "PRK", name: "كوريا الشمالية", flag: "🇰🇵", group: "B" },
  { code: "JOR", name: "الأردن", flag: "🇯🇴", group: "B" },
  { code: "IRN", name: "إيران", flag: "🇮🇷", group: "C" },
  { code: "SYR", name: "سوريا", flag: "🇸🇾", group: "C" },
  { code: "KGZ", name: "قرغيزستان", flag: "🇰🇬", group: "C" },
  { code: "CHN", name: "الصين", flag: "🇨🇳", group: "C" },
  { code: "AUS", name: "أستراليا", flag: "🇦🇺", group: "D" },
  { code: "TJK", name: "طاجيكستان", flag: "🇹🇯", group: "D" },
  { code: "IRQ", name: "العراق", flag: "🇮🇶", group: "D" },
  { code: "SIN", name: "سنغافورة", flag: "🇸🇬", group: "D" },
  { code: "KOR", name: "كوريا الجنوبية", flag: "🇰🇷", group: "E" },
  { code: "YEM", name: "اليمن", flag: "🇾🇪", group: "E" },
  { code: "UAE", name: "الإمارات", flag: "🇦🇪", group: "E" },
  { code: "VIE", name: "فيتنام", flag: "🇻🇳", group: "E" },
  { code: "JPN", name: "اليابان", flag: "🇯🇵", group: "F" },
  { code: "IDN", name: "إندونيسيا", flag: "🇮🇩", group: "F" },
  { code: "QAT", name: "قطر", flag: "🇶🇦", group: "F" },
  { code: "THA", name: "تايلاند", flag: "🇹🇭", group: "F" },
];

export const GROUPS = ["A", "B", "C", "D", "E", "F"];

export const TEAM_CODES = new Set(TEAMS.map((t) => t.code));

const S = {
  kingFahd: ["استاد الملك فهد الدولي", "الرياض"],
  faisalBinFahd: ["استاد الأمير فيصل بن فهد", "الرياض"],
  kingAbdullah: ["مدينة الملك عبدالله الرياضية", "جدة"],
  shabab: ["استاد الشباب", "الرياض"],
  kingdomArena: ["المملكة أرينا", "الرياض"],
  abdullahFaisal: ["استاد الأمير عبدالله الفيصل", "جدة"],
  aramco: ["استاد أرامكو", "الخبر"],
  ksu: ["استاد جامعة الملك سعود", "الرياض"],
} as const;

type Venue = keyof typeof S;

export interface FixtureSeed {
  id: number;
  stage: Stage;
  round: number | null;
  group: string | null;
  kickoff: string; // ISO with +03:00
  home: string; // team code or placeholder label
  away: string;
  venue: Venue;
}

const g = (
  id: number,
  round: number,
  date: string,
  time: string,
  home: string,
  away: string,
  venue: Venue,
): FixtureSeed => ({
  id,
  stage: "group",
  round,
  group: TEAMS.find((t) => t.code === home)!.group,
  kickoff: `${date}T${time}:00+03:00`,
  home,
  away,
  venue,
});

const k = (
  id: number,
  stage: Stage,
  date: string,
  time: string,
  home: string,
  away: string,
  venue: Venue,
): FixtureSeed => ({
  id,
  stage,
  round: null,
  group: null,
  kickoff: `${date}T${time}:00+03:00`,
  home,
  away,
  venue,
});

export const FIXTURES: FixtureSeed[] = [
  g(1, 1, "2027-01-07", "20:00", "KSA", "PLE", "kingFahd"),
  g(2, 1, "2027-01-08", "17:00", "KUW", "OMA", "faisalBinFahd"),
  g(3, 1, "2027-01-08", "19:30", "UZB", "JOR", "kingAbdullah"),
  g(4, 1, "2027-01-08", "22:00", "BHR", "PRK", "shabab"),
  g(5, 1, "2027-01-09", "17:00", "IRN", "CHN", "kingdomArena"),
  g(6, 1, "2027-01-09", "19:30", "SYR", "KGZ", "abdullahFaisal"),
  g(7, 1, "2027-01-09", "22:00", "AUS", "SIN", "aramco"),
  g(8, 1, "2027-01-10", "17:00", "TJK", "IRQ", "shabab"),
  g(9, 1, "2027-01-10", "19:30", "KOR", "YEM", "kingAbdullah"),
  g(10, 1, "2027-01-10", "22:00", "UAE", "VIE", "ksu"),
  g(11, 1, "2027-01-11", "18:00", "JPN", "IDN", "abdullahFaisal"),
  g(12, 1, "2027-01-11", "21:00", "QAT", "THA", "kingFahd"),
  g(13, 2, "2027-01-12", "18:00", "PLE", "KUW", "aramco"),
  g(14, 2, "2027-01-12", "21:00", "OMA", "KSA", "kingFahd"),
  g(15, 2, "2027-01-13", "17:00", "PRK", "UZB", "kingdomArena"),
  g(16, 2, "2027-01-13", "19:30", "JOR", "BHR", "abdullahFaisal"),
  g(17, 2, "2027-01-13", "22:00", "KGZ", "IRN", "shabab"),
  g(18, 2, "2027-01-14", "17:00", "CHN", "SYR", "kingAbdullah"),
  g(19, 2, "2027-01-14", "19:30", "SIN", "TJK", "faisalBinFahd"),
  g(20, 2, "2027-01-14", "22:00", "IRQ", "AUS", "ksu"),
  g(21, 2, "2027-01-15", "18:00", "VIE", "KOR", "kingdomArena"),
  g(22, 2, "2027-01-15", "21:00", "YEM", "UAE", "kingFahd"),
  g(23, 2, "2027-01-16", "18:00", "IDN", "QAT", "aramco"),
  g(24, 2, "2027-01-16", "21:00", "THA", "JPN", "shabab"),
  g(25, 3, "2027-01-17", "21:00", "KSA", "KUW", "kingAbdullah"),
  g(26, 3, "2027-01-17", "21:00", "OMA", "PLE", "ksu"),
  g(27, 3, "2027-01-18", "18:00", "UZB", "BHR", "abdullahFaisal"),
  g(28, 3, "2027-01-18", "18:00", "PRK", "JOR", "faisalBinFahd"),
  g(29, 3, "2027-01-18", "21:00", "KGZ", "CHN", "kingdomArena"),
  g(30, 3, "2027-01-18", "21:00", "IRN", "SYR", "kingFahd"),
  g(31, 3, "2027-01-19", "20:00", "AUS", "TJK", "shabab"),
  g(32, 3, "2027-01-19", "20:00", "IRQ", "SIN", "aramco"),
  g(33, 3, "2027-01-20", "18:00", "JPN", "QAT", "ksu"),
  g(34, 3, "2027-01-20", "18:00", "THA", "IDN", "kingAbdullah"),
  g(35, 3, "2027-01-20", "21:00", "KOR", "UAE", "kingdomArena"),
  g(36, 3, "2027-01-20", "21:00", "VIE", "YEM", "abdullahFaisal"),
  k(37, "r16", "2027-01-22", "18:00", "وصيف المجموعة A", "وصيف المجموعة C", "aramco"),
  k(38, "r16", "2027-01-22", "21:00", "بطل المجموعة B", "ثالث المجموعة A / C / D", "ksu"),
  k(39, "r16", "2027-01-23", "18:00", "بطل المجموعة D", "ثالث المجموعة B / E / F", "kingAbdullah"),
  k(40, "r16", "2027-01-23", "21:00", "بطل المجموعة A", "ثالث المجموعة C / D / E", "kingFahd"),
  k(41, "r16", "2027-01-24", "18:00", "وصيف المجموعة B", "وصيف المجموعة F", "abdullahFaisal"),
  k(42, "r16", "2027-01-24", "21:00", "بطل المجموعة C", "ثالث المجموعة A / B / F", "kingdomArena"),
  k(43, "r16", "2027-01-25", "18:00", "بطل المجموعة E", "وصيف المجموعة D", "shabab"),
  k(44, "r16", "2027-01-25", "21:00", "بطل المجموعة F", "وصيف المجموعة E", "kingAbdullah"),
  k(45, "qf", "2027-01-28", "18:00", "الفائز من مباراة 37", "الفائز من مباراة 38", "kingdomArena"),
  k(46, "qf", "2027-01-28", "21:00", "الفائز من مباراة 39", "الفائز من مباراة 40", "kingAbdullah"),
  k(47, "qf", "2027-01-29", "18:00", "الفائز من مباراة 41", "الفائز من مباراة 42", "ksu"),
  k(48, "qf", "2027-01-29", "21:00", "الفائز من مباراة 43", "الفائز من مباراة 44", "kingFahd"),
  k(49, "sf", "2027-02-01", "20:00", "الفائز من مباراة 45", "الفائز من مباراة 46", "kingAbdullah"),
  k(50, "sf", "2027-02-02", "20:00", "الفائز من مباراة 47", "الفائز من مباراة 48", "kingFahd"),
  k(51, "final", "2027-02-05", "20:00", "الفائز من مباراة 49", "الفائز من مباراة 50", "kingFahd"),
];

// Winner of match N moves into slot [matchId, side]
export const ADVANCES_TO: Record<number, [number, "home" | "away"]> = {
  37: [45, "home"],
  38: [45, "away"],
  39: [46, "home"],
  40: [46, "away"],
  41: [47, "home"],
  42: [47, "away"],
  43: [48, "home"],
  44: [48, "away"],
  45: [49, "home"],
  46: [49, "away"],
  47: [50, "home"],
  48: [50, "away"],
  49: [51, "home"],
  50: [51, "away"],
};

export function venueOf(v: Venue): { stadium: string; city: string } {
  return { stadium: S[v][0], city: S[v][1] };
}

export const TOURNAMENT_START = FIXTURES[0]!.kickoff;
