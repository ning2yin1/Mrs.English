import { existsSync, writeFileSync } from "node:fs";
import { assets, modes, questions, topics } from "../src/data";
import { easyQuestion, isCorrect, sentence } from "../src/game";
let failures: string[] = [];
for (const q of questions) {
  const e = easyQuestion(q.id);
  if (
    !isCorrect(q.id, e.before + e.answer + e.after) ||
    !isCorrect(q.id, sentence(q.tokens))
  )
    failures.push(q.id);
  if (modes[q.id].hardDistractors.length !== 3) failures.push(q.id + " hard");
}
for (const a of [...assets.cards, ...assets.audio, ...assets.backgrounds])
  if (!existsSync(a.path)) failures.push(a.path);
const report = {
  generatedAt: new Date().toISOString(),
  topics: topics.length,
  questions: questions.length,
  modeCases: questions.length * 4,
  backgrounds: assets.backgrounds.length,
  cards: assets.cards.length,
  voices: assets.audio.length,
  failures,
  editorialReview:
    "Source sentences and grammar targets reviewed during implementation; not certified by an independent native-speaking educator.",
};
writeFileSync(
  "data/implementation-validation.json",
  JSON.stringify(report, null, 2) + "\n",
);
console.log(JSON.stringify(report, null, 2));
if (failures.length) process.exitCode = 1;
