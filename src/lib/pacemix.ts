export type MusicLanguage = "mixed" | "zh" | "en";
export type Intensity = "easy" | "medium" | "hard" | "ai" | "custom";
export type Activity = "跑步" | "跑步机爬坡" | "跑步机快走";
export type CadenceProfile = "short" | "standard" | "long";

export type Song = {
  id: string;
  title: string;
  artist: string;
  bpm: number;
  seconds: number;
  file: string;
  cover: string;
  language: Exclude<MusicLanguage, "mixed">;
  /** First downbeat in the source file. Catalog analysis will replace the MVP default. */
  firstBeatOffsetSeconds: number;
};

export type Stage = { name: string; minutes: number; targetSpm: number; baseSpm: number; speed: number; tone: string };
export type ScheduledTrack = {
  id: string;
  song: Song;
  stageIndex: number;
  startsAt: number;
  endsAt: number;
  playSeconds: number;
  playbackRate: number;
  adjustedMusicBpm: number;
  /** Number of music beats per one footfall: 1, 2, or 0.5. */
  beatsPerStep: number;
  clipped: boolean;
};

export type TrainingDraft = {
  minutes: number;
  activity: Activity | "";
  language: MusicLanguage;
  intensity: Intensity | "";
  /** User-specified treadmill speeds take precedence over an intensity preset. */
  customStages?: Array<{ minutes: number; speed: number }>;
};

export type Plan = {
  version: 1;
  title: string;
  activity: Activity;
  minutes: number;
  level: string;
  musicLanguage: MusicLanguage;
  intensity: Intensity;
  stages: Stage[];
  songs: Song[];
  schedule: ScheduledTrack[];
  notices: string[];
  cadenceProfile: CadenceProfile;
};

export type BuildFailure = {
  kind: "missing-fields" | "catalog" | "conflict";
  message: string;
  choices?: string[];
  missing?: Array<"minutes" | "activity" | "intensity">;
};

export type BuildResult = { ok: true; plan: Plan } | { ok: false; error: BuildFailure };
export type PlanConflict = { code: "duration_mismatch"; message: string; totalMinutes: number; stagesMinutes: number };

const asset = (name: string) => encodeURI(name);

const catalogData = [
  {
    "id": "acdc-back-in-black",
    "title": "Back In Black",
    "artist": "ACDC",
    "bpm": 89,
    "seconds": 256,
    "stem": "ACDC - Back In Black",
    "language": "en"
  },
  {
    "id": "adele-rolling-in-the-deep",
    "title": "Rolling in the Deep",
    "artist": "Adele",
    "bpm": 103,
    "seconds": 228,
    "stem": "Adele - Rolling in the Deep",
    "language": "en"
  },
  {
    "id": "adele-rumour-has-it",
    "title": "Rumour Has It",
    "artist": "Adele",
    "bpm": 117,
    "seconds": 223,
    "stem": "Adele - Rumour Has It",
    "language": "en"
  },
  {
    "id": "adele-send-my-love-to-your-new-lover",
    "title": "Send My Love (To Your New Lover)",
    "artist": "Adele",
    "bpm": 161,
    "seconds": 223,
    "stem": "Adele - Send My Love (To Your New Lover)",
    "language": "en"
  },
  {
    "id": "adele-water-under-the-bridge",
    "title": "Water Under the Bridge",
    "artist": "Adele",
    "bpm": 96,
    "seconds": 240,
    "stem": "Adele - Water Under the Bridge",
    "language": "en"
  },
  {
    "id": "agera-endless-sky",
    "title": "Endless Sky",
    "artist": "Agera",
    "bpm": 83,
    "seconds": 111,
    "stem": "Agera - Endless Sky",
    "language": "en"
  },
  {
    "id": "alan-walker-the-spectre",
    "title": "The Spectre",
    "artist": "Alan Walker",
    "bpm": 129,
    "seconds": 194,
    "stem": "Alan Walker - The Spectre",
    "language": "en"
  },
  {
    "id": "alan-walker-aura-tomine-harket-darkside",
    "title": "Darkside",
    "artist": "Alan Walker,AuRa,Tomine Harket",
    "bpm": 86,
    "seconds": 212,
    "stem": "Alan Walker,AuRa,Tomine Harket - Darkside",
    "language": "en"
  },
  {
    "id": "ariana-grande-nicki-minaj-side-to-side",
    "title": "Side To Side",
    "artist": "Ariana Grande,Nicki Minaj",
    "bpm": 161,
    "seconds": 226,
    "stem": "Ariana Grande,Nicki Minaj - Side To Side",
    "language": "en"
  },
  {
    "id": "avicii-levels-radio-edit",
    "title": "Levels (Radio Edit)",
    "artist": "Avicii",
    "bpm": 123,
    "seconds": 200,
    "stem": "Avicii - Levels (Radio Edit)",
    "language": "en"
  },
  {
    "id": "avicii-aloe-blacc-wake-me-up",
    "title": "Wake Me Up",
    "artist": "Avicii,Aloe Blacc",
    "bpm": 123,
    "seconds": 250,
    "stem": "Avicii,Aloe Blacc - Wake Me Up",
    "language": "en"
  },
  {
    "id": "blackpink-how-you-like-that",
    "title": "How You Like That",
    "artist": "BLACKPINK",
    "bpm": 129,
    "seconds": 181,
    "stem": "BLACKPINK - How You Like That",
    "language": "en"
  },
  {
    "id": "blackpink-kill-this-love",
    "title": "Kill This Love",
    "artist": "BLACKPINK",
    "bpm": 132,
    "seconds": 189,
    "stem": "BLACKPINK - Kill This Love",
    "language": "en"
  },
  {
    "id": "beyonce-single-ladies-put-a-ring-on-it",
    "title": "Single Ladies (Put a Ring on It)",
    "artist": "Beyoncé",
    "bpm": 96,
    "seconds": 194,
    "stem": "Beyoncé - Single Ladies (Put a Ring on It)",
    "language": "en"
  },
  {
    "id": "beyond",
    "title": "不再犹豫",
    "artist": "Beyond",
    "bpm": 136,
    "seconds": 256,
    "stem": "Beyond - 不再犹豫",
    "language": "zh"
  },
  {
    "id": "beyond-2",
    "title": "大地",
    "artist": "Beyond",
    "bpm": 72,
    "seconds": 261,
    "stem": "Beyond - 大地",
    "language": "zh"
  },
  {
    "id": "beyond-3",
    "title": "海阔天空",
    "artist": "Beyond",
    "bpm": 77,
    "seconds": 240,
    "stem": "Beyond - 海阔天空",
    "language": "zh"
  },
  {
    "id": "bill-conti-gonna-fly-now",
    "title": "Gonna Fly Now",
    "artist": "Bill Conti",
    "bpm": 96,
    "seconds": 170,
    "stem": "Bill Conti - Gonna Fly Now",
    "language": "en"
  },
  {
    "id": "billie-eilish-bad-guy",
    "title": "bad guy",
    "artist": "Billie Eilish",
    "bpm": 135,
    "seconds": 194,
    "stem": "Billie Eilish - bad guy",
    "language": "en"
  },
  {
    "id": "billie-eilish-you-should-see-me-in-a-crown",
    "title": "you should see me in a crown",
    "artist": "Billie Eilish",
    "bpm": 152,
    "seconds": 181,
    "stem": "Billie Eilish - you should see me in a crown",
    "language": "en"
  },
  {
    "id": "black-eyed-peas-boom-boom-pow",
    "title": "Boom Boom Pow",
    "artist": "Black Eyed Peas",
    "bpm": 129,
    "seconds": 251,
    "stem": "Black Eyed Peas - Boom Boom Pow",
    "language": "en"
  },
  {
    "id": "black-eyed-peas-hey-mama",
    "title": "Hey Mama",
    "artist": "Black Eyed Peas",
    "bpm": 136,
    "seconds": 215,
    "stem": "Black Eyed Peas - Hey Mama",
    "language": "en"
  },
  {
    "id": "black-eyed-peas-let-s-get-it-started",
    "title": "Let's Get It Started",
    "artist": "Black Eyed Peas",
    "bpm": 103,
    "seconds": 216,
    "stem": "Black Eyed Peas - Let's Get It Started",
    "language": "en"
  },
  {
    "id": "black-eyed-peas-pump-it",
    "title": "Pump It",
    "artist": "Black Eyed Peas",
    "bpm": 103,
    "seconds": 214,
    "stem": "Black Eyed Peas - Pump It",
    "language": "en"
  },
  {
    "id": "bon-jovi-it-s-my-life",
    "title": "It's My Life",
    "artist": "Bon Jovi",
    "bpm": 117,
    "seconds": 225,
    "stem": "Bon Jovi - It's My Life",
    "language": "en"
  },
  {
    "id": "bruce-springsteen-dancing-in-the-dark",
    "title": "Dancing In the Dark",
    "artist": "Bruce Springsteen",
    "bpm": 74,
    "seconds": 241,
    "stem": "Bruce Springsteen - Dancing In the Dark",
    "language": "en"
  },
  {
    "id": "bruno-mars-locked-out-of-heaven",
    "title": "Locked Out of Heaven",
    "artist": "Bruno Mars",
    "bpm": 144,
    "seconds": 234,
    "stem": "Bruno Mars - Locked Out of Heaven",
    "language": "en"
  },
  {
    "id": "bruno-mars-runaway-baby",
    "title": "Runaway Baby",
    "artist": "Bruno Mars",
    "bpm": 161,
    "seconds": 148,
    "stem": "Bruno Mars - Runaway Baby",
    "language": "en"
  },
  {
    "id": "calvin-harris-feel-so-close",
    "title": "Feel So Close",
    "artist": "Calvin Harris",
    "bpm": 65,
    "seconds": 203,
    "stem": "Calvin Harris - Feel So Close",
    "language": "en"
  },
  {
    "id": "calvin-harris-summer",
    "title": "Summer",
    "artist": "Calvin Harris",
    "bpm": 129,
    "seconds": 222,
    "stem": "Calvin Harris - Summer",
    "language": "en"
  },
  {
    "id": "calvin-harris-dua-lipa-one-kiss",
    "title": "One Kiss",
    "artist": "Calvin Harris,Dua Lipa",
    "bpm": 123,
    "seconds": 215,
    "stem": "Calvin Harris,Dua Lipa - One Kiss",
    "language": "en"
  },
  {
    "id": "calvin-harris-rihanna-this-is-what-you-came-for",
    "title": "This Is What You Came For",
    "artist": "Calvin Harris,Rihanna",
    "bpm": 123,
    "seconds": 222,
    "stem": "Calvin Harris,Rihanna - This Is What You Came For",
    "language": "en"
  },
  {
    "id": "clean-bandit-jess-glynne-rather-be",
    "title": "Rather Be",
    "artist": "Clean Bandit,Jess Glynne",
    "bpm": 121,
    "seconds": 228,
    "stem": "Clean Bandit,Jess Glynne - Rather Be",
    "language": "en"
  },
  {
    "id": "clean-bandit-zara-larsson-symphony",
    "title": "Symphony",
    "artist": "Clean Bandit,Zara Larsson",
    "bpm": 81,
    "seconds": 213,
    "stem": "Clean Bandit,Zara Larsson - Symphony",
    "language": "en"
  },
  {
    "id": "coldplay-adventure-of-a-lifetime",
    "title": "Adventure of a Lifetime",
    "artist": "Coldplay",
    "bpm": 112,
    "seconds": 264,
    "stem": "Coldplay - Adventure of a Lifetime",
    "language": "en"
  },
  {
    "id": "coldplay-hymn-for-the-weekend",
    "title": "Hymn For the Weekend",
    "artist": "Coldplay",
    "bpm": 89,
    "seconds": 249,
    "stem": "Coldplay - Hymn For the Weekend",
    "language": "en"
  },
  {
    "id": "coldplay-viva-la-vida",
    "title": "Viva La Vida",
    "artist": "Coldplay",
    "bpm": 138,
    "seconds": 242,
    "stem": "Coldplay - Viva La Vida",
    "language": "en"
  },
  {
    "id": "daft-punk-around-the-world",
    "title": "Around the World",
    "artist": "Daft Punk",
    "bpm": 123,
    "seconds": 430,
    "stem": "Daft Punk - Around the World",
    "language": "en"
  },
  {
    "id": "daft-punk-harder-better-faster-stronger",
    "title": "Harder, Better, Faster, Stronger",
    "artist": "Daft Punk",
    "bpm": 123,
    "seconds": 226,
    "stem": "Daft Punk - Harder, Better, Faster, Stronger",
    "language": "en"
  },
  {
    "id": "daft-punk-one-more-time",
    "title": "One More Time",
    "artist": "Daft Punk",
    "bpm": 123,
    "seconds": 320,
    "stem": "Daft Punk - One More Time",
    "language": "en"
  },
  {
    "id": "darude-sandstorm",
    "title": "Sandstorm",
    "artist": "Darude",
    "bpm": 68,
    "seconds": 226,
    "stem": "Darude - Sandstorm",
    "language": "en"
  },
  {
    "id": "david-guetta-sia-titanium",
    "title": "Titanium",
    "artist": "David Guetta,Sia",
    "bpm": 123,
    "seconds": 245,
    "stem": "David Guetta,Sia - Titanium",
    "language": "en"
  },
  {
    "id": "dua-lipa-physical",
    "title": "Physical",
    "artist": "Dua Lipa",
    "bpm": 144,
    "seconds": 194,
    "stem": "Dua Lipa - Physical",
    "language": "en"
  },
  {
    "id": "ed-sheeran-bad-habits",
    "title": "Bad Habits",
    "artist": "Ed Sheeran",
    "bpm": 126,
    "seconds": 231,
    "stem": "Ed Sheeran - Bad Habits",
    "language": "en"
  },
  {
    "id": "ed-sheeran-photograph",
    "title": "Photograph",
    "artist": "Ed Sheeran",
    "bpm": 72,
    "seconds": 259,
    "stem": "Ed Sheeran - Photograph",
    "language": "en"
  },
  {
    "id": "ed-sheeran-shape-of-you",
    "title": "Shape of You",
    "artist": "Ed Sheeran",
    "bpm": 96,
    "seconds": 234,
    "stem": "Ed Sheeran - Shape of You",
    "language": "en"
  },
  {
    "id": "eiffel-65-blue-da-ba-dee",
    "title": "Blue (Da Ba Dee)",
    "artist": "Eiffel 65",
    "bpm": 129,
    "seconds": 286,
    "stem": "Eiffel 65 - Blue (Da Ba Dee)",
    "language": "en"
  },
  {
    "id": "eminem-lose-yourself",
    "title": "Lose Yourself",
    "artist": "Eminem",
    "bpm": 172,
    "seconds": 322,
    "stem": "Eminem - Lose Yourself",
    "language": "en"
  },
  {
    "id": "eminem-nate-dogg-till-i-collapse",
    "title": "'Till I Collapse",
    "artist": "Eminem,Nate Dogg",
    "bpm": 152,
    "seconds": 298,
    "stem": "Eminem,Nate Dogg - 'Till I Collapse",
    "language": "en"
  },
  {
    "id": "eric-prydz-opus",
    "title": "Opus",
    "artist": "Eric Prydz",
    "bpm": 129,
    "seconds": 543,
    "stem": "Eric Prydz - Opus",
    "language": "en"
  },
  {
    "id": "europe-the-final-countdown",
    "title": "The Final Countdown",
    "artist": "Europe",
    "bpm": 117,
    "seconds": 311,
    "stem": "Europe - The Final Countdown",
    "language": "en"
  },
  {
    "id": "fisher-losing-it",
    "title": "Losing It",
    "artist": "FISHER",
    "bpm": 123,
    "seconds": 248,
    "stem": "FISHER - Losing It",
    "language": "en"
  },
  {
    "id": "fall-out-boy-centuries",
    "title": "Centuries",
    "artist": "Fall Out Boy",
    "bpm": 89,
    "seconds": 228,
    "stem": "Fall Out Boy - Centuries",
    "language": "en"
  },
  {
    "id": "fall-out-boy-my-songs-know-what-you-did-in-the-d",
    "title": "My Songs Know What You Did In The Dark (Light Em Up)",
    "artist": "Fall Out Boy",
    "bpm": 152,
    "seconds": 187,
    "stem": "Fall Out Boy - My Songs Know What You Did In The Dark (Light Em Up)",
    "language": "en"
  },
  {
    "id": "fall-out-boy-sugar-we-re-goin-down",
    "title": "Sugar We're Goin' Down",
    "artist": "Fall Out Boy",
    "bpm": 81,
    "seconds": 233,
    "stem": "Fall Out Boy - Sugar We're Goin' Down",
    "language": "en"
  },
  {
    "id": "florence-the-machine-dog-days-are-over",
    "title": "Dog Days Are Over",
    "artist": "Florence + The Machine",
    "bpm": 152,
    "seconds": 253,
    "stem": "Florence + The Machine - Dog Days Are Over",
    "language": "en"
  },
  {
    "id": "foo-fighters-everlong",
    "title": "Everlong",
    "artist": "Foo Fighters",
    "bpm": 78,
    "seconds": 250,
    "stem": "Foo Fighters - Everlong",
    "language": "en"
  },
  {
    "id": "foo-fighters-the-pretender",
    "title": "The Pretender",
    "artist": "Foo Fighters",
    "bpm": 86,
    "seconds": 268,
    "stem": "Foo Fighters - The Pretender",
    "language": "en"
  },
  {
    "id": "fort-minor-remember-the-name-album-version",
    "title": "Remember The Name (Album Version)",
    "artist": "Fort Minor",
    "bpm": 112,
    "seconds": 227,
    "stem": "Fort Minor - Remember The Name (Album Version)",
    "language": "en"
  },
  {
    "id": "g-e-m",
    "title": "句号",
    "artist": "G.E.M.邓紫棋",
    "bpm": 144,
    "seconds": 236,
    "stem": "G.E.M.邓紫棋 - 句号",
    "language": "zh"
  },
  {
    "id": "g-e-m-2",
    "title": "来自天堂的魔鬼",
    "artist": "G.E.M.邓紫棋",
    "bpm": 136,
    "seconds": 246,
    "stem": "G.E.M.邓紫棋 - 来自天堂的魔鬼",
    "language": "zh"
  },
  {
    "id": "g-e-m-3",
    "title": "泡沫",
    "artist": "G.E.M.邓紫棋",
    "bpm": 68,
    "seconds": 259,
    "stem": "G.E.M.邓紫棋 - 泡沫",
    "language": "zh"
  },
  {
    "id": "green-day-american-idiot",
    "title": "American Idiot",
    "artist": "Green Day",
    "bpm": 92,
    "seconds": 174,
    "stem": "Green Day - American Idiot",
    "language": "en"
  },
  {
    "id": "green-day-boulevard-of-broken-dreams",
    "title": "Boulevard of Broken Dreams",
    "artist": "Green Day",
    "bpm": 83,
    "seconds": 262,
    "stem": "Green Day - Boulevard of Broken Dreams",
    "language": "en"
  },
  {
    "id": "green-day-holiday",
    "title": "Holiday",
    "artist": "Green Day",
    "bpm": 144,
    "seconds": 233,
    "stem": "Green Day - Holiday",
    "language": "en"
  },
  {
    "id": "harry-styles-as-it-was",
    "title": "As It Was",
    "artist": "Harry Styles",
    "bpm": 172,
    "seconds": 167,
    "stem": "Harry Styles - As It Was",
    "language": "en"
  },
  {
    "id": "imagine-dragons-radioactive",
    "title": "Radioactive",
    "artist": "Imagine Dragons",
    "bpm": 136,
    "seconds": 188,
    "stem": "Imagine Dragons - Radioactive",
    "language": "en"
  },
  {
    "id": "imagine-dragons-thunder",
    "title": "Thunder",
    "artist": "Imagine Dragons",
    "bpm": 172,
    "seconds": 188,
    "stem": "Imagine Dragons - Thunder",
    "language": "en"
  },
  {
    "id": "jason-derulo-snoop-dogg-wiggle",
    "title": "Wiggle",
    "artist": "Jason Derulo,Snoop Dogg",
    "bpm": 112,
    "seconds": 194,
    "stem": "Jason Derulo,Snoop Dogg - Wiggle",
    "language": "en"
  },
  {
    "id": "jessie-j-ariana-grande-nicki-minaj-bang-bang",
    "title": "Bang Bang",
    "artist": "Jessie J,Ariana Grande,Nicki Minaj",
    "bpm": 152,
    "seconds": 199,
    "stem": "Jessie J,Ariana Grande,Nicki Minaj - Bang Bang",
    "language": "en"
  },
  {
    "id": "justin-timberlake-can-t-stop-the-feeling-origina",
    "title": "CAN'T STOP THE FEELING! (Original Song from DreamWorks Animation's TROLLS)",
    "artist": "Justin Timberlake",
    "bpm": 112,
    "seconds": 237,
    "stem": "Justin Timberlake - CAN'T STOP THE FEELING! (Original Song from DreamWorks Animation's TROLLS)",
    "language": "en"
  },
  {
    "id": "katrina-the-waves-walking-on-sunshine",
    "title": "Walking On Sunshine",
    "artist": "Katrina & the Waves",
    "bpm": 108,
    "seconds": 239,
    "stem": "Katrina & the Waves - Walking On Sunshine",
    "language": "en"
  },
  {
    "id": "katy-perry-firework",
    "title": "Firework",
    "artist": "Katy Perry",
    "bpm": 123,
    "seconds": 228,
    "stem": "Katy Perry - Firework",
    "language": "en"
  },
  {
    "id": "katy-perry-roar",
    "title": "Roar",
    "artist": "Katy Perry",
    "bpm": 89,
    "seconds": 224,
    "stem": "Katy Perry - Roar",
    "language": "en"
  },
  {
    "id": "katy-perry-teenage-dream",
    "title": "Teenage Dream",
    "artist": "Katy Perry",
    "bpm": 117,
    "seconds": 228,
    "stem": "Katy Perry - Teenage Dream",
    "language": "en"
  },
  {
    "id": "katy-perry-wide-awake",
    "title": "Wide Awake",
    "artist": "Katy Perry",
    "bpm": 81,
    "seconds": 220,
    "stem": "Katy Perry - Wide Awake",
    "language": "en"
  },
  {
    "id": "katy-perry-juicy-j-dark-horse",
    "title": "Dark Horse",
    "artist": "Katy Perry,Juicy J",
    "bpm": 129,
    "seconds": 216,
    "stem": "Katy Perry,Juicy J - Dark Horse",
    "language": "en"
  },
  {
    "id": "lil-nas-x-jack-harlow-industry-baby",
    "title": "INDUSTRY BABY",
    "artist": "Lil Nas X,Jack Harlow",
    "bpm": 152,
    "seconds": 212,
    "stem": "Lil Nas X,Jack Harlow - INDUSTRY BABY",
    "language": "en"
  },
  {
    "id": "little-mix-stormzy-power",
    "title": "Power",
    "artist": "Little Mix,Stormzy",
    "bpm": 86,
    "seconds": 242,
    "stem": "Little Mix,Stormzy - Power",
    "language": "en"
  },
  {
    "id": "luis-fonsi-daddy-yankee-despacito",
    "title": "Despacito",
    "artist": "Luis Fonsi,Daddy Yankee",
    "bpm": 89,
    "seconds": 231,
    "stem": "Luis Fonsi,Daddy Yankee - Despacito",
    "language": "en"
  },
  {
    "id": "macklemore-ryan-lewis-ray-dalton-can-t-hold-us",
    "title": "Can't Hold Us",
    "artist": "Macklemore & Ryan Lewis,Ray Dalton",
    "bpm": 144,
    "seconds": 258,
    "stem": "Macklemore & Ryan Lewis,Ray Dalton - Can't Hold Us",
    "language": "en"
  },
  {
    "id": "major-lazer-diplo-nyla-light-it-up",
    "title": "Light It Up",
    "artist": "Major Lazer,Diplo,Nyla",
    "bpm": 123,
    "seconds": 199,
    "stem": "Major Lazer,Diplo,Nyla - Light It Up",
    "language": "en"
  },
  {
    "id": "maroon-5-sugar",
    "title": "Sugar",
    "artist": "Maroon 5",
    "bpm": 120,
    "seconds": 234,
    "stem": "Maroon 5 - Sugar",
    "language": "en"
  },
  {
    "id": "michael-jackson-beat-it",
    "title": "Beat It",
    "artist": "Michael Jackson",
    "bpm": 136,
    "seconds": 258,
    "stem": "Michael Jackson - Beat It",
    "language": "en"
  },
  {
    "id": "olivia-rodrigo-good-4-u",
    "title": "good 4 u",
    "artist": "Olivia Rodrigo",
    "bpm": 83,
    "seconds": 178,
    "stem": "Olivia Rodrigo - good 4 u",
    "language": "en"
  },
  {
    "id": "onerepublic-counting-stars",
    "title": "Counting Stars",
    "artist": "OneRepublic",
    "bpm": 122,
    "seconds": 257,
    "stem": "OneRepublic - Counting Stars",
    "language": "en"
  },
  {
    "id": "panuma-tokyo-project-emiah-siren",
    "title": "Siren",
    "artist": "Panuma,Tokyo Project,Emiah",
    "bpm": 129,
    "seconds": 169,
    "stem": "Panuma,Tokyo Project,Emiah - Siren",
    "language": "en"
  },
  {
    "id": "pharrell-williams-happy",
    "title": "Happy",
    "artist": "Pharrell Williams",
    "bpm": 161,
    "seconds": 235,
    "stem": "Pharrell Williams - Happy",
    "language": "en"
  },
  {
    "id": "post-malone-circles",
    "title": "Circles",
    "artist": "Post Malone",
    "bpm": 123,
    "seconds": 215,
    "stem": "Post Malone - Circles",
    "language": "en"
  },
  {
    "id": "post-malone-21-savage-rockstar",
    "title": "rockstar",
    "artist": "Post Malone,21 Savage",
    "bpm": 161,
    "seconds": 218,
    "stem": "Post Malone,21 Savage - rockstar",
    "language": "en"
  },
  {
    "id": "queen-don-t-stop-me-now",
    "title": "Don't Stop Me Now",
    "artist": "Queen",
    "bpm": 99,
    "seconds": 210,
    "stem": "Queen - Don't Stop Me Now",
    "language": "en"
  },
  {
    "id": "rihanna-only-girl-in-the-world",
    "title": "Only Girl (In The World)",
    "artist": "Rihanna",
    "bpm": 129,
    "seconds": 236,
    "stem": "Rihanna - Only Girl (In The World)",
    "language": "en"
  },
  {
    "id": "rihanna-where-have-you-been",
    "title": "Where Have You Been",
    "artist": "Rihanna",
    "bpm": 129,
    "seconds": 243,
    "stem": "Rihanna - Where Have You Been",
    "language": "en"
  },
  {
    "id": "rihanna-calvin-harris-we-found-love",
    "title": "We Found Love",
    "artist": "Rihanna,Calvin Harris",
    "bpm": 172,
    "seconds": 215,
    "stem": "Rihanna,Calvin Harris - We Found Love",
    "language": "en"
  },
  {
    "id": "rihanna-jay-z-umbrella",
    "title": "Umbrella",
    "artist": "Rihanna,JAŸ-Z",
    "bpm": 117,
    "seconds": 276,
    "stem": "Rihanna,JAŸ-Z - Umbrella",
    "language": "en"
  },
  {
    "id": "robert-miles-children",
    "title": "Children",
    "artist": "Robert Miles",
    "bpm": 136,
    "seconds": 411,
    "stem": "Robert Miles - Children",
    "language": "en"
  },
  {
    "id": "s-h-e-super-star-live",
    "title": "super star (Live)",
    "artist": "S.H.E",
    "bpm": 92,
    "seconds": 196,
    "stem": "S.H.E - super star (Live)",
    "language": "en"
  },
  {
    "id": "s-h-e-live",
    "title": "痛快(Live)",
    "artist": "S.H.E",
    "bpm": 103,
    "seconds": 196,
    "stem": "S.H.E - 痛快(Live)",
    "language": "zh"
  },
  {
    "id": "sia-cheap-thrills",
    "title": "Cheap Thrills",
    "artist": "Sia",
    "bpm": 185,
    "seconds": 212,
    "stem": "Sia - Cheap Thrills",
    "language": "en"
  },
  {
    "id": "sia-the-greatest",
    "title": "The Greatest",
    "artist": "Sia",
    "bpm": 129,
    "seconds": 209,
    "stem": "Sia - The Greatest",
    "language": "en"
  },
  {
    "id": "sia-unstoppable",
    "title": "Unstoppable",
    "artist": "Sia",
    "bpm": 174,
    "seconds": 218,
    "stem": "Sia - Unstoppable",
    "language": "en"
  },
  {
    "id": "skrillex-scary-monsters-and-nice-sprites",
    "title": "Scary Monsters and Nice Sprites",
    "artist": "Skrillex",
    "bpm": 92,
    "seconds": 243,
    "stem": "Skrillex - Scary Monsters and Nice Sprites",
    "language": "en"
  },
  {
    "id": "steppenwolf-born-to-be-wild",
    "title": "Born To Be Wild",
    "artist": "Steppenwolf",
    "bpm": 144,
    "seconds": 217,
    "stem": "Steppenwolf - Born To Be Wild",
    "language": "en"
  },
  {
    "id": "survivor-eye-of-the-tiger",
    "title": "Eye Of The Tiger",
    "artist": "Survivor",
    "bpm": 108,
    "seconds": 231,
    "stem": "Survivor - Eye Of The Tiger",
    "language": "en"
  },
  {
    "id": "swedish-house-mafia-save-the-world",
    "title": "Save The World",
    "artist": "Swedish House Mafia",
    "bpm": 129,
    "seconds": 214,
    "stem": "Swedish House Mafia - Save The World",
    "language": "en"
  },
  {
    "id": "swedish-house-mafia-john-martin-don-t-you-worry-",
    "title": "Don't You Worry Child",
    "artist": "Swedish House Mafia,John Martin",
    "bpm": 129,
    "seconds": 404,
    "stem": "Swedish House Mafia,John Martin - Don't You Worry Child",
    "language": "en"
  },
  {
    "id": "taylor-swift-bad-blood",
    "title": "Bad Blood",
    "artist": "Taylor Swift",
    "bpm": 86,
    "seconds": 212,
    "stem": "Taylor Swift - Bad Blood",
    "language": "en"
  },
  {
    "id": "taylor-swift-cruel-summer",
    "title": "Cruel Summer",
    "artist": "Taylor Swift",
    "bpm": 112,
    "seconds": 179,
    "stem": "Taylor Swift - Cruel Summer",
    "language": "en"
  },
  {
    "id": "taylor-swift-shake-it-off",
    "title": "Shake It Off",
    "artist": "Taylor Swift",
    "bpm": 160,
    "seconds": 219,
    "stem": "Taylor Swift - Shake It Off",
    "language": "en"
  },
  {
    "id": "the-chainsmokers-paris",
    "title": "Paris",
    "artist": "The Chainsmokers",
    "bpm": 99,
    "seconds": 222,
    "stem": "The Chainsmokers - Paris",
    "language": "en"
  },
  {
    "id": "the-chainsmokers-coldplay-something-just-like-th",
    "title": "Something Just Like This",
    "artist": "The Chainsmokers,Coldplay",
    "bpm": 103,
    "seconds": 248,
    "stem": "The Chainsmokers,Coldplay - Something Just Like This",
    "language": "en"
  },
  {
    "id": "the-chainsmokers-daya-don-t-let-me-down",
    "title": "Don't Let Me Down",
    "artist": "The Chainsmokers,Daya",
    "bpm": 161,
    "seconds": 209,
    "stem": "The Chainsmokers,Daya - Don't Let Me Down",
    "language": "en"
  },
  {
    "id": "the-chainsmokers-halsey-closer",
    "title": "Closer",
    "artist": "The Chainsmokers,Halsey",
    "bpm": 96,
    "seconds": 245,
    "stem": "The Chainsmokers,Halsey - Closer",
    "language": "en"
  },
  {
    "id": "the-chainsmokers-rozes-roses",
    "title": "Roses",
    "artist": "The Chainsmokers,ROZES",
    "bpm": 99,
    "seconds": 226,
    "stem": "The Chainsmokers,ROZES - Roses",
    "language": "en"
  },
  {
    "id": "the-killers-mr-brightside",
    "title": "Mr. Brightside",
    "artist": "The Killers",
    "bpm": 74,
    "seconds": 224,
    "stem": "The Killers - Mr. Brightside",
    "language": "en"
  },
  {
    "id": "the-script-will-i-am-hall-of-fame",
    "title": "Hall of Fame",
    "artist": "The Script,will.i.am",
    "bpm": 172,
    "seconds": 202,
    "stem": "The Script,will.i.am - Hall of Fame",
    "language": "en"
  },
  {
    "id": "the-weeknd-blinding-lights",
    "title": "Blinding Lights",
    "artist": "The Weeknd",
    "bpm": 171,
    "seconds": 200,
    "stem": "The Weeknd - Blinding Lights",
    "language": "en"
  },
  {
    "id": "the-weeknd-daft-punk-starboy",
    "title": "Starboy",
    "artist": "The Weeknd,Daft Punk",
    "bpm": 123,
    "seconds": 231,
    "stem": "The Weeknd,Daft Punk - Starboy",
    "language": "en"
  },
  {
    "id": "vicetone-haley-reinhart-something-strange",
    "title": "Something Strange",
    "artist": "Vicetone,Haley Reinhart",
    "bpm": 117,
    "seconds": 190,
    "stem": "Vicetone,Haley Reinhart - Something Strange",
    "language": "en"
  },
  {
    "id": "walk-the-moon-shut-up-and-dance",
    "title": "Shut up and Dance",
    "artist": "Walk The Moon",
    "bpm": 129,
    "seconds": 199,
    "stem": "Walk The Moon - Shut up and Dance",
    "language": "en"
  },
  {
    "id": "a-ha-take-on-me",
    "title": "Take On Me",
    "artist": "a-ha",
    "bpm": 172,
    "seconds": 229,
    "stem": "a-ha - Take On Me",
    "language": "en"
  },
  {
    "id": "song",
    "title": "倔强",
    "artist": "五月天",
    "bpm": 156,
    "seconds": 262,
    "stem": "五月天 - 倔强",
    "language": "zh"
  },
  {
    "id": "song-2",
    "title": "派对动物",
    "artist": "五月天",
    "bpm": 136,
    "seconds": 250,
    "stem": "五月天 - 派对动物",
    "language": "zh"
  },
  {
    "id": "song-3",
    "title": "知足",
    "artist": "五月天",
    "bpm": 81,
    "seconds": 257,
    "stem": "五月天 - 知足",
    "language": "zh"
  },
  {
    "id": "china-blue",
    "title": "突然的自我",
    "artist": "伍佰 & China Blue",
    "bpm": 78,
    "seconds": 215,
    "stem": "伍佰 & China Blue - 突然的自我",
    "language": "zh"
  },
  {
    "id": "song-4",
    "title": "挪威的森林",
    "artist": "伍佰",
    "bpm": 136,
    "seconds": 393,
    "stem": "伍佰 - 挪威的森林",
    "language": "zh"
  },
  {
    "id": "song-5",
    "title": "天黑黑",
    "artist": "孙燕姿",
    "bpm": 103,
    "seconds": 234,
    "stem": "孙燕姿 - 天黑黑",
    "language": "zh"
  },
  {
    "id": "song-6",
    "title": "天下",
    "artist": "张杰",
    "bpm": 72,
    "seconds": 222,
    "stem": "张杰 - 天下",
    "language": "zh"
  },
  {
    "id": "song-7",
    "title": "年轻的战场",
    "artist": "张杰",
    "bpm": 129,
    "seconds": 293,
    "stem": "张杰 - 年轻的战场",
    "language": "zh"
  },
  {
    "id": "song-8",
    "title": "最美的太阳",
    "artist": "张杰",
    "bpm": 152,
    "seconds": 257,
    "stem": "张杰 - 最美的太阳",
    "language": "zh"
  },
  {
    "id": "song-9",
    "title": "这就是爱",
    "artist": "张杰",
    "bpm": 136,
    "seconds": 292,
    "stem": "张杰 - 这就是爱",
    "language": "zh"
  },
  {
    "id": "song-10",
    "title": "好想你",
    "artist": "朱主爱",
    "bpm": 96,
    "seconds": 157,
    "stem": "朱主爱 - 好想你",
    "language": "zh"
  },
  {
    "id": "song-11",
    "title": "生如夏花",
    "artist": "朴树",
    "bpm": 103,
    "seconds": 295,
    "stem": "朴树 - 生如夏花",
    "language": "zh"
  },
  {
    "id": "song-12",
    "title": "无价之姐",
    "artist": "李宇春",
    "bpm": 129,
    "seconds": 185,
    "stem": "李宇春 - 无价之姐",
    "language": "zh"
  },
  {
    "id": "song-13",
    "title": "曹操",
    "artist": "林俊杰",
    "bpm": 144,
    "seconds": 242,
    "stem": "林俊杰 - 曹操",
    "language": "zh"
  },
  {
    "id": "live",
    "title": "大城小爱(Live)",
    "artist": "王力宏",
    "bpm": 123,
    "seconds": 223,
    "stem": "王力宏 - 大城小爱(Live)",
    "language": "zh"
  },
  {
    "id": "live-2",
    "title": "盖世英雄(Live)",
    "artist": "王力宏",
    "bpm": 136,
    "seconds": 243,
    "stem": "王力宏 - 盖世英雄(Live)",
    "language": "zh"
  },
  {
    "id": "song-14",
    "title": "冷酷到底",
    "artist": "羽·泉",
    "bpm": 68,
    "seconds": 241,
    "stem": "羽·泉 - 冷酷到底",
    "language": "zh"
  },
  {
    "id": "song-15",
    "title": "最美",
    "artist": "羽·泉",
    "bpm": 96,
    "seconds": 300,
    "stem": "羽·泉 - 最美",
    "language": "zh"
  },
  {
    "id": "song-16",
    "title": "深呼吸",
    "artist": "羽·泉",
    "bpm": 103,
    "seconds": 300,
    "stem": "羽·泉 - 深呼吸",
    "language": "zh"
  },
  {
    "id": "song-17",
    "title": "忽然之间",
    "artist": "莫文蔚",
    "bpm": 136,
    "seconds": 202,
    "stem": "莫文蔚 - 忽然之间",
    "language": "zh"
  },
  {
    "id": "song-18",
    "title": "一个人的精彩",
    "artist": "萧亚轩",
    "bpm": 129,
    "seconds": 188,
    "stem": "萧亚轩 - 一个人的精彩",
    "language": "zh"
  },
  {
    "id": "song-19",
    "title": "日不落",
    "artist": "蔡依林",
    "bpm": 129,
    "seconds": 229,
    "stem": "蔡依林 - 日不落",
    "language": "zh"
  },
  {
    "id": "song-20",
    "title": "舞娘",
    "artist": "蔡依林",
    "bpm": 123,
    "seconds": 185,
    "stem": "蔡依林 - 舞娘",
    "language": "zh"
  },
  {
    "id": "song-21",
    "title": "野蛮游戏",
    "artist": "蔡依林",
    "bpm": 92,
    "seconds": 233,
    "stem": "蔡依林 - 野蛮游戏",
    "language": "zh"
  },
  {
    "id": "song-22",
    "title": "像风一样自由",
    "artist": "许巍",
    "bpm": 96,
    "seconds": 222,
    "stem": "许巍 - 像风一样自由",
    "language": "zh"
  },
  {
    "id": "song-23",
    "title": "完美生活",
    "artist": "许巍",
    "bpm": 89,
    "seconds": 297,
    "stem": "许巍 - 完美生活",
    "language": "zh"
  },
  {
    "id": "song-24",
    "title": "曾经的你",
    "artist": "许巍",
    "bpm": 96,
    "seconds": 261,
    "stem": "许巍 - 曾经的你",
    "language": "zh"
  },
  {
    "id": "song-25",
    "title": "一万次悲伤",
    "artist": "逃跑计划",
    "bpm": 92,
    "seconds": 256,
    "stem": "逃跑计划 - 一万次悲伤",
    "language": "zh"
  },
  {
    "id": "song-26",
    "title": "孤勇者",
    "artist": "陈奕迅",
    "bpm": 130,
    "seconds": 256,
    "stem": "陈奕迅 - 孤勇者",
    "language": "zh"
  },
  {
    "id": "song-27",
    "title": "爱不爱我",
    "artist": "零点乐队",
    "bpm": 136,
    "seconds": 329,
    "stem": "零点乐队 - 爱不爱我",
    "language": "zh"
  },
  {
    "id": "song-28",
    "title": "相信自己",
    "artist": "零点乐队",
    "bpm": 118,
    "seconds": 214,
    "stem": "零点乐队 - 相信自己",
    "language": "zh"
  }
] as const;

export const catalog: Song[] = catalogData.map((s) => ({
  id: s.id, title: s.title, artist: s.artist, bpm: s.bpm, seconds: s.seconds,
  file: asset(`/music/${s.stem}.mp3`), cover: asset(`/covers/${s.stem}.jpg`),
  language: s.language, firstBeatOffsetSeconds: 0,
}));

export const emptyDraft = (): TrainingDraft => ({ minutes: 0, activity: "", language: "mixed", intensity: "" });

export function chineseNumberToInt(input: string) {
  const digits: Record<string, number> = { 零: 0, 〇: 0, 一: 1, 二: 2, 两: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9 };
  if (!input) return 0;
  if (!/[十百]/.test(input)) return [...input].reduce((value, char) => value * 10 + (digits[char] ?? 0), 0);
  let total = 0; let current = 0;
  for (const char of input) {
    if (char in digits) current = digits[char];
    else if (char === "十") { total += (current || 1) * 10; current = 0; }
    else if (char === "百") { total += (current || 1) * 100; current = 0; }
  }
  return total + current;
}

/** Rules always take precedence over an LLM response. They are the deterministic demo fallback. */
export function parseRequest(text: string): Partial<TrainingDraft> {
  const duration = text.match(/(\d{1,3})\s*(?:分钟|分|min)/i)?.[1];
  const chineseDuration = text.match(/([零〇一二两三四五六七八九十百]+)\s*(?:分钟|分)/)?.[1];
  const statedMinutes = duration ? Number(duration) : chineseNumberToInt(chineseDuration || "");
  const activity: Activity | "" = /爬坡|坡度/.test(text) ? "跑步机爬坡" : /快走/.test(text) ? "跑步机快走" : /跑步|慢跑|\b跑\b/.test(text) || /跑/.test(text) ? "跑步" : "";
  const language: MusicLanguage | "" = /全(?:部)?英文|英文歌|欧美/.test(text) ? "en" : /全(?:部)?中文|华语|中文歌/.test(text) ? "zh" : "";
  const rawStages: Array<{ minutes: number; speed: number }> = [];
  const segmentPattern = /(?:前|后|然后|再|接着)?\s*(\d+|[零〇一二两三四五六七八九十百]+)\s*分钟\s*([\d.]+)\s*(?:km\s*\/\s*h|公里\s*\/\s*小时|千米\s*\/\s*小时)/gi;
  for (const match of text.matchAll(segmentPattern)) rawStages.push({ minutes: /^\d+$/.test(match[1]) ? Number(match[1]) : chineseNumberToInt(match[1]), speed: Number(match[2]) });
  const firstStagePosition = text.search(/(?:前|后|然后|再|接着)\s*(?:\d+|[零〇一二两三四五六七八九十百]+)\s*分钟/i);
  const hasTotalBeforeStages = firstStagePosition > 0 && /(?:\d+|[零〇一二两三四五六七八九十百]+)\s*(?:分钟|分|min)/i.test(text.slice(0, firstStagePosition));
  let minutes = statedMinutes;
  if (!hasTotalBeforeStages && rawStages.length >= 2) minutes = rawStages.reduce((sum, item) => sum + item.minutes, 0);
  const remainingSpeed = text.match(/(?:后面(?:全部)?|后续|其余|剩下(?:的)?时间)\s*(?:都|全部|按)?\s*([\d.]+)\s*(?:km\s*\/\s*h|公里\s*\/\s*小时|千米\s*\/\s*小时)/i)?.[1];
  if (remainingSpeed && minutes > 0) {
    const used = rawStages.reduce((sum, item) => sum + item.minutes, 0);
    if (minutes > used) rawStages.push({ minutes: minutes - used, speed: Number(remainingSpeed) });
  }
  // A complete constant-speed prescription is just as explicit as a
  // multi-stage one: “跑步四十分钟，匀速 10km/h”.
  const uniformSpeed = text.match(/(?:匀速|全程|一直|保持)\s*(?:在|按)?\s*([\d.]+)\s*(?:km\s*\/\s*h|公里\s*\/\s*小时|千米\s*\/\s*小时)/i)?.[1];
  if (!rawStages.length && uniformSpeed && minutes > 0) rawStages.push({ minutes, speed: Number(uniformSpeed) });
  // Keep valid partial stages even when their sum disagrees with the stated
  // total. The conflict layer must surface that mismatch instead of silently
  // dropping the user's explicit speeds and asking an unrelated question.
  const customStages = rawStages.length && rawStages.every((item) => item.minutes > 0 && item.speed > 0 && item.speed <= 25) ? rawStages : undefined;
  const intensity: Intensity | "" = customStages ? "custom" : /轻松|别太累|低强度/.test(text) ? "easy" : /高强度|挑战|冲刺/.test(text) ? "hard" : /中等|适中/.test(text) ? "medium" : /你决定|ai\s*安排|帮我安排|不知道|不懂(?:配速)?/i.test(text) ? "ai" : "";
  const parsed: Partial<TrainingDraft> = {};
  if (minutes > 0 && minutes <= 180) parsed.minutes = minutes;
  if (activity) parsed.activity = activity;
  if (language) parsed.language = language;
  if (intensity) parsed.intensity = intensity;
  if (customStages) parsed.customStages = customStages;
  return parsed;
}

export function mergeDraft(current: TrainingDraft, incoming: Partial<TrainingDraft>): TrainingDraft {
  return {
    minutes: incoming.minutes && incoming.minutes > 0 ? incoming.minutes : current.minutes,
    activity: incoming.activity || current.activity,
    language: incoming.language || current.language,
    intensity: incoming.intensity || current.intensity,
    customStages: incoming.customStages || current.customStages,
  };
}

/** Validates untrusted model/API JSON before it touches the training state. */
export function normalizeIntentPayload(value: unknown, sourceText = ""): Partial<TrainingDraft> {
  if (!value || typeof value !== "object") return {};
  const payload = value as Record<string, unknown>;
  const parsed: Partial<TrainingDraft> = {};
  const minutes = Number(payload.minutes);
  if (Number.isFinite(minutes) && minutes >= 3 && minutes <= 180) parsed.minutes = Math.round(minutes);
  if (["跑步", "跑步机爬坡", "跑步机快走"].includes(String(payload.activity))) parsed.activity = payload.activity as Activity;
  // Language is a hard preference only when the user actually said it. This
  // prevents a Chinese-language request from being misread as “Chinese songs”.
  const languageEvidence = typeof payload.languageEvidence === "string" ? payload.languageEvidence.trim() : "";
  if (payload.languageExplicit === true && languageEvidence && sourceText.includes(languageEvidence) && ["mixed", "zh", "en"].includes(String(payload.language))) parsed.language = payload.language as MusicLanguage;
  if (["easy", "medium", "hard", "ai", "custom"].includes(String(payload.intensity))) parsed.intensity = payload.intensity as Intensity;
  if (Array.isArray(payload.customStages)) {
    const stages = payload.customStages
      .map((item) => item && typeof item === "object" ? item as Record<string, unknown> : null)
      .filter((item): item is Record<string, unknown> => item !== null)
      .map((item) => ({ minutes: Number(item.minutes), speed: Number(item.speed) }))
      .filter((item) => Number.isFinite(item.minutes) && item.minutes > 0 && Number.isFinite(item.speed) && item.speed > 0 && item.speed <= 25);
    if (stages.length) {
      if (!parsed.minutes) parsed.minutes = stages.reduce((sum, stage) => sum + stage.minutes, 0);
      parsed.customStages = stages;
      parsed.intensity = "custom";
    }
  }
  return parsed;
}

export function nextMissing(draft: TrainingDraft) {
  if (!draft.minutes) return "minutes" as const;
  if (!draft.activity) return "activity" as const;
  if (!draft.intensity) return "intensity" as const;
  return null;
}

export function questionFor(draft: TrainingDraft) {
  const missing = nextMissing(draft);
  if (missing === "minutes") return "这次准备训练多长时间？这是生成严格时间轴必须知道的。";
  if (missing === "activity") return `记住了，${draft.minutes} 分钟。这次准备跑步、爬坡还是快走？`;
  if (missing === "intensity") return "最后确认训练强度。不了解配速也没关系，可以明确授权 AI 安排。";
  return "条件已完整。确认后我会生成明确速度、目标 SPM 与严格时间轴。";
}

export function detectPlanConflicts(draft: TrainingDraft): PlanConflict[] {
  if (!draft.customStages?.length || !draft.minutes) return [];
  const stagesMinutes = draft.customStages.reduce((sum, stage) => sum + stage.minutes, 0);
  if (Math.abs(stagesMinutes - draft.minutes) < 0.01) return [];
  return [{
    code: "duration_mismatch",
    totalMinutes: draft.minutes,
    stagesMinutes,
    message: `总时长是 ${draft.minutes} 分钟，但分段合计 ${stagesMinutes} 分钟。需要先确认剩余时间怎么安排。`,
  }];
}

const cadenceFactor: Record<CadenceProfile, number> = { short: 1.08, standard: 1, long: 0.92 };

function withCadenceProfile(stages: Array<Omit<Stage, "baseSpm"> & { baseSpm?: number }>, profile: CadenceProfile): Stage[] {
  return stages.map((stage) => {
    const baseSpm = stage.baseSpm ?? stage.targetSpm;
    return { ...stage, baseSpm, targetSpm: Math.round(baseSpm * cadenceFactor[profile]) };
  });
}

export function buildStages(minutes: number, activity: Activity, requestedIntensity: Intensity): Stage[] {
  const warm = Math.max(3, Math.round(minutes * 0.2));
  const cool = Math.max(3, Math.round(minutes * 0.2));
  const main = Math.max(4, minutes - warm - cool);
  const intensity = requestedIntensity === "ai" ? "medium" : requestedIntensity;
  const training = (name: string, medium: [number, number], easy: [number, number], hard: [number, number]) => {
    const prescription = intensity === "easy" ? easy : intensity === "hard" ? hard : medium;
    return { name, minutes: main, speed: prescription[0], targetSpm: prescription[1], baseSpm: prescription[1], tone: "red" };
  };
  if (activity === "跑步机爬坡") return [
    { name: "坡前热身", minutes: warm, speed: intensity === "hard" ? 6 : intensity === "easy" ? 5 : 5.5, targetSpm: intensity === "hard" ? 126 : intensity === "easy" ? 108 : 118, baseSpm: intensity === "hard" ? 126 : intensity === "easy" ? 108 : 118, tone: "blue" },
    training("稳定爬坡", [6.5, 132], [5.8, 120], [7.5, 150]),
    { name: "降坡冷却", minutes: cool, speed: 5, targetSpm: 108, baseSpm: 108, tone: "ink" },
  ];
  if (activity === "跑步机快走") return [
    { name: "轻松起步", minutes: warm, speed: 5, targetSpm: 108, baseSpm: 108, tone: "blue" },
    training("节奏快走", [6.2, 120], [5.7, 114], [6.8, 132]),
    { name: "舒缓冷却", minutes: cool, speed: 4.5, targetSpm: 106, baseSpm: 106, tone: "ink" },
  ];
  return [
    { name: "慢跑热身", minutes: warm, speed: intensity === "hard" ? 6.5 : intensity === "easy" ? 5.5 : 6, targetSpm: intensity === "hard" ? 126 : intensity === "easy" ? 112 : 120, baseSpm: intensity === "hard" ? 126 : intensity === "easy" ? 112 : 120, tone: "blue" },
    training("目标配速", [10, 160], [8, 150], [12, 174]),
    { name: "慢走冷却", minutes: cool, speed: 5.5, targetSpm: 108, baseSpm: 108, tone: "ink" },
  ];
}

function cadenceForSpeed(speed: number) {
  // Continuous treadmill baseline: 5 km/h ≈ 120 SPM, 10 km/h ≈ 160 SPM.
  // Keeping the curve monotonic is more important than pretending the MVP
  // knows an exact stride length; the user's calibration scales this baseline.
  return Math.max(90, Math.min(200, Math.round(80 + speed * 8)));
}

export function buildCustomStages(customStages: Array<{ minutes: number; speed: number }>): Stage[] {
  return customStages.map((item, index) => ({
    name: customStages.length === 1 ? "自定义训练" : index === 0 ? "自定义起始阶段" : index === customStages.length - 1 ? "自定义后续阶段" : `自定义阶段 ${index + 1}`,
    minutes: item.minutes,
    speed: item.speed,
    targetSpm: cadenceForSpeed(item.speed),
    baseSpm: cadenceForSpeed(item.speed),
    tone: index === 0 ? "blue" : index === customStages.length - 1 ? "ink" : "red",
  }));
}

function cadenceMatch(song: Song, targetSpm: number) {
  return [1, 2, 0.5].map((beatsPerStep) => {
    const desiredMusicBpm = targetSpm * beatsPerStep;
    const playbackRate = Math.min(1.1, Math.max(0.9, desiredMusicBpm / song.bpm));
    const adjustedMusicBpm = song.bpm * playbackRate;
    return { beatsPerStep, playbackRate, adjustedMusicBpm, error: Math.abs(adjustedMusicBpm / beatsPerStep - targetSpm) };
  }).sort((a, b) => a.error - b.error || Math.abs(a.beatsPerStep - 1) - Math.abs(b.beatsPerStep - 1))[0];
}

function stableRank(songs: Song[], targetSpm: number, seed: number) {
  return [...songs].sort((a, b) => {
    const aMatch = cadenceMatch(a, targetSpm);
    const bMatch = cadenceMatch(b, targetSpm);
    return aMatch.error - bMatch.error || ((a.id.charCodeAt(0) + seed) % 19) - ((b.id.charCodeAt(0) + seed) % 19);
  });
}

export function buildSchedule(stages: Stage[], seed: number, language: MusicLanguage, songs = catalog): { schedule: ScheduledTrack[]; repeated: boolean } | BuildFailure {
  const eligible = language === "mixed" ? songs : songs.filter((song) => song.language === language);
  if (!eligible.length) return { kind: "catalog", message: "当前曲库没有符合所选语言的歌曲。", choices: ["允许重复歌曲", "放宽变速范围", "允许其他语言", "缩短训练时长"] };
  const schedule: ScheduledTrack[] = [];
  let cursor = 0;
  let repeated = false;
  stages.forEach((stage, stageIndex) => {
    let remaining = stage.minutes * 60;
    const ranked = stableRank(eligible, stage.targetSpm, seed + stageIndex);
    let pick = 0;
    while (remaining > 0.001) {
      const song = ranked[pick % ranked.length];
      repeated ||= pick >= ranked.length;
      const match = cadenceMatch(song, stage.targetSpm);
      const playbackRate = match.playbackRate;
      const available = song.seconds / playbackRate;
      const playSeconds = Math.min(remaining, available);
      schedule.push({ id: `${stageIndex}-${pick}-${song.id}`, song, stageIndex, startsAt: cursor, endsAt: cursor + playSeconds, playSeconds, playbackRate, adjustedMusicBpm: Math.round(match.adjustedMusicBpm), beatsPerStep: match.beatsPerStep, clipped: playSeconds < available - 0.01 });
      remaining = Math.max(0, remaining - playSeconds);
      cursor += playSeconds;
      pick += 1;
    }
  });
  return { schedule, repeated };
}

export function buildPlan(draft: TrainingDraft, seed = 1, cadenceProfile: CadenceProfile = "standard"): BuildResult {
  const missing = ["minutes", "activity", "intensity"].filter((field) => !draft[field as keyof TrainingDraft]) as Array<"minutes" | "activity" | "intensity">;
  if (missing.length) return { ok: false, error: { kind: "missing-fields", missing, message: questionFor(draft) } };
  const conflicts = detectPlanConflicts(draft);
  if (conflicts.length) return { ok: false, error: { kind: "conflict", message: conflicts[0].message } };
  const stages = withCadenceProfile(draft.customStages?.length ? buildCustomStages(draft.customStages) : buildStages(draft.minutes, draft.activity as Activity, draft.intensity as Intensity), cadenceProfile);
  const result = buildSchedule(stages, seed, draft.language);
  if ("kind" in result) return { ok: false, error: result };
  return {
    ok: true,
    plan: {
      version: 1,
      title: draft.activity === "跑步机爬坡" ? "把坡度踩进节拍里" : `${draft.minutes} 分钟，跟着节拍完成`,
      activity: draft.activity as Activity,
      minutes: draft.minutes,
      level: draft.intensity === "custom" ? "自定义配速" : draft.intensity === "easy" ? "轻松强度" : draft.intensity === "hard" ? "挑战强度" : "中等强度",
      musicLanguage: draft.language,
      intensity: draft.intensity as Intensity,
      stages,
      schedule: result.schedule,
      songs: result.schedule.map((item) => item.song),
      notices: result.repeated ? ["当前语言曲库已循环使用部分歌曲；未混入其他语言歌曲。"] : [],
      cadenceProfile,
    },
  };
}

export function retunePlanCadence(plan: Plan, profile: CadenceProfile, seed = 1): Plan {
  const stages = withCadenceProfile(plan.stages, profile);
  const result = buildSchedule(stages, seed, plan.musicLanguage);
  if ("kind" in result) return plan;
  return { ...plan, stages, schedule: result.schedule, songs: result.schedule.map((item) => item.song), cadenceProfile: profile };
}

export function currentScheduleIndex(schedule: Array<Pick<ScheduledTrack, "startsAt" | "endsAt">>, elapsed: number) {
  const index = schedule.findIndex((item) => elapsed >= item.startsAt && elapsed < item.endsAt);
  return index >= 0 ? index : Math.max(0, schedule.length - 1);
}

export function formatTime(seconds: number) {
  const safe = Math.max(0, Math.floor(seconds));
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, "0")}`;
}
