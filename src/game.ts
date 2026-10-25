import {
  assets,
  byQuestion,
  difficulties,
  members,
  modes,
  questions,
  rates,
  topics,
  type Difficulty,
  type Member,
  type Voice,
} from "./data";
export const normalize = (s: string) =>
  s
    .normalize("NFKC")
    .replace(/[’‘]/g, "'")
    .trim()
    .toLowerCase()
    .replace(/\s*([,;:])\s*/g, "$1 ")
    .replace(/[.!?]+\s*$/, "")
    .replace(/\s+/g, " ")
    .trim();
export function isCorrect(id: string, answer: string) {
  const q = byQuestion[id];
  return [q.english, ...q.acceptedAnswers].some(
    (a) => normalize(a) === normalize(answer),
  );
}
export const grade = (correct: number) =>
  correct === 10 ? "S" : correct >= 8 ? "A" : correct >= 6 ? "B" : "C";
export function random() {
  const v = new Uint32Array(1);
  globalThis.crypto.getRandomValues(v);
  return v[0] / 4294967296;
}
export function shuffle<T>(a: readonly T[], rng = random): T[] {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}
export function easyQuestion(id: string) {
  const q = byQuestion[id],
    e = modes[id].easy;
  return {
    before: q.english.slice(0, e.start),
    after: q.english.slice(e.start + e.length),
    answer: e.answer,
    options: shuffle([e.answer, ...e.distractors]),
  };
}
export function bank(id: string, difficulty: Difficulty) {
  return shuffle([
    ...byQuestion[id].tokens,
    ...(difficulty === "HARD"
      ? modes[id].hardDistractors.map((text, i) => ({ id: `${id}D${i}`, text }))
      : []),
  ]);
}
export function sentence(tokens: { text: string }[]) {
  return tokens
    .map((t) => t.text)
    .join(" ")
    .replace(/\s+([.,!?;:])/g, "$1");
}
export type Settings = {
  member: Member;
  wallpaper: string;
  bgm: number;
  sfx: number;
  voice: number;
  muted: boolean;
  motion: boolean;
};
export type Session = {
  id: string;
  topic: string;
  difficulty: Difficulty;
  member: Member;
  step: number;
  answers: { question: string; answer: string; correct: boolean }[];
};
export type Result = {
  id: string;
  topic: string;
  difficulty: Difficulty;
  member: Member;
  correct: number;
  gp: number;
  affection: number;
  voiceId: string;
  at: string;
};
export type Save = {
  version: 1;
  gp: number;
  cards: Record<string, number>;
  affection: Record<Member, number>;
  chat: Record<string, number>;
  records: Record<string, { best: number; plays: number; last: number }>;
  mistakes: string[];
  settings: Settings;
  login: { days: number; last: string; claimed: string[] };
  session: Session | null;
  result: Result | null;
  gacha: string[];
  lastVoice: string;
};
export function freshSave(): Save {
  return {
    version: 1,
    gp: 0,
    cards: {},
    affection: { motoki: 0, hiloto: 0, ryoka: 0 },
    chat: {},
    records: {},
    mistakes: [],
    settings: {
      member: "motoki",
      wallpaper: "BG01",
      bgm: 0.3,
      sfx: 0.45,
      voice: 0.7,
      muted: false,
      motion: true,
    },
    login: { days: 0, last: "", claimed: [] },
    session: null,
    result: null,
    gacha: [],
    lastVoice: "",
  };
}
export function begin(s: Save, topic: string, difficulty: Difficulty): void {
  if (!topics.some((t) => t.id === topic) || !difficulties.includes(difficulty))
    throw Error("無効なステージです。");
  s.session = {
    id: crypto.randomUUID(),
    topic,
    difficulty,
    member: s.settings.member,
    step: 0,
    answers: [],
  };
  s.result = null;
}
export function answerQuestion(
  s: Save,
  sessionId: string,
  index: number,
  answer: string,
): boolean {
  const p = s.session;
  if (
    !p ||
    p.id !== sessionId ||
    p.answers.length !== index ||
    p.step !== index ||
    index >= 10
  )
    return false;
  const question = topics.find((t) => t.id === p.topic)!.questionIds[index];
  const correct = isCorrect(question, answer);
  p.answers.push({ question, answer, correct });
  s.mistakes = s.mistakes.filter((x) => x !== question);
  if (!correct) s.mistakes.push(question);
  return true;
}
export function chooseVoice(last: string, rng = random): Voice {
  const pool = assets.audio.filter((v) => v.id !== last);
  return pool[Math.floor(rng() * pool.length)];
}
export function finish(
  s: Save,
  sessionId: string,
  rng = random,
): Result | null {
  if (s.result?.id === sessionId) return s.result;
  const p = s.session;
  if (!p || p.id !== sessionId || p.answers.length !== 10 || p.step !== 10)
    return null;
  const correct = p.answers.filter((a) => a.correct).length,
    gp = correct * rates[p.difficulty],
    affection = correct + (correct === 10 ? 5 : 0),
    v = chooseVoice(s.lastVoice, rng);
  const result: Result = {
    id: p.id,
    topic: p.topic,
    difficulty: p.difficulty,
    member: p.member,
    correct,
    gp,
    affection,
    voiceId: v.id,
    at: new Date().toISOString(),
  };
  s.gp += gp;
  s.affection[p.member] += affection;
  const k = `${p.topic}:${p.difficulty}`,
    r = s.records[k];
  s.records[k] = {
    best: Math.max(r?.best ?? 0, correct * 100),
    plays: (r?.plays ?? 0) + 1,
    last: correct * 100,
  };
  s.result = result;
  s.lastVoice = v.id;
  s.session = null;
  return result;
}
export function rarity(rng = random): "C" | "B" | "A" | "S" {
  const n = rng();
  return n < 0.6 ? "C" : n < 0.85 ? "B" : n < 0.97 ? "A" : "S";
}
export function draw(s: Save, count: 1 | 10, rng = random): string[] {
  const cost = count === 10 ? 2700 : 300;
  if (s.gp < cost) throw Error("GPが足りません。PLAYで何度でも獲得できます。");
  const ranks = Array.from({ length: count }, () => rarity(rng));
  // Conditional A/S distribution preserves the 12:3 ratio for the guaranteed slot.
  if (count === 10 && !ranks.some((r) => r === "A" || r === "S"))
    ranks[9] = rng() < 0.8 ? "A" : "S";
  const result = ranks.map((r) => {
    const pool = assets.cards.filter((c) => c.rarity === r);
    return pool[Math.floor(rng() * pool.length)].id;
  });
  s.gp -= cost;
  for (const id of result) s.cards[id] = (s.cards[id] ?? 0) + 1;
  s.gacha = result;
  return result;
}
export function localDate(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export const loginRewards = [50, 60, 70, 80, 90, 100, 200];
export function claimLogin(s: Save, date = localDate()): number {
  if (date <= s.login.last || s.login.claimed.includes(date)) return 0;
  const gp = loginRewards[s.login.days % 7];
  s.gp += gp;
  s.login.days++;
  s.login.last = date;
  s.login.claimed.push(date);
  return gp;
}
const object = (x: unknown): x is Record<string, any> =>
  !!x && typeof x === "object" && !Array.isArray(x);
const integer = (x: unknown, max = 1e12): x is number =>
  typeof x === "number" && Number.isSafeInteger(x) && x >= 0 && x <= max;
export function validateSave(input: unknown): Save {
  const bad = () => {
    throw Error(
      "バックアップの形式・値・参照が不正です。現在のデータは変更していません。",
    );
  };
  if (!object(input)) return bad();
  const s = input as Save;
  const memberIds = members.map((m) => m.id),
    cardIds = new Set(assets.cards.map((c) => c.id));
  if (
    s.version !== 1 ||
    !integer(s.gp) ||
    !object(s.cards) ||
    !object(s.affection) ||
    !object(s.settings) ||
    !object(s.records) ||
    !object(s.chat) ||
    !object(s.login)
  )
    return bad();
  if (
    Object.entries(s.cards).some(
      ([id, n]) => !cardIds.has(id) || !integer(n, 1e9),
    )
  )
    return bad();
  if (memberIds.some((id) => !integer(s.affection[id], 1e9))) return bad();
  if (
    !memberIds.includes(s.settings.member) ||
    !assets.backgrounds.some((b) => b.id === s.settings.wallpaper)
  )
    return bad();
  if (
    ["bgm", "sfx", "voice"].some(
      (k) =>
        typeof s.settings[k as "bgm"] !== "number" ||
        !Number.isFinite(s.settings[k as "bgm"]) ||
        s.settings[k as "bgm"] < 0 ||
        s.settings[k as "bgm"] > 1,
    ) ||
    typeof s.settings.muted !== "boolean" ||
    typeof s.settings.motion !== "boolean"
  )
    return bad();
  if (
    !Array.isArray(s.mistakes) ||
    s.mistakes.length > 600 ||
    new Set(s.mistakes).size !== s.mistakes.length ||
    s.mistakes.some((id) => !byQuestion[id])
  )
    return bad();
  if (
    Object.entries(s.records).some(
      ([k, v]) =>
        !/^G(0[1-9]|[1-5][0-9]|60):(EASY|NORMAL|HARD|MASTER)$/.test(k) ||
        !object(v) ||
        !integer(v.best, 1000) ||
        v.best % 100 !== 0 ||
        !integer(v.last, 1000) ||
        v.last % 100 !== 0 ||
        !integer(v.plays, 1e9),
    )
  )
    return bad();
  if (
    Object.entries(s.chat).some(
      ([k, v]) => !memberIds.includes(k as Member) || !integer(v, 32767),
    )
  )
    return bad();
  const date = (d: unknown) =>
    typeof d === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(d) &&
    !Number.isNaN(Date.parse(d)) &&
    new Date(d).toISOString().slice(0, 10) === d;
  if (
    !integer(s.login.days, 1e6) ||
    !Array.isArray(s.login.claimed) ||
    s.login.claimed.length !== s.login.days ||
    s.login.claimed.some((d) => !date(d)) ||
    new Set(s.login.claimed).size !== s.login.days ||
    (s.login.days === 0
      ? s.login.last !== ""
      : s.login.last !== [...s.login.claimed].sort().at(-1))
  )
    return bad();
  if (
    !Array.isArray(s.gacha) ||
    ![0, 1, 10].includes(s.gacha.length) ||
    s.gacha.some((id) => !cardIds.has(id) || !s.cards[id])
  )
    return bad();
  if (
    typeof s.lastVoice !== "string" ||
    (s.lastVoice !== "" && !assets.audio.some((v) => v.id === s.lastVoice))
  )
    return bad();
  const validBase = (p: any) =>
    object(p) &&
    typeof p.id === "string" &&
    p.id.length > 0 &&
    p.id.length < 100 &&
    topics.some((t) => t.id === p.topic) &&
    difficulties.includes(p.difficulty) &&
    memberIds.includes(p.member);
  if (s.session !== null && s.result !== null) return bad();
  if (s.session !== null) {
    const p = s.session;
    if (
      !validBase(p) ||
      !Array.isArray(p.answers) ||
      p.answers.length > 10 ||
      !integer(p.step, 9) ||
      ![p.step, p.step + 1].includes(p.answers.length)
    )
      return bad();
    const ids = topics.find((t) => t.id === p.topic)!.questionIds;
    if (
      p.answers.some(
        (a, i) =>
          !object(a) ||
          a.question !== ids[i] ||
          typeof a.answer !== "string" ||
          a.answer.length > 1000 ||
          a.correct !== isCorrect(a.question, a.answer),
      )
    )
      return bad();
  }
  if (s.result !== null) {
    const r = s.result;
    if (
      !validBase(r) ||
      !integer(r.correct, 10) ||
      r.gp !== r.correct * rates[r.difficulty] ||
      r.affection !== r.correct + (r.correct === 10 ? 5 : 0) ||
      !assets.audio.some((v) => v.id === r.voiceId) ||
      typeof r.at !== "string" ||
      Number.isNaN(Date.parse(r.at))
    )
      return bad();
  }
  // Copy the known root schema; validation has checked all consumed values.
  const clean = freshSave();
  for (const key of Object.keys(clean) as (keyof Save)[])
    (clean as any)[key] = structuredClone(s[key]);
  return clean;
}
export function exportSave(s: Save) {
  return JSON.stringify(
    {
      app: "Mrs.English",
      format: 1,
      exportedAt: new Date().toISOString(),
      data: s,
    },
    null,
    2,
  );
}
export function importSave(text: string) {
  if (text.length > 2_000_000)
    throw Error("バックアップは2MB以下にしてください。");
  const x = JSON.parse(text);
  if (x?.app !== "Mrs.English" || x?.format !== 1)
    throw Error("Mrs.Englishのバックアップを選んでください。");
  return validateSave(x.data);
}
