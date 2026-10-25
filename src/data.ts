import framing from "../data/card-framing.json" with { type: "json" };
import topicsJson from "../data/grammar-topics.json" with { type: "json" };
import questionsJson from "../data/questions-600.json" with { type: "json" };
import assetsJson from "../data/assets.json" with { type: "json" };
import modesJson from "../data/mode-overrides.json" with { type: "json" };
export const topics = topicsJson;
export const questions = questionsJson;
export type Question = (typeof questions)[number];
export const assets = {
  ...assetsJson,
  cards: assetsJson.cards.map((card) => ({
    ...card,
    ...framing[card.id as keyof typeof framing],
  })),
};
export type Card = (typeof assets.cards)[number];
export type Voice = (typeof assets.audio)[number];
export const modes = modesJson as Record<
  string,
  {
    easy: {
      start: number;
      length: number;
      answer: string;
      distractors: string[];
    };
    hardDistractors: string[];
  }
>;
export const members = [
  { id: "motoki", name: "大森 元貴", short: "MOTOKI", color: "#74f4ca" },
  { id: "hiloto", name: "若井 滉斗", short: "HIROTO", color: "#72b9ff" },
  { id: "ryoka", name: "藤澤 涼架", short: "RYOKA", color: "#ff9dd4" },
] as const;
export type Member = (typeof members)[number]["id"];
export const difficulties = ["EASY", "NORMAL", "HARD", "MASTER"] as const;
export type Difficulty = (typeof difficulties)[number];
export const rates = { EASY: 10, NORMAL: 15, HARD: 20, MASTER: 30 };
export const byQuestion = Object.fromEntries(questions.map((q) => [q.id, q]));
export const url = (path: string) => `${import.meta.env.BASE_URL}${path}`;
export const ui = (path: string) => url(`assets/ui/${path}`);
export function memberPhoto(member: string) {
  return assets.cards.find((c) => c.member === member && c.rarity === "A")!;
}
