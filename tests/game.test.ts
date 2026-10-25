import {
  choosePresentation,
  resultCandidates,
  voiceReviews,
} from "../src/voices";
import { claimWelcome, finishWelcome } from "../src/game";
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import {
  assets,
  byQuestion,
  difficulties,
  modes,
  questions,
  topics,
} from "../src/data";
import {
  answerQuestion,
  bank,
  begin,
  claimLogin,
  draw,
  easyQuestion,
  exportSave,
  finish,
  freshSave,
  grade,
  importSave,
  isCorrect,
  normalize,
  rarity,
  sentence,
  validateSave,
} from "../src/game";
const rng =
  (seed = 1729) =>
  () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
test("60 topics, 600 unique questions, all IDs, curriculum and asset references", () => {
  assert.equal(topics.length, 60);
  assert.equal(questions.length, 600);
  assert.equal(new Set(questions.map((q) => q.english)).size, 600);
  assert.equal(new Set(questions.map((q) => q.id)).size, 600);
  for (const [i, t] of topics.entries()) {
    assert.equal(t.number, i + 1);
    assert.equal(t.questionIds.length, 10);
    assert.equal(
      t.backgroundId,
      `BG${String(Math.floor(i / 3) + 1).padStart(2, "0")}`,
    );
    for (const id of t.questionIds) assert.equal(byQuestion[id].topicId, t.id);
  }
  for (const a of [...assets.cards, ...assets.audio, ...assets.backgrounds])
    assert.ok(existsSync(a.path), a.path);
  for (const voice of assets.audio)
    if (voice.member !== "group")
      assert.equal(
        assets.cards.find((c) => c.id === voice.resultPhotoCardId)?.member,
        voice.member,
      );
});
test("all 600 items are solvable in four modes; EASY options unique, wrong options rejected", () => {
  for (const q of questions) {
    const e = easyQuestion(q.id),
      o = modes[q.id];
    assert.equal(e.options.length, 4, q.id);
    assert.equal(new Set(e.options.map(normalize)).size, 4, q.id);
    assert.equal(e.before + e.answer + e.after, q.english, q.id);
    assert.ok(isCorrect(q.id, e.before + e.answer + e.after));
    for (const wrong of o.easy.distractors)
      assert.equal(isCorrect(q.id, e.before + wrong + e.after), false, q.id);
    for (const d of ["NORMAL", "HARD"] as const) {
      const b = bank(q.id, d);
      assert.equal(new Set(b.map((t) => t.id)).size, b.length, q.id);
      assert.equal(b.length, q.tokens.length + (d === "HARD" ? 3 : 0));
      assert.ok(isCorrect(q.id, sentence(q.tokens)), `${q.id} ${d}`);
    }
    assert.ok(
      isCorrect(
        q.id,
        `  ${q.english
          .toUpperCase()
          .replace(/ /g, "  ")
          .replace(/[.!?]$/, "")}  `,
      ),
    );
    assert.equal(isCorrect(q.id, "This is definitely not the answer."), false);
    assert.equal(o.hardDistractors.length, 3);
    assert.equal(new Set(o.hardDistractors).size, 3);
    assert.ok(
      o.hardDistractors.every(
        (t) => !q.tokens.some((k) => k.text.toLowerCase() === t.toLowerCase()),
      ),
    );
  }
});
test("240 complete sessions, reward accounting and replay idempotence", () => {
  for (const t of topics)
    for (const d of difficulties) {
      const s = freshSave();
      begin(s, t.id, d);
      const id = s.session!.id;
      for (let i = 0; i < 10; i++) {
        assert.ok(
          answerQuestion(s, id, i, byQuestion[t.questionIds[i]].english),
        );
        assert.equal(
          answerQuestion(s, id, i, byQuestion[t.questionIds[i]].english),
          false,
        );
        s.session!.step++;
      }
      const result = finish(s, id, rng())!;
      assert.equal(result.correct, 10);
      assert.equal(
        result.gp,
        { EASY: 100, NORMAL: 150, HARD: 200, MASTER: 300 }[d],
      );
      assert.equal(result.affection, 15);
      assert.equal(s.gp, result.gp);
      assert.equal(s.affection.motoki, 15);
      assert.equal(grade(result.correct), "S");
      finish(s, id);
      assert.equal(s.gp, result.gp);
      assert.equal(s.records[`${t.id}:${d}`].plays, 1);
      validateSave(s);
      begin(s, t.id, d);
      const id2 = s.session!.id;
      for (let i = 0; i < 10; i++) {
        answerQuestion(s, id2, i, "wrong");
        s.session!.step++;
      }
      finish(s, id2);
      assert.equal(s.gp, result.gp);
      assert.equal(s.affection.motoki, 15);
      assert.equal(s.mistakes.length, 10);
      assert.equal(s.records[`${t.id}:${d}`].best, 1000);
      assert.equal(s.records[`${t.id}:${d}`].plays, 2);
    }
});
test("partial scores, independent affection, grades and unfinished sessions", () => {
  for (let n = 0; n <= 10; n++) {
    const s = freshSave();
    s.settings.member = "ryoka";
    begin(s, "G01", "HARD");
    const id = s.session!.id;
    assert.equal(finish(s, id), null);
    for (let i = 0; i < 10; i++) {
      answerQuestion(s, id, i, i < n ? questions[i].english : "wrong");
      s.session!.step++;
    }
    finish(s, id);
    assert.equal(s.gp, n * 20);
    assert.equal(s.affection.motoki, 0);
    assert.equal(s.affection.ryoka, n + (n === 10 ? 5 : 0));
    assert.equal(grade(n), n === 10 ? "S" : n >= 8 ? "A" : n >= 6 ? "B" : "C");
  }
});
test("gacha price, counts, guaranteed A+, insufficient funds and original probabilities", () => {
  const s = freshSave();
  assert.throws(() => draw(s, 1));
  s.gp = 300;
  draw(s, 1, rng());
  assert.equal(s.gp, 0);
  assert.equal(
    Object.values(s.cards).reduce((a, b) => a + b, 0),
    1,
  );
  s.gp = 2700;
  draw(s, 10, () => 0);
  assert.equal(s.gp, 0);
  assert.equal(s.gacha.length, 10);
  assert.ok(
    s.gacha.some((id) =>
      ["A", "S"].includes(assets.cards.find((c) => c.id === id)!.rarity),
    ),
  );
  assert.equal(
    Object.values(s.cards).reduce((a, b) => a + b, 0),
    11,
  );
  const count = { C: 0, B: 0, A: 0, S: 0 },
    r = rng();
  for (let i = 0; i < 200000; i++) count[rarity(r)]++;
  for (const [k, p] of Object.entries({ C: 0.6, B: 0.25, A: 0.12, S: 0.03 }))
    assert.ok(
      Math.abs(count[k as keyof typeof count] / 200000 - p) < 0.004,
      JSON.stringify(count),
    );
  const r2 = rng(1);
  for (let i = 0; i < 1000; i++) {
    s.gp = 2700;
    draw(s, 10, r2);
    assert.ok(
      s.gacha.some((id) =>
        ["A", "S"].includes(assets.cards.find((c) => c.id === id)!.rarity),
      ),
    );
  }
});
test("login is local date based, 7 day cycle, repeat and backwards-date protection", () => {
  const s = freshSave();
  for (let i = 0; i < 8; i++) {
    const date = `2026-10-${String(10 + i).padStart(2, "0")}`;
    assert.equal(claimLogin(s, date), [50, 60, 70, 80, 90, 100, 200, 50][i]);
    assert.equal(claimLogin(s, date), 0);
  }
  assert.equal(claimLogin(s, "2026-10-01"), 0);
  assert.equal(s.gp, 700);
  validateSave(s);
});
test("save round trip, interrupted feedback state, corrupt and hostile backups rejected", () => {
  const s = freshSave();
  begin(s, "G01", "EASY");
  answerQuestion(s, s.session!.id, 0, questions[0].english);
  assert.deepEqual(importSave(exportSave(s)), s);
  assert.equal(s.session!.step, 0);
  assert.equal(s.session!.answers.length, 1);
  for (const edit of [
    (x: any) => (x.gp = -1),
    (x: any) => (x.settings.voice = 2),
    (x: any) => (x.cards.unknown = 1),
    (x: any) => (x.mistakes = ["unknown"]),
    (x: any) => (x.session.answers[0].correct = false),
    (x: any) => (x.records["G99:EASY"] = { best: 1000, plays: 1, last: 1000 }),
    (x: any) => (x.login.last = "2026-99-99"),
    (x: any) => (x.version = 3),
    (x: any) => (x.settings.member = "stranger"),
  ]) {
    const bad = structuredClone(s);
    edit(bad);
    assert.throws(() => validateSave(bad));
  }
  assert.throws(() => importSave("garbage"));
  assert.throws(() => importSave("{}"));
  assert.throws(() => importSave("x".repeat(2000001)));
  assert.deepEqual(s, importSave(exportSave(s)));
});
test("result voices match member, grade and confirmed content, with nonrepeating pairs", () => {
  const random = rng();
  for (const member of ["motoki", "hiloto", "ryoka"] as const)
    for (const rank of ["S", "A", "B", "C"]) {
      let lastVoice = "",
        lastPhoto = "";
      const pool = resultCandidates(member, rank);
      assert.ok(pool.length >= 2);
      for (let i = 0; i < 50; i++) {
        const p = choosePresentation(
          member,
          rank,
          lastVoice,
          lastPhoto,
          random,
        )!;
        assert.ok(p);
        assert.notEqual(
          p.voiceId + ":" + p.photoCardId,
          lastVoice + ":" + lastPhoto,
        );
        const review = voiceReviews.find((v) => v.voiceId === p.voiceId)!;
        assert.equal(review.member, member);
        assert.ok(review.ranks.includes(rank));
        assert.equal(review.reviewStatus, "user-confirmed-transcript");
        assert.equal(
          assets.cards.find((c) => c.id === p.photoCardId)!.member,
          member,
        );
        assert.ok(
          ![
            "group-voice-01",
            "hiloto-voice-01",
            "ryoka-voice-01",
            "motoki-voice-01",
            "motoki-voice-04",
          ].includes(p.voiceId),
        );
        lastVoice = p.voiceId;
        lastPhoto = p.photoCardId;
      }
    }
});
test("legacy v1 save migrates additively without changing GP/cards/affection/progress/settings", () => {
  const legacy: any = freshSave();
  legacy.gp = 7654;
  legacy.cards[assets.cards[0].id] = 4;
  legacy.affection.hiloto = 123;
  legacy.chat.hiloto = 5;
  legacy.records["G01:EASY"] = { best: 900, last: 800, plays: 3 };
  legacy.mistakes = ["G01Q01"];
  legacy.settings.wallpaper = "BG20";
  delete legacy.profile;
  delete legacy.lastResultPhoto;
  const before = structuredClone(legacy),
    next = validateSave(legacy);
  assert.equal(next.profile.step, 1);
  assert.equal(next.profile.giftClaimed, false);
  for (const key of Object.keys(before))
    assert.deepEqual((next as any)[key], before[key]);
  assert.deepEqual(legacy, before);
  assert.deepEqual(
    importSave(JSON.stringify({ app: "Mrs.English", format: 1, data: legacy })),
    next,
  );
});
test("free welcome ten-pack is guaranteed, costs no GP, survives reload and is awarded once", () => {
  const s = freshSave();
  s.gp = 321;
  s.profile.nickname = "MINT";
  s.profile.step = 4;
  s.cards[assets.cards[0].id] = 3;
  s.gacha = [assets.cards[0].id];
  const gift = claimWelcome(s, () => 0);
  assert.equal(gift.length, 10);
  assert.equal(s.gp, 321);
  assert.ok(
    gift.some((id) =>
      ["A", "S"].includes(assets.cards.find((c) => c.id === id)!.rarity),
    ),
  );
  assert.equal(
    Object.values(s.cards).reduce((a, b) => a + b, 0),
    13,
  );
  assert.deepEqual(s.gacha, [assets.cards[0].id]);
  const reloaded = importSave(exportSave(s));
  assert.deepEqual(
    claimWelcome(reloaded, () => 0.99),
    gift,
  );
  assert.deepEqual(reloaded, s);
  finishWelcome(reloaded);
  assert.equal(reloaded.profile.completed, true);
  assert.equal(reloaded.profile.step, 5);
  validateSave(reloaded);
  assert.deepEqual(claimWelcome(reloaded), gift);
  assert.equal(
    Object.values(reloaded.cards).reduce((a, b) => a + b, 0),
    13,
  );
});
test("onboarding validation rejects a completed profile without a claimed gift", () => {
  const s = freshSave();
  s.profile.nickname = "MINT";
  s.profile.step = 5;
  s.profile.completed = true;
  assert.throws(() => validateSave(s));
});

test("imports reject an out-of-range question cursor and unowned gacha references", () => {
  const s = freshSave();
  begin(s, "G01", "EASY");
  s.session!.step = 10;
  s.session!.answers = topics[0].questionIds.map((id) => ({
    question: id,
    answer: byQuestion[id].english,
    correct: true,
  }));
  assert.throws(() => validateSave(s));
  const g = freshSave();
  g.gacha = [assets.cards[0].id];
  assert.throws(() => validateSave(g));
});
