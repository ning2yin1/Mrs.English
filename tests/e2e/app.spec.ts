import { test, expect, type Page } from "@playwright/test";
import {
  assets,
  byQuestion,
  difficulties,
  modes,
  topics,
  type Difficulty,
} from "../../src/data";
import { exportSave, freshSave, localDate, type Save } from "../../src/game";
async function seed(page: Page, change?: (s: Save) => void) {
  await page.goto("./");
  const s = freshSave();
  s.login = { days: 1, last: localDate(), claimed: [localDate()] };
  change?.(s);
  await page.evaluate(async (s) => {
    await new Promise<void>((resolve, reject) => {
      const req = indexedDB.open("mrs-english", 1);
      req.onupgradeneeded = () => {
        if (!req.result.objectStoreNames.contains("saves"))
          req.result.createObjectStore("saves");
      };
      req.onerror = () => reject(req.error);
      req.onsuccess = () => {
        const db = req.result,
          tx = db.transaction("saves", "readwrite");
        tx.objectStore("saves").put(s, "current");
        tx.oncomplete = () => {
          db.close();
          resolve();
        };
      };
    });
  }, s);
  await page.reload();
  await page.getByRole("button", { name: /TAP TO START/ }).click();
  await expect(page.getByRole("navigation")).toBeVisible();
}
async function nav(page: Page, name: string) {
  await page
    .getByRole("navigation")
    .getByRole("button", { name, exact: true })
    .click();
}
for (const difficulty of difficulties)
  test(`10 questions ${difficulty}, feedback persistence, result, rewards and retry`, async ({
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
    const qlist = topics[0].questionIds.map((id) => byQuestion[id]);
    for (let i = 0; i < 10; i++) {
      const q = qlist[i];
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
        await page.getByRole("button", { name: /TAP TO START/ }).click();
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
    await expect(page.getByTestId("gp")).toHaveText(
      String({ EASY: 100, NORMAL: 150, HARD: 200, MASTER: 300 }[difficulty]),
    );
    await expect(
      page.locator(".result-photo img.card-photo,.result-photo .group-photo"),
    ).toBeVisible();
    await nav(page, "HOME");
    await nav(page, "PLAY");
    await expect(page.locator(".grammar-screen")).toBeVisible();
    await expect(page.getByTestId("gp")).toHaveText(
      String({ EASY: 100, NORMAL: 150, HARD: 200, MASTER: 300 }[difficulty]),
    );
    expect(errors).toEqual([]);
  });
test("wrong answer explanation remains, token duplicates, advanced long answers", async ({
  page,
}) => {
  await seed(page);
  await nav(page, "PLAY");
  await page.getByRole("button", { name: /^MASTER/ }).click();
  await page.getByRole("button", { name: /START ·/ }).click();
  await page.getByRole("textbox").fill("I is a student.");
  await page.getByRole("button", { name: /CHECK/ }).click();
  await expect(page.getByRole("dialog")).toHaveAccessibleName(/覚えよう/);
  await page.waitForTimeout(900);
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.locator(".explanation")).toContainText("am/is/are");
  await page.getByRole("button", { name: /^NEXT/ }).click();
  await page.getByRole("button", { name: "プレイを中断" }).click();
  await page.getByRole("button", { name: "実行する" }).click();
  await nav(page, "PLAY");
  await expect(page.locator(".question h2")).toHaveText(
    byQuestion.G01Q02.japanese,
  );
});
test("10 draw guaranteed, skip, detail, cards and no repeat charge", async ({
  page,
}) => {
  await seed(page, (s) => {
    s.gp = 3000;
  });
  await nav(page, "GACHA");
  await page.getByRole("button", { name: /10連を引く/ }).click();
  await page.getByRole("button", { name: "SKIP", exact: true }).click();
  await expect(page.locator(".gacha-reveal .card")).toHaveCount(10);
  await expect(page.getByTestId("gp")).toHaveText("300");
  await expect(
    page.locator(".gacha-reveal .rarity-A,.gacha-reveal .rarity-S").first(),
  ).toBeVisible();
  await page.locator(".gacha-reveal .card").first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "閉じる", exact: true }).click();
  await page.getByRole("button", { name: "ガチャに戻る" }).click();
  await page.getByRole("button", { name: "前回の結果を見る" }).click();
  await page.getByRole("button", { name: "SKIP" }).click();
  await expect(page.getByTestId("gp")).toHaveText("300");
  await nav(page, "CARDS");
  await expect(page.locator(".collection .card")).toHaveCount(
    assets.cards.length,
  );
  await page.getByLabel("所持のみ").check();
  expect(await page.locator(".collection .card").count()).toBeGreaterThan(0);
});
test("chat unlock, read persistence and independent affection", async ({
  page,
}) => {
  await seed(page, (s) => {
    s.affection.ryoka = 200;
  });
  await nav(page, "CHAT");
  await page.getByRole("button", { name: /新しい景色/ }).click();
  await expect(page.locator(".locked-chat")).toBeVisible();
  await page
    .locator(".chat-members")
    .getByRole("button", { name: /RYOKA/ })
    .click();
  await page.getByRole("button", { name: /これからも/ }).click();
  await page.getByRole("button", { name: "続きを読む" }).click();
  await page.getByRole("button", { name: /ありがとう、と返信/ }).click();
  await expect(page.locator(".outgoing")).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: /TAP TO START/ }).click();
  await nav(page, "CHAT");
  await page
    .locator(".chat-members")
    .getByRole("button", { name: /RYOKA/ })
    .click();
  await expect(page.getByRole("button", { name: /これからも/ })).toContainText(
    "既読",
  );
  await expect(
    page.getByRole("button", { name: /はじめの一歩/ }),
  ).toContainText("会話する");
});
test("backup export/import, corrupt input protection, wallpaper persistence", async ({
  page,
}) => {
  await seed(page, (s) => {
    s.gp = 1234;
    s.cards[assets.cards[0].id] = 2;
  });
  await nav(page, "SETTINGS");
  const dl = page.waitForEvent("download");
  await page.getByRole("button", { name: "JSONバックアップ" }).click();
  expect((await dl).suggestedFilename()).toMatch(/MrsEnglish/);
  await page.getByRole("button", { name: /20枚から/ }).click();
  await page.getByRole("button", { name: "壁紙 BG20" }).click();
  await page.getByRole("button", { name: "閉じる", exact: true }).click();
  await page.reload();
  await page.getByRole("button", { name: /TAP TO START/ }).click();
  expect(await page.locator(".app").getAttribute("style")).toContain("bg-20");
  await nav(page, "SETTINGS");
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
  const next = freshSave();
  next.gp = 888;
  next.login = { days: 1, last: localDate(), claimed: [localDate()] };
  await page
    .locator("input[type=file]")
    .first()
    .setInputFiles({
      name: "good.json",
      mimeType: "application/json",
      buffer: Buffer.from(exportSave(next)),
    });
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "実行する" }).click();
  await expect(page.getByTestId("gp")).toHaveText("888");
});
test("login reward is claimed once and survives reload", async ({ page }) => {
  await seed(page, (s) => {
    s.login = { days: 0, last: "", claimed: [] };
  });
  await expect(page.getByRole("dialog", { name: "DAILY GIFT" })).toBeVisible();
  await page.getByRole("button", { name: "今日のGPを受け取る" }).dblclick();
  await expect(page.getByTestId("gp")).toHaveText("50");
  await expect(
    page.getByRole("button", { name: "本日は受領済み" }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "CLOSE", exact: true }).click();
  await page.reload();
  await page.getByRole("button", { name: /TAP TO START/ }).click();
  await expect(page.getByTestId("gp")).toHaveText("50");
  await expect(page.getByRole("dialog")).toHaveCount(0);
});
test("offline shell and curriculum work after reload", async ({
  page,
  context,
  browserName,
}) => {
  await seed(page);
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await page.getByRole("button", { name: /TAP TO START/ }).click();
  await nav(page, "PLAY");
  await context.setOffline(true);
  await page.reload();
  await page.getByRole("button", { name: /TAP TO START/ }).click();
  await nav(page, "PLAY");
  await page.getByRole("button", { name: /START ·/ }).click();
  await expect(page.locator(".question h2")).toHaveText(
    byQuestion.G01Q01.japanese,
  );
  await expect(page.locator(".connection")).toHaveText("OFFLINE");
  await context.setOffline(false);
});
for (const size of [
  { width: 667, height: 375 },
  { width: 844, height: 390 },
  { width: 852, height: 393 },
  { width: 932, height: 430 },
])
  test(`six tabs fit ${size.width}x${size.height} without body scrolling`, async ({
    page,
  }) => {
    await page.setViewportSize(size);
    await seed(page, (s) => {
      s.gp = 3000;
    });
    for (const name of ["HOME", "PLAY", "CARDS", "GACHA", "CHAT", "SETTINGS"]) {
      await nav(page, name);
      await expect(page.locator(".main")).toBeVisible();
      if (["PLAY", "GACHA", "HOME"].includes(name)) {
        const targets = page.locator(
          name === "PLAY"
            ? ".difficulty-panel > .button"
            : name === "GACHA"
              ? ".gacha-controls > .button"
              : ".lesson > .button",
        );
        for (const button of await targets.all())
          expect(
            await button.evaluate((el) => {
              const r = el.getBoundingClientRect(),
                hit = document.elementFromPoint(
                  r.x + r.width / 2,
                  r.y + r.height / 2,
                );
              return !!hit && (el === hit || el.contains(hit));
            }),
            name + " primary action must be reachable",
          ).toBe(true);
      }
      const layout = await page.evaluate(() => ({
        w: innerWidth,
        h: innerHeight,
        sw: document.documentElement.scrollWidth,
        sh: document.documentElement.scrollHeight,
      }));
      expect(layout.sw).toBeLessThanOrEqual(layout.w);
      expect(layout.sh).toBeLessThanOrEqual(layout.h);
      const box = await page.getByRole("navigation").boundingBox();
      expect(box!.y + box!.height).toBeLessThanOrEqual(size.height);
      await page.screenshot({
        path: `test-results/layout-${size.width}-${name.toLowerCase()}.png`,
      });
    }
  });
test("all supplied images and audio return 200 with correct media types", async ({
  request,
}) => {
  for (const a of [...assets.backgrounds, ...assets.cards, ...assets.audio]) {
    const r = await request.get(a.path);
    expect(r.status(), a.path).toBe(200);
    expect(r.headers()["content-type"], a.path).toMatch(/image|audio/);
  }
});

test("advanced HARD repeated words, long sentence, input keyboard adaptation and portrait guide", async ({
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
      answers: topics[59].questionIds.slice(0, 6).map((id) => ({
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
  await page.getByRole("button", { name: /CHECK/ }).click();
  await expect(page.getByRole("dialog")).toHaveAccessibleName("✓ CORRECT!");
  await page.screenshot({ path: "test-results/advanced-hard-667.png" });
  await page.getByRole("button", { name: /^NEXT/ }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator(".rotate")).toBeVisible();
});
test("result voice and photo pairing, replay and navigation stop", async ({
  page,
}) => {
  const voice = assets.audio.find((v) => v.member === "ryoka")!;
  await seed(page, (s) => {
    s.result = {
      id: "result-ui",
      topic: "G01",
      difficulty: "MASTER",
      member: "motoki",
      correct: 8,
      gp: 240,
      affection: 8,
      voiceId: voice.id,
      at: new Date().toISOString(),
    };
    s.records["G01:MASTER"] = { best: 800, last: 800, plays: 1 };
    s.gp = 240;
    s.affection.motoki = 8;
  });
  // Opening PLAY normally returns to chapter selection; seed a result while already on PLAY.
  await nav(page, "PLAY");
  await page.evaluate(
    async (r) => {
      const req = indexedDB.open("mrs-english", 1);
      await new Promise<void>((resolve) => {
        req.onsuccess = () => {
          const db = req.result,
            tx = db.transaction("saves", "readwrite"),
            store = tx.objectStore("saves"),
            get = store.get("current");
          get.onsuccess = () => {
            const s = get.result;
            s.result = r;
            store.put(s, "current");
          };
          tx.oncomplete = () => {
            db.close();
            resolve();
          };
        };
      });
      const c = new BroadcastChannel("mrs-save");
      c.postMessage("changed");
      c.close();
    },
    {
      id: "result-ui",
      topic: "G01",
      difficulty: "MASTER",
      member: "motoki",
      correct: 8,
      gp: 240,
      affection: 8,
      voiceId: voice.id,
      at: new Date().toISOString(),
    },
  );
  await expect(page.locator(".result-info")).toBeVisible();
  await expect(page.locator(".rank-emblem")).toHaveText("A");
  const photo = assets.cards.find((c) => c.id === voice.resultPhotoCardId)!;
  await expect(page.locator(".result-photo .card-photo")).toHaveAttribute(
    "src",
    new RegExp(photo.path),
  );
  await page
    .getByRole("button", { name: /もう一度聴く|タップして音声/ })
    .click();
  await page.getByRole("button", { name: "停止", exact: true }).click();
  await page.screenshot({ path: "test-results/result-844.png" });
  await nav(page, "HOME");
});

test("multiple tabs cannot spend the same GP twice", async ({
  page,
  context,
}) => {
  await seed(page, (s) => {
    s.gp = 300;
  });
  const second = await context.newPage();
  await second.goto("./");
  await second.getByRole("button", { name: /TAP TO START/ }).click();
  await nav(page, "GACHA");
  await nav(second, "GACHA");
  await Promise.all([
    page
      .getByRole("button", { name: /1回引く/ })
      .evaluate((el) => (el as HTMLButtonElement).click()),
    second
      .getByRole("button", { name: /1回引く/ })
      .evaluate((el) => (el as HTMLButtonElement).click()),
  ]);
  await expect(page.getByTestId("gp")).toHaveText("0");
  await expect(second.getByTestId("gp")).toHaveText("0");
  const count = await page.evaluate(
    async () =>
      await new Promise<number>((resolve) => {
        const req = indexedDB.open("mrs-english", 1);
        req.onsuccess = () => {
          const db = req.result,
            get = db.transaction("saves").objectStore("saves").get("current");
          get.onsuccess = () => {
            resolve(
              Object.values(get.result.cards as Record<string, number>).reduce(
                (a, b) => a + b,
                0,
              ),
            );
            db.close();
          };
        };
      }),
  );
  expect(count).toBe(1);
});

test("explicit media download supports unseen photos offline and can repeat safely", async ({
  page,
  context,
}) => {
  test.setTimeout(90000);
  await seed(page);
  await nav(page, "SETTINGS");
  await page
    .getByRole("button", { name: "写真・音声をオフライン保存", exact: true })
    .click();
  await expect(page.locator(".toast")).toContainText(
    "すべての写真・音声をオフライン保存",
    { timeout: 45000 },
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
  await page.getByRole("button", { name: /TAP TO START/ }).click();
  await context.setOffline(true);
  await nav(page, "SETTINGS");
  await page.getByRole("button", { name: /20枚から壁紙/ }).click();
  await page.getByRole("button", { name: "壁紙 BG20" }).click();
  await page.getByRole("button", { name: "閉じる", exact: true }).click();
  expect(await page.locator(".app").getAttribute("style")).toContain("bg-20");
  const loaded = await page.evaluate(
    async (path) => {
      const res = await fetch(path);
      return res.ok && res.headers.get("content-type")?.startsWith("image/");
    },
    `/Mrs.English/${assets.cards.at(-1)!.path}`,
  );
  expect(loaded).toBe(true);
  await context.setOffline(false);
});
