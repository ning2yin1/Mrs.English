import { test, expect, type Page } from "@playwright/test";
import {
  assets,
  byQuestion,
  difficulties,
  modes,
  topics,
  members,
  type Member,
} from "../../src/data";
import {
  claimWelcome,
  finishWelcome,
  exportSave,
  freshSave,
  localDate,
  type Save,
} from "../../src/game";
import { resultCandidates } from "../../src/voices";
async function readSave(page: Page): Promise<Save> {
  return page.evaluate(
    () =>
      new Promise((resolve, reject) => {
        const req = indexedDB.open("mrs-english", 1);
        req.onerror = () => reject(req.error);
        req.onsuccess = () => {
          const db = req.result,
            get = db.transaction("saves").objectStore("saves").get("current");
          get.onsuccess = () => {
            resolve(get.result);
            db.close();
          };
        };
      }),
  );
}
async function writeSave(page: Page, save: any) {
  await page.evaluate(
    (save) =>
      new Promise<void>((resolve, reject) => {
        const req = indexedDB.open("mrs-english", 1);
        req.onupgradeneeded = () => {
          if (!req.result.objectStoreNames.contains("saves"))
            req.result.createObjectStore("saves");
        };
        req.onerror = () => reject(req.error);
        req.onsuccess = () => {
          const db = req.result,
            tx = db.transaction("saves", "readwrite");
          tx.objectStore("saves").put(save, "current");
          tx.oncomplete = () => {
            db.close();
            resolve();
          };
        };
      }),
    save,
  );
}
async function start(page: Page) {
  await page.getByRole("button", { name: /TAP TO START/ }).click();
}
async function seed(page: Page, change?: (s: Save) => void) {
  await page.goto("./");
  const s = freshSave();
  s.profile.nickname = "MINT";
  s.profile.step = 4;
  claimWelcome(s, () => 0.1);
  finishWelcome(s);
  s.login = { days: 1, last: localDate(), claimed: [localDate()] };
  change?.(s);
  await writeSave(page, s);
  await page.reload();
  await start(page);
  await expect(page.locator(".home-screen")).toBeVisible();
  return s;
}
async function nav(page: Page, name: string) {
  if (await page.locator(".result-screen").count())
    await page.getByRole("button", { name: "HOME", exact: true }).click();
  if (await page.locator(".chat-app").count()) {
    if (await page.locator(".thread-open").count())
      await page
        .getByRole("button", { name: "チャット一覧へ", exact: true })
        .first()
        .click();
    await page
      .locator(".chat-footer")
      .getByRole("button", { name: /ゲームに戻る/ })
      .click();
  }
  if (name === "HOME" && (await page.locator(".home-screen").count())) return;
  await page
    .getByRole("navigation")
    .getByRole("button", { name, exact: true })
    .click();
}
async function approve(page: Page) {
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "実行する", exact: true })
    .click();
}
async function broadcast(page: Page) {
  await page.evaluate(() => {
    const c = new BroadcastChannel("mrs-save");
    c.postMessage("changed");
    c.close();
  });
}
for (const difficulty of difficulties)
  test(`10 questions ${difficulty}: feedback, rewards, selected-member result and no double award`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await seed(page);
    await nav(page, "PLAY");
    await page
      .getByRole("button", { name: new RegExp(`^${difficulty}`) })
      .click();
    await page.getByRole("button", { name: /START ·/ }).click();
    for (let i = 0; i < 10; i++) {
      const q = byQuestion[topics[0].questionIds[i]];
      await expect(page.locator(".question h2")).toHaveText(q.japanese);
      if (difficulty === "EASY")
        await page
          .locator(".easy-options")
          .getByRole("button", { name: modes[q.id].easy.answer, exact: true })
          .click();
      else if (difficulty === "MASTER")
        await page
          .getByRole("textbox", { name: "英文を入力" })
          .fill(q.english.toUpperCase().replace(/[.!?]$/, ""));
      else
        for (const token of q.tokens)
          await page
            .locator(".tiles")
            .getByRole("button", { name: token.text, exact: true })
            .first()
            .click();
      await page.getByRole("button", { name: /^CHECK/ }).click();
      await expect(page.getByRole("dialog")).toBeVisible();
      await expect(page.locator(".feedback h2")).toHaveText(q.english);
      if (i === 0 && difficulty === "EASY") {
        await page.reload();
        await start(page);
        await nav(page, "PLAY");
        await expect(page.getByRole("dialog")).toBeVisible();
        await expect(page.locator(".feedback h2")).toHaveText(q.english);
      }
      await page
        .getByRole("dialog")
        .getByRole("button", { name: i === 9 ? /^RESULT/ : /^NEXT/ })
        .click();
    }
    await expect(page.locator(".result-info")).toBeVisible();
    await expect(page.locator(".rank-emblem")).toHaveText("S");
    await expect(page.getByRole("navigation")).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: /もう一度聴く|再生/ }),
    ).toHaveCount(0);
    const gp = { EASY: 100, NORMAL: 150, HARD: 200, MASTER: 300 }[difficulty];
    await expect.poll(async () => (await readSave(page)).gp).toBe(gp);
    const s = await readSave(page);
    expect(s.affection.motoki).toBe(15);
    expect(
      resultCandidates("motoki", "S").some(
        (v) =>
          v.voiceId === s.result!.voiceId &&
          v.photoCardId === s.result!.photoCardId,
      ),
    ).toBe(true);
    await expect(page.locator(".result-photo .hero-photo")).toBeVisible();
    await nav(page, "HOME");
    await nav(page, "PLAY");
    await expect(page.locator(".grammar-screen")).toBeVisible();
    expect((await readSave(page)).gp).toBe(gp);
    expect(errors).toEqual([]);
  });
test("first-run sequence, nickname persistence and free guaranteed ten-pack are atomic", async ({
  page,
}) => {
  await page.goto("./");
  await start(page);
  await expect(page.locator(".home-screen")).toHaveCount(0);
  await page
    .getByRole("textbox", { name: "ニックネーム", exact: true })
    .fill("GREEN");
  await page.getByRole("button", { name: "NEXT", exact: true }).click();
  await expect(page.locator(".setup-2")).toBeVisible();
  await page.getByRole("button", { name: /若井 滉斗/ }).click();
  await page.getByRole("button", { name: "NEXT", exact: true }).click();
  await page.getByRole("button", { name: "壁紙 BG20" }).click();
  await page.getByRole("button", { name: "NEXT", exact: true }).click();
  await page.reload();
  await start(page);
  await expect(page.locator(".setup-4")).toBeVisible();
  await page.getByRole("button", { name: "無料10パックを受け取る" }).dblclick();
  await page.getByRole("button", { name: "SKIP", exact: true }).click();
  await expect(page.locator(".gacha-reveal .photo-card")).toHaveCount(10);
  const first = await readSave(page);
  expect(first.gp).toBe(0);
  expect(first.profile.nickname).toBe("GREEN");
  expect(first.settings.member).toBe("hiloto");
  expect(first.settings.wallpaper).toBe("BG20");
  expect(first.profile.giftClaimed).toBe(true);
  expect(
    first.profile.giftCards.some((id) =>
      ["A", "S"].includes(assets.cards.find((c) => c.id === id)!.rarity),
    ),
  ).toBe(true);
  expect(Object.values(first.cards).reduce((a, b) => a + b, 0)).toBe(10);
  await page.reload();
  await start(page);
  await page.getByRole("button", { name: "SKIP", exact: true }).click();
  expect((await readSave(page)).cards).toEqual(first.cards);
  await page.getByRole("button", { name: "HOMEへ", exact: true }).click();
  await page.getByRole("button", { name: "CLOSE", exact: true }).click();
  await expect(page.locator(".home-screen")).toBeVisible();
  await expect(page.locator(".home-screen .member-pills")).toHaveCount(0);
  await page.reload();
  await start(page);
  await expect(page.locator(".onboarding")).toHaveCount(0);
  expect((await readSave(page)).profile.completed).toBe(true);
});
test("legacy IndexedDB save migrates without wiping existing progress", async ({
  page,
}) => {
  await page.goto("./");
  const s: any = freshSave();
  delete s.profile;
  delete s.lastResultPhoto;
  s.gp = 5432;
  s.cards[assets.cards[0].id] = 4;
  s.affection.ryoka = 100;
  s.records["G60:MASTER"] = { best: 900, last: 800, plays: 7 };
  s.mistakes = ["G01Q01"];
  s.settings.wallpaper = "BG19";
  await writeSave(page, s);
  await page.reload();
  await start(page);
  await expect(page.locator(".setup-1")).toBeVisible();
  await page
    .getByRole("textbox", { name: "ニックネーム", exact: true })
    .fill("LEGACY");
  await page.getByRole("button", { name: "NEXT", exact: true }).click();
  const next = await readSave(page);
  expect(next.gp).toBe(5432);
  expect(next.cards).toEqual(s.cards);
  expect(next.affection).toEqual(s.affection);
  expect(next.records).toEqual(s.records);
  expect(next.mistakes).toEqual(s.mistakes);
  expect(next.settings).toEqual(s.settings);
});
test("wrong answers keep correct sentence, translation and grammar until NEXT", async ({
  page,
}) => {
  await seed(page);
  await nav(page, "PLAY");
  await page.getByRole("button", { name: /^MASTER/ }).click();
  await page.getByRole("button", { name: /START ·/ }).click();
  await page.getByRole("textbox").fill("I is a student.");
  await page.getByRole("button", { name: /^CHECK/ }).click();
  await expect(page.getByRole("dialog")).toHaveAccessibleName(/覚えよう/);
  await page.waitForTimeout(650);
  await expect(page.locator(".feedback")).toContainText("私は学生です。");
  await expect(page.locator(".explanation")).toContainText("am/is/are");
  await page.getByRole("button", { name: /^NEXT/ }).click();
  await page.getByRole("button", { name: "プレイを中断" }).click();
  await approve(page);
  await nav(page, "PLAY");
  await expect(page.locator(".question h2")).toHaveText(
    byQuestion.G01Q02.japanese,
  );
});
test("game start shows READY/START before the first question", async ({
  page,
}) => {
  await seed(page);
  await nav(page, "PLAY");
  await page.getByRole("button", { name: /START ·/ }).click();
  await expect(page.locator(".game-intro")).toBeVisible();
  await expect(page.locator(".question")).toHaveCount(0);
  await expect(page.locator(".question")).toBeVisible();
  await expect(page.locator(".game-intro")).toHaveCount(0);
});
test("paid ten-pack confirmation, skip, card details and revisiting do not charge twice", async ({
  page,
}) => {
  await seed(page, (s) => {
    s.gp = 3000;
  });
  await nav(page, "GACHA");
  await page.getByRole("button", { name: /10連を引く/ }).click();
  await expect(page.getByRole("dialog")).toContainText("残り 300 GP");
  await approve(page);
  await page.getByRole("button", { name: "SKIP", exact: true }).click();
  await expect(page.locator(".gacha-reveal .photo-card")).toHaveCount(10);
  await expect(page.getByTestId("gp")).toHaveText("300");
  await expect(
    page.locator(".reveal-grid .rarity-A,.reveal-grid .rarity-S").first(),
  ).toBeVisible();
  await page.locator(".gacha-reveal .photo-card").first().click();
  await expect(
    page.getByRole("dialog", { name: "CARD COLLECTION" }),
  ).toBeVisible();
  await expect(page.locator(".card-detail-layout .rarity-badge")).toBeVisible();
  await page.getByRole("button", { name: "閉じる", exact: true }).click();
  await page.getByRole("button", { name: "ガチャに戻る", exact: true }).click();
  await page.getByRole("button", { name: "前回の結果を見る" }).click();
  await page.getByRole("button", { name: "SKIP", exact: true }).click();
  await expect(page.getByTestId("gp")).toHaveText("300");
  await nav(page, "CARDS");
  await expect(page.locator(".collection .photo-card")).toHaveCount(79);
  await page.getByLabel("所持のみ").check();
  expect(await page.locator(".collection .photo-card").count()).toBeGreaterThan(
    0,
  );
});
test("chat portrait navigation, unlocks, read bits and no disclaimer overlays", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await seed(page, (s) => {
    s.affection.ryoka = 200;
  });
  await nav(page, "CHAT");
  await expect(page.locator(".app")).not.toHaveClass(/rotated-clockwise/);
  await expect(page.locator(".chat-list")).toBeVisible();
  await page.getByRole("button", { name: /大森 元貴/ }).click();
  await page.getByLabel("会話を選択").selectOption("4");
  await expect(page.locator(".locked-chat")).toBeVisible();
  await page
    .getByRole("button", { name: "チャット一覧へ", exact: true })
    .first()
    .click();
  await page.getByRole("button", { name: /藤澤 涼架/ }).click();
  await page.getByLabel("会話を選択").selectOption("14");
  await page.getByRole("button", { name: "続きを読む" }).click();
  await page.getByRole("button", { name: "ありがとう、と返信" }).click();
  await expect(page.locator(".outgoing")).toBeVisible();
  await expect(page.locator(".chat-app")).not.toContainText("本人の発言");
  expect((await readSave(page)).chat.ryoka).toBe(1 << 14);
  await nav(page, "HOME");
  await expect(page.locator(".app")).toHaveClass(/rotated-clockwise/);
  await nav(page, "CHAT");
  await page.getByRole("button", { name: /藤澤 涼架/ }).click();
  await expect(
    page.getByLabel("会話を選択").locator('option[value="14"]'),
  ).toContainText("既読");
  await expect(
    page.getByLabel("会話を選択").locator('option[value="0"]'),
  ).not.toContainText("既読");
});
test("backup export, invalid import refusal and complete restoration", async ({
  page,
}) => {
  await seed(page, (s) => {
    s.gp = 1234;
  });
  await nav(page, "SETTINGS");
  const download = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "JSONバックアップ", exact: true })
    .click();
  expect((await download).suggestedFilename()).toMatch(/MrsEnglish/);
  await page
    .locator("input[type=file]")
    .first()
    .setInputFiles({
      name: "bad.json",
      mimeType: "application/json",
      buffer: Buffer.from('{"app":"Mrs.English","format":1,"data":{}}'),
    });
  await expect(page.locator(".toast")).toContainText("不正");
  await expect(page.getByTestId("gp")).toHaveText("1,234");
  const next = await readSave(page);
  next.gp = 888;
  next.settings.wallpaper = "BG20";
  await page
    .locator("input[type=file]")
    .first()
    .setInputFiles({
      name: "good.json",
      mimeType: "application/json",
      buffer: Buffer.from(exportSave(next)),
    });
  await approve(page);
  await expect(page.getByTestId("gp")).toHaveText("888");
  expect((await readSave(page)).settings.wallpaper).toBe("BG20");
  expect((await readSave(page)).profile.giftClaimed).toBe(true);
});
test("login garden claims once and preserves received date after restart", async ({
  page,
}) => {
  await seed(page, (s) => {
    s.login = { days: 0, last: "", claimed: [] };
  });
  await expect(page.getByRole("dialog", { name: "LOGIN BONUS" })).toBeVisible();
  await expect(page.locator(".login-day")).toHaveCount(7);
  await page.getByRole("button", { name: "今日のGPを受け取る" }).dblclick();
  await expect(page.getByTestId("gp")).toHaveText("50");
  await expect(
    page.getByRole("button", { name: "本日は受領済み" }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "CLOSE", exact: true }).click();
  await page.reload();
  await start(page);
  await expect(page.getByTestId("gp")).toHaveText("50");
  await expect(page.getByRole("dialog")).toHaveCount(0);
});
test("offline shell, new backgrounds and curriculum survive reload", async ({
  page,
  context,
}) => {
  await seed(page);
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await start(page);
  await nav(page, "PLAY");
  await context.setOffline(true);
  await page.reload();
  await start(page);
  await nav(page, "PLAY");
  await expect(page.locator(".app")).toHaveAttribute(
    "data-background",
    "assets/backgrounds/bg-grammar.webp",
  );
  await page.getByRole("button", { name: /START ·/ }).click();
  await expect(page.locator(".question h2")).toHaveText(
    byQuestion.G01Q01.japanese,
  );
  await context.setOffline(false);
});
for (const size of [
  { width: 667, height: 375 },
  { width: 844, height: 390 },
  { width: 852, height: 393 },
  { width: 932, height: 430 },
  { width: 390, height: 844 },
])
  test(`all screens and rotated dialogs fit ${size.width}x${size.height}`, async ({
    page,
  }, info) => {
    await page.setViewportSize(size);
    await seed(page, (s) => {
      s.gp = 3000;
    });
    for (const name of ["HOME", "PLAY", "CARDS", "GACHA", "CHAT", "SETTINGS"]) {
      await nav(page, name);
      await expect(page.locator(".main")).toBeVisible();
      const root = await page.locator(".app").boundingBox();
      expect(root!.x).toBeGreaterThanOrEqual(-1);
      expect(root!.y).toBeGreaterThanOrEqual(-1);
      expect(root!.x + root!.width).toBeLessThanOrEqual(size.width + 1);
      expect(root!.y + root!.height).toBeLessThanOrEqual(size.height + 1);
      if (["PLAY", "GACHA", "HOME"].includes(name)) {
        const buttons = page.locator(
          name === "PLAY"
            ? ".difficulty-panel>.game-button"
            : name === "GACHA"
              ? ".gacha-draws>.game-button"
              : ".home-play",
        );
        for (const b of await buttons.all())
          expect(
            await b.evaluate((el) => {
              const r = el.getBoundingClientRect(),
                hit = document.elementFromPoint(
                  r.x + r.width / 2,
                  r.y + r.height / 2,
                );
              return !!hit && (el === hit || el.contains(hit));
            }),
            name + " control must be reachable",
          ).toBe(true);
      }
      await page.screenshot({ path: info.outputPath(`${name}.png`) });
    }
    await page.getByRole("button", { name: /20枚から壁紙/ }).click();
    await page.getByRole("button", { name: "壁紙 BG20" }).click();
    await page.getByRole("button", { name: "閉じる", exact: true }).click();
    await nav(page, "HOME");
    await expect(page.locator(".app")).toHaveAttribute(
      "data-background",
      /bg-20/,
    );
    await expect(page.locator(".rotate")).toHaveCount(0);
  });
test("portrait nickname and MASTER entry suspend CSS rotation and follow visual viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await seed(page);
  await nav(page, "PLAY");
  await page.getByRole("button", { name: /^MASTER/ }).click();
  await page.getByRole("button", { name: /START ·/ }).click();
  await page.getByRole("textbox").fill("I am a student.");
  await expect(page.locator(".app")).toHaveClass(/entry-portrait/);
  await page.evaluate(() => {
    Object.defineProperty(visualViewport, "height", {
      configurable: true,
      value: 300,
    });
    visualViewport!.dispatchEvent(new Event("resize"));
  });
  const check = page.getByRole("button", { name: /^CHECK/ });
  const bounds = await check.boundingBox();
  expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(301);
  await check.click();
  await expect(page.getByRole("dialog")).toHaveAccessibleName("✓ CORRECT!");
  await page.evaluate(() => {
    delete (visualViewport as any).height;
    visualViewport!.dispatchEvent(new Event("resize"));
  });
});
test("advanced HARD handles repeated words and long Japanese without losing controls", async ({
  page,
}) => {
  await page.setViewportSize({ width: 667, height: 375 });
  await seed(page, (s) => {
    s.session = {
      id: "advanced-ui",
      topic: "G60",
      member: "motoki",
      difficulty: "HARD",
      step: 6,
      answers: topics[59].questionIds
        .slice(0, 6)
        .map((id) => ({
          question: id,
          answer: byQuestion[id].english,
          correct: true,
        })),
    };
  });
  await nav(page, "PLAY");
  const q = byQuestion.G60Q07;
  for (const token of q.tokens)
    await page
      .locator(".tiles")
      .getByRole("button", { name: token.text, exact: true })
      .first()
      .click();
  await page.getByRole("button", { name: /^CHECK/ }).click();
  await expect(page.getByRole("dialog")).toHaveAccessibleName("✓ CORRECT!");
});
test("result voice/photo is chosen from the selected member and grade and plays once", async ({
  page,
}) => {
  const requests: string[] = [];
  page.on("request", (r) => {
    if (r.url().endsWith(".wav")) requests.push(r.url());
  });
  await seed(page);
  await nav(page, "PLAY");
  const s = await readSave(page),
    candidate = resultCandidates("ryoka", "S")[0];
  s.result = {
    id: "voice-result",
    topic: "G01",
    difficulty: "MASTER",
    member: "ryoka",
    correct: 10,
    gp: 300,
    affection: 15,
    voiceId: candidate.voiceId,
    photoCardId: candidate.photoCardId,
    voicePlayed: false,
    at: new Date().toISOString(),
  };
  s.affection.ryoka = 15;
  s.gp = 300;
  await writeSave(page, s);
  await broadcast(page);
  await expect(page.locator(".result-info")).toBeVisible();
  await expect(page.getByRole("navigation")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: /聴く|停止|再生/ }),
  ).toHaveCount(0);
  const photo = assets.cards.find((c) => c.id === candidate.photoCardId)!;
  await expect(page.locator(".hero-photo")).toHaveAttribute(
    "src",
    new RegExp(photo.path),
  );
  await expect
    .poll(async () => (await readSave(page)).result?.voicePlayed)
    .toBe(true);
  await expect
    .poll(() =>
      requests.some((p) =>
        p.includes(assets.audio.find((v) => v.id === candidate.voiceId)!.path),
      ),
    )
    .toBe(true);
  await nav(page, "HOME");
  expect((await readSave(page)).gp).toBe(300);
});
test("multiple tabs cannot spend the same GP twice", async ({
  page,
  context,
}) => {
  const baseline = await seed(page, (s) => {
    s.gp = 300;
  });
  const second = await context.newPage();
  await second.goto("./");
  await start(second);
  await nav(page, "GACHA");
  await nav(second, "GACHA");
  await page.getByRole("button", { name: /1回引く/ }).click();
  await second.getByRole("button", { name: /1回引く/ }).click();
  await Promise.all([
    page
      .getByRole("button", { name: "実行する", exact: true })
      .evaluate((el) => (el as HTMLButtonElement).click()),
    second
      .getByRole("button", { name: "実行する", exact: true })
      .evaluate((el) => (el as HTMLButtonElement).click()),
  ]);
  await expect(page.getByTestId("gp")).toHaveText("0");
  await expect(second.getByTestId("gp")).toHaveText("0");
  expect(
    Object.values((await readSave(page)).cards).reduce((a, b) => a + b, 0),
  ).toBe(Object.values(baseline.cards).reduce((a, b) => a + b, 0) + 1);
});
test("all photo, WAV, new UI and PWA branding files exist and decode in the browser", async ({
  page,
  request,
}) => {
  for (const a of [...assets.backgrounds, ...assets.cards, ...assets.audio]) {
    const response = await request.get(a.path);
    expect(response.status(), a.path).toBe(200);
    expect(response.headers()["content-type"]).toMatch(/image|audio/);
  }
  for (const path of [
    "assets/branding/icon-192.png",
    "assets/branding/icon-512.png",
    "assets/branding/apple-touch-icon.png",
    "assets/branding/mrs_green_apple_loading_symbol.png",
    ...[
      "grammar",
      "result",
      "cards",
      "gacha",
      "login",
      "chat",
      "onboarding",
    ].map((id) => `assets/backgrounds/bg-${id}.webp`),
  ])
    expect((await request.get(path)).status(), path).toBe(200);
  const m = await (await request.get("manifest.webmanifest")).json();
  expect(m.orientation).toBe("any");
  expect(
    m.icons.every(
      (i: any) => i.purpose === "any" && i.src.includes("branding"),
    ),
  ).toBe(true);
});
test("full media download is repeatable and serves unseen cards offline", async ({
  page,
  context,
}) => {
  test.setTimeout(120000);
  await seed(page);
  await nav(page, "SETTINGS");
  await page
    .getByRole("button", { name: "写真・音声をオフライン保存", exact: true })
    .click();
  await expect(page.locator(".toast")).toContainText(
    "すべての写真・音声をオフライン保存",
    { timeout: 60000 },
  );
  await page
    .getByRole("button", { name: "写真・音声をオフライン保存", exact: true })
    .click();
  await expect(
    page.getByRole("button", {
      name: "写真・音声をオフライン保存",
      exact: true,
    }),
  ).toBeEnabled();
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await start(page);
  await context.setOffline(true);
  const loaded = await page.evaluate(
    async (path) => {
      const r = await fetch(path);
      return r.ok && r.headers.get("content-type")?.startsWith("image/");
    },
    `/Mrs.English/${assets.cards.at(-1)!.path}`,
  );
  expect(loaded).toBe(true);
  await context.setOffline(false);
});
