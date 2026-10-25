// Local preparation only. Never stages or publishes supplied photos/audio.
import { cpSync, mkdirSync, rmSync } from "node:fs";
mkdirSync("public/assets", { recursive: true });
for (const kind of ["photos", "audio"])
  cpSync(`assets/${kind}`, `public/assets/${kind}`, { recursive: true });
const selected = [
  ...[
    "home",
    "play",
    "cards",
    "gacha",
    "chat",
    "settings",
    "gp",
    "heart",
    "next",
    "back",
    "check",
    "close",
    "rotate",
    "wallpaper",
    "gift",
    "help",
    "volume",
    "music",
    "download",
    "upload",
    "save",
    "reset",
    "lock",
  ].map((n) => `icons/${n}.svg`),
  ...["a", "b", "c", "s"].flatMap((r) => [
    `cards/frame-${r}.png`,
    `result/rank-${r}-emblem.png`,
  ]),
  "cards/unowned-card.png",
  "effects/edge-aurora.png",
  "title/title-halo.svg",
  "gacha/stage-orbit.svg",
  "gacha/card-back.png",
  "gacha/reveal-s-ring.png",
  "gacha/reveal-a.png",
  "gacha/reveal-normal.png",
];
rmSync("public/assets/ui", { recursive: true, force: true });
for (const path of selected) {
  mkdirSync(`public/assets/ui/${path.split("/")[0]}`, { recursive: true });
  cpSync(
    `reference/ui-kit/mrs-green-apple-ui-kit/assets/ui/${path}`,
    `public/assets/ui/${path}`,
  );
}
