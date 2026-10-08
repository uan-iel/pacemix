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

export const catalog: Song[] = [
  ["viva", "Viva La Vida", "Coldplay", 138, 242, "Coldplay - Viva La Vida"],
  ["radio", "Radioactive", "Imagine Dragons", 136, 187, "Imagine Dragons - Radioactive"],
  ["badguy", "bad guy", "Billie Eilish", 135, 194, "Billie Eilish - bad guy"],
  ["kill", "Kill This Love", "BLACKPINK", 132, 189, "BLACKPINK - Kill This Love"],
  ["hero", "孤勇者", "陈奕迅", 130, 256, "陈奕迅 - 孤勇者"],
  ["party", "派对动物", "五月天", 136, 250, "五月天 - 派对动物"],
  ["stars", "Counting Stars", "OneRepublic", 122, 257, "Counting Stars"],
  ["rather", "Rather Be", "Clean Bandit, Jess Glynne", 121, 228, "Clean Bandit,Jess Glynne - Rather Be"],
  ["sugar", "Sugar", "Maroon 5", 120, 235, "Maroon 5 - Sugar"],
  ["habit", "Bad Habits", "Ed Sheeran", 126, 231, "Ed Sheeran - Bad Habits"],
  ["believe", "相信自己", "零点乐队", 118, 214, "零点乐队 - 相信自己"],
  ["shake", "Shake It Off", "Taylor Swift", 160, 219, "Taylor Swift - Shake It Off"],
  ["lights", "Blinding Lights", "The Weeknd", 171, 200, "The Weeknd - Blinding Lights"],
  ["stop", "Unstoppable", "Sia", 174, 218, "Sia - Unstoppable"],
  ["stubborn", "倔强", "五月天", 156, 262, "五月天 - 倔强"],
  ["sky", "海阔天空", "Beyond", 77, 240, "Beyond - 海阔天空"],
].map(([id, title, artist, bpm, seconds, stem]) => ({
  id: String(id), title: String(title), artist: String(artist), bpm: Number(bpm), seconds: Number(seconds),
  file: asset(`/music/${stem}.mp3`), cover: asset(`/covers/${stem}.jpg`),
  language: (["hero", "party", "believe", "stubborn", "sky"].includes(String(id)) ? "zh" : "en") as Song["language"],
  firstBeatOffsetSeconds: 0,
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
