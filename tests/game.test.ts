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
  chooseVoice,
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
test("result voice avoids repeats and maps independently from grade", () => {
  let last = "";
  const r = rng();
  for (let i = 0; i < 100; i++) {
    const v = chooseVoice(last, r);
    assert.notEqual(v.id, last);
    last = v.id;
  }
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
