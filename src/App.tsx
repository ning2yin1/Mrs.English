import { useCallback, useEffect, useRef, useState } from "react";
import {
  assets,
  members,
  memberPhoto,
  topics,
  url,
  ui,
  type Card,
  type Difficulty,
  type Member,
} from "./data";
import {
  begin,
  draw,
  exportSave,
  freshSave,
  grade,
  importSave,
  localDate,
  type Save,
  type Settings,
} from "./game";
import { verifiedResultVoice } from "./voices";
import { load, mutate, replace } from "./storage";
import { audio } from "./audio";
import { Button, CardDetails, Icon, Loader, Modal } from "./components/UI";
import { Onboarding } from "./screens/Onboarding";
import { GameIntro, Grammar, Play, ResultScreen } from "./screens/Learning";
import { CardsScreen, GachaScreen, GachaReveal } from "./screens/Collection";
import { ChatScreen, LoginBonus } from "./screens/Social";
import { HomeScreen, SettingsScreen } from "./screens/HomeSettings";
import type { Tab } from "./screens/types";
const tabs: Tab[] = ["HOME", "PLAY", "CARDS", "GACHA", "CHAT", "SETTINGS"];
const message = (e: unknown) =>
  e instanceof Error ? e.message : "操作を完了できませんでした。";
function useViewport() {
  const read = () => ({
    width: window.innerWidth,
    height: window.innerHeight,
    visibleHeight: window.visualViewport?.height ?? window.innerHeight,
    offsetTop: window.visualViewport?.offsetTop ?? 0,
  });
  const [v, setV] = useState(read);
  useEffect(() => {
    const resize = () => setV(read());
    window.addEventListener("resize", resize);
    visualViewport?.addEventListener("resize", resize);
    visualViewport?.addEventListener("scroll", resize);
    return () => {
      window.removeEventListener("resize", resize);
      visualViewport?.removeEventListener("resize", resize);
      visualViewport?.removeEventListener("scroll", resize);
    };
  }, []);
  return v;
}
export default function App() {
  const [save, setSave] = useState<Save | null>(null),
    [started, setStarted] = useState(false),
    [tab, setTab] = useState<Tab>("HOME"),
    [busy, setBusy] = useState(false),
    [fatal, setFatal] = useState(""),
    [notice, setNotice] = useState("");
  const [topic, setTopic] = useState("G01"),
    [difficulty, setDifficulty] = useState<Difficulty>("EASY"),
    [intro, setIntro] = useState<string | null>(null),
    [reveal, setReveal] = useState(false),
    [detail, setDetail] = useState<Card | null>(null),
    [modal, setModal] = useState<"wallpaper" | "login" | "help" | null>(null);
  const [confirmation, setConfirmation] = useState<{
      title: string;
      body: string;
      run: () => void;
    } | null>(null),
    [entry, setEntry] = useState(false),
    [offline, setOffline] = useState(!navigator.onLine),
    [update, setUpdate] = useState<ServiceWorker | null>(null),
    [assetLoading, setAssetLoading] = useState(false),
    [assetError, setAssetError] = useState(""),
    [backgroundAttempt, setBackgroundAttempt] = useState(0);
  const [dismissedLogin, setDismissedLogin] = useState("");
  const [caching, setCaching] = useState(false),
    [cacheProgress, setCacheProgress] = useState("");
  const lock = useRef(false),
    file = useRef<HTMLInputElement>(null),
    bgm = useRef<HTMLInputElement>(null),
    played = useRef(new Set<string>());
  const viewport = useViewport();
  const notify = useCallback((text: string) => setNotice(text), []);
  const reloadSave = useCallback(() => {
    void load()
      .then(({ save, recovered }) => {
        setSave(save);
        setFatal("");
        if (recovered)
          notify(
            "直前の正常な保存から復旧しました。バックアップをおすすめします。",
          );
      })
      .catch((e) => {
        setFatal(message(e));
        setSave(freshSave());
      });
  }, [notify]);
  useEffect(() => {
    reloadSave();
    void audio.restoreBgm().catch(() => {});
    const online = () => setOffline(!navigator.onLine);
    window.addEventListener("online", online);
    window.addEventListener("offline", online);
    let channel: BroadcastChannel | undefined;
    try {
      channel = new BroadcastChannel("mrs-save");
      channel.onmessage = () => reloadSave();
    } catch {}
    return () => {
      window.removeEventListener("online", online);
      window.removeEventListener("offline", online);
      channel?.close();
    };
  }, [reloadSave]);
  useEffect(() => {
    if (save) audio.configure(save.settings);
  }, [save?.settings]);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 7000);
    return () => clearTimeout(timer);
  }, [notice]);
  useEffect(() => {
    if (!("serviceWorker" in navigator) || !import.meta.env.PROD) return;
    void navigator.serviceWorker
      .register(url("sw.js"))
      .then((reg) => {
        if (reg.waiting) setUpdate(reg.waiting);
        reg.addEventListener("updatefound", () => {
          const worker = reg.installing;
          worker?.addEventListener("statechange", () => {
            if (
              worker.state === "installed" &&
              navigator.serviceWorker.controller
            )
              setUpdate(worker);
          });
        });
      })
      .catch(() =>
        notify(
          "オフラインの準備ができませんでした。接続と保存容量を確認してください。",
        ),
      );
  }, [notify]);
  const commit = useCallback(
    async (change: (s: Save) => void) => {
      if (lock.current) return null;
      lock.current = true;
      setBusy(true);
      try {
        if (fatal) throw Error("セーブの復元または初期化が必要です。");
        const next = await mutate(change);
        setSave(next);
        try {
          const c = new BroadcastChannel("mrs-save");
          c.postMessage("changed");
          c.close();
        } catch {}
        return next;
      } catch (e) {
        notify(
          e instanceof DOMException
            ? "保存できませんでした。保存許可と空き容量を確認してください。"
            : message(e),
        );
        try {
          const current = await load();
          setSave(current.save);
        } catch {}
        return null;
      } finally {
        lock.current = false;
        setBusy(false);
      }
    },
    [fatal, notify],
  );
  const session = save?.session,
    result = save?.result,
    onboarding = started && !!save && !save.profile.completed,
    isResult = started && !onboarding && tab === "PLAY" && !session && !!result,
    isChat = started && !onboarding && tab === "CHAT";
  const portrait = viewport.height > viewport.width,
    nativeEntry = entry && portrait,
    rotation = nativeEntry
      ? 0
      : isChat
        ? portrait
          ? 0
          : -90
        : portrait
          ? 90
          : 0,
    stageWidth = rotation ? viewport.visibleHeight : viewport.width,
    stageHeight = rotation ? viewport.width : viewport.visibleHeight;
  const wallpaper = save
    ? assets.backgrounds.find((b) => b.id === save.settings.wallpaper)
    : undefined;
  const background = onboarding
    ? save?.profile.giftClaimed
      ? "bg-gacha"
      : "bg-onboarding"
    : isChat
      ? "bg-chat"
      : isResult
        ? "bg-result"
        : tab === "GACHA"
          ? "bg-gacha"
          : tab === "CARDS"
            ? "bg-cards"
            : tab === "SETTINGS"
              ? "bg-onboarding"
              : tab === "PLAY" && !session
                ? "bg-grammar"
                : null;
  const backgroundPath = !started
    ? "assets/backgrounds/bg-onboarding.webp"
    : background
      ? `assets/backgrounds/${background}.webp`
      : tab === "PLAY" && session
        ? assets.backgrounds.find(
            (b) =>
              b.id === topics.find((t) => t.id === session.topic)!.backgroundId,
          )!.path
        : (wallpaper?.path ?? "assets/backgrounds/bg-home-fallback.webp");
  useEffect(() => {
    const img = new Image();
    let active = true;
    setAssetLoading(true);
    setAssetError("");
    img.onload = () => {
      if (active) setAssetLoading(false);
    };
    img.onerror = () => {
      if (active) {
        setAssetLoading(false);
        setAssetError(
          "背景画像を読み込めませんでした。接続またはオフライン保存を確認してください。",
        );
      }
    };
    img.src = url(backgroundPath);
    return () => {
      active = false;
    };
  }, [backgroundPath, backgroundAttempt]);
  useEffect(() => {
    if (!started || !save?.profile.completed || fatal) return;
    const check = () => {
      if (
        localDate() > save.login.last &&
        localDate() !== dismissedLogin &&
        !isChat &&
        !session &&
        !isResult &&
        !reveal
      )
        setModal("login");
    };
    check();
    const timer = setInterval(check, 30000);
    return () => clearInterval(timer);
  }, [
    started,
    save?.profile.completed,
    save?.login.last,
    fatal,
    isChat,
    session?.id,
    isResult,
    reveal,
    dismissedLogin,
  ]);
  useEffect(() => {
    if (
      !isResult ||
      !result ||
      played.current.has(result.id) ||
      result.voicePlayed
    )
      return;
    played.current.add(result.id);
    const v = verifiedResultVoice(
      result.member,
      grade(result.correct),
      result.voiceId,
    );
    if (!v) return;
    let active = true;
    void commit((s) => {
      if (s.result?.id === result.id) s.result.voicePlayed = true;
    }).then((next) => {
      if (next && active) void audio.play(v);
    });
    return () => {
      active = false;
      audio.stop();
    };
  }, [isResult, result?.id]);
  const navigate = async (next: Tab) => {
    audio.stop();
    setEntry(false);
    setIntro(null);
    setReveal(false);
    setModal(null);
    setDetail(null);
    if (next === "PLAY" && save?.result && !save.session) {
      const nextSave = await commit((s) => {
        s.result = null;
      });
      if (!nextSave) return;
    }
    setTab(next);
  };
  const setting = (patch: Partial<Settings>) => {
    void commit((s) => Object.assign(s.settings, patch));
  };
  const launch = (id = topic, level = difficulty) => {
    audio.unlock();
    audio.stop();
    for (const v of assets.audio.filter(
      (v) => v.member === save?.settings.member,
    ))
      void audio.prepareVoice(v).catch(() => {});
    void commit((s) => begin(s, id, level)).then((next) => {
      if (next) {
        setTopic(id);
        setDifficulty(level);
        setTab("PLAY");
        setIntro(next.session!.id);
      }
    });
  };
  const confirm = (title: string, body: string, run: () => void) =>
    setConfirmation({ title, body, run });
  const exportData = () => {
    if (!save) return;
    const a = document.createElement("a"),
      u = URL.createObjectURL(
        new Blob([exportSave(save)], { type: "application/json" }),
      );
    a.href = u;
    a.download = `MrsEnglish-${localDate()}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(u), 1000);
    notify("バックアップを書き出しました。写真・音声・追加BGMは含まれません。");
  };
  const importData = async (f?: File) => {
    if (!f) return;
    try {
      const next = importSave(await f.text());
      confirm(
        "バックアップを復元",
        `現在のデータを、${next.gp.toLocaleString()} GP・カード${Object.keys(next.cards).length}種のバックアップで置き換えます。`,
        () =>
          void replace(next)
            .then((s) => {
              audio.stop();
              setSave(s);
              setFatal("");
              setTab("HOME");
              setEntry(false);
              notify("バックアップを復元しました。");
            })
            .catch((e) => notify(message(e))),
      );
    } catch (e) {
      notify(message(e));
    }
  };
  const reset = () =>
    confirm(
      "データを初期化",
      "GP・カード・好感度・学習記録・設定をすべて削除します。先にJSONバックアップを保存してください。",
      () =>
        void replace(freshSave())
          .then((s) => {
            audio.stop();
            setSave(s);
            setFatal("");
            setTab("HOME");
            setEntry(false);
          })
          .catch((e) => notify(message(e))),
    );
  const cacheAll = async () => {
    if (caching) return;
    setCaching(true);
    try {
      if (!("caches" in window))
        throw Error("このブラウザでは保存できません。");
      const cache = await caches.open("mrs-media-v1");
      const paths = [
        ...assets.backgrounds,
        ...assets.cards,
        ...assets.audio,
      ].map((a) => url(a.path));
      let done = 0;
      for (const path of paths) {
        if (!(await cache.match(path, { ignoreVary: true }))) {
          const res = await fetch(path);
          if (!res.ok) throw Error(`素材を取得できませんでした：${path}`);
          await cache.put(path, res);
        }
        setCacheProgress(`${++done} / ${paths.length}`);
      }
      await navigator.storage?.persist?.();
      notify(
        "すべての写真・音声をオフライン保存しました。JSONバックアップも定期的に保存してください。",
      );
    } catch (e) {
      notify(message(e));
    } finally {
      setCaching(false);
    }
  };
  const drawCards = (count: 1 | 10) => {
    if (!save) return;
    const cost = count === 10 ? 2700 : 300;
    confirm(
      `${count === 10 ? "10連" : "1回"}ガチャ`,
      `所持 ${save.gp.toLocaleString()} GP → 消費 ${cost.toLocaleString()} GP → 残り ${(save.gp - cost).toLocaleString()} GP${count === 10 ? "。Aランク以上1枚確定。" : ""}`,
      () => {
        audio.unlock();
        void commit((s) => {
          draw(s, count);
        }).then((s) => {
          if (s) {
            setReveal(true);
            audio.effect("gacha");
          }
        });
      },
    );
  };
  const applyUpdate = () =>
    confirm(
      "アプリを更新",
      "保存済みのデータを保持して再読み込みします。未送信の回答は失われます。",
      () => {
        navigator.serviceWorker.addEventListener(
          "controllerchange",
          () => location.reload(),
          { once: true },
        );
        update?.postMessage("SKIP_WAITING");
      },
    );
  const props = save ? { save, busy, commit, notify } : null,
    me = members.find((m) => m.id === save?.settings.member) ?? members[0];
  const activeBackground = session
    ? topics.find((t) => t.id === session.topic)?.backgroundId
    : undefined;
  const playFraming =
    activeBackground === "BG01"
      ? { size: "cover", position: "center calc(50% - 65px)" }
      : activeBackground === "BG05"
        ? { size: "auto 95%", position: "center -30px" }
        : activeBackground === "BG13"
          ? { size: "auto 78%", position: "center top" }
          : { size: "cover", position: "center" };
  const stageStyle = {
    "--play-photo-size": playFraming.size,
    "--play-photo-position": playFraming.position,
    "--stage-width": `${stageWidth}px`,
    "--stage-height": `${stageHeight}px`,
    "--stage-rotation": `${rotation}deg`,
    "--background": `url("${url(backgroundPath)}")`,
    "--visible-height": `${viewport.visibleHeight}px`,
    "--dialog-top": `${viewport.visibleHeight / 2 + viewport.offsetTop}px`,
  } as React.CSSProperties;
  const title = !started,
    onboard = !!onboarding,
    focus =
      (!!session && tab === "PLAY" && !onboard) ||
      isResult ||
      isChat ||
      onboard ||
      title;
  return (
    <div
      className="app-stage"
      style={{
        height: `${viewport.visibleHeight}px`,
        width: `${viewport.width}px`,
        top: `${viewport.offsetTop}px`,
      }}
    >
      <div
        className={`app ${portrait ? "physical-portrait" : "physical-landscape"} ${rotation === 90 ? "rotated-clockwise" : rotation === -90 ? "rotated-counterclockwise" : ""} ${nativeEntry ? "entry-portrait" : ""} ${stageWidth < 740 ? "compact" : ""} ${stageHeight < 360 ? "short" : ""} ${isChat ? "chat-mode" : ""} ${isResult ? "result-mode" : ""} ${intro ? "intro-mode" : ""} ${onboard ? "onboarding-mode" : ""} ${session && tab === "PLAY" && !onboard ? "is-playing" : ""} ${!save?.settings.motion ? "reduced-motion" : ""} view-${tab.toLowerCase()}`}
        style={stageStyle}
        data-background={backgroundPath}
      >
        <div
          className={`screen-background ${!background && started ? "photo-background" : ""}`}
        />
        {save && !focus && (
          <header className="topbar">
            <button
              className="brand small-brand"
              onClick={() => void navigate("HOME")}
            >
              {tab === "HOME"
                ? "Mrs.English"
                : tab === "PLAY"
                  ? "GRAMMAR SELECT"
                  : tab === "CARDS"
                    ? "CARD COLLECTION"
                    : tab === "GACHA"
                      ? "PRISM GACHA"
                      : "SETTINGS"}
              <span>{tab === "HOME" ? "YOUR ENGLISH GARDEN" : tab}</span>
            </button>
            <div className="status">
              <span className="connection">
                {offline ? "OFFLINE" : "AUTO SAVE"}
              </span>
              <button
                className="profile-status"
                onClick={() => void navigate("SETTINGS")}
              >
                <img src={url(memberPhoto(me.id).path)} alt="" />
                <span>{save.profile.nickname || me.short}</span>
              </button>
              <button
                aria-label="GPを確認"
                onClick={() => void navigate("GACHA")}
              >
                <Icon name="gp" />
                <b data-testid="gp">{save.gp.toLocaleString()}</b>
                <small>GP</small>
              </button>
              <button
                aria-label="好感度を確認"
                onClick={() => void navigate("CHAT")}
              >
                <Icon name="heart" />
                <b>{save.affection[me.id]}</b>
              </button>
            </div>
          </header>
        )}
        {title && save && (
          <main className="title-screen">
            <img
              className="title-halo"
              src={ui("title/title-halo.png")}
              alt=""
            />
            <span className="eyebrow">LEARN · COLLECT · CONNECT</span>
            <h1>Mrs.English</h1>
            <p>好きな気持ちを、学ぶ力に。</p>
            <Button
              className="title-start"
              onClick={() => {
                audio.unlock();
                setStarted(true);
              }}
            >
              TAP TO START
              <Icon name="next" />
            </Button>
          </main>
        )}
        {started && props && (
          <main
            className={`main ${focus ? "focused" : ""}`}
            key={onboard ? "onboarding" : tab}
          >
            {onboard ? (
              <Onboarding
                {...props}
                onEntry={setEntry}
                onDone={() => {
                  setTab("HOME");
                  setModal("login");
                }}
              />
            ) : tab === "HOME" ? (
              <HomeScreen
                {...props}
                difficulty={difficulty}
                onPlay={(id) => {
                  setTopic(id);
                  void navigate("PLAY");
                }}
                onWallpaper={() => setModal("wallpaper")}
                onLogin={() => setModal("login")}
                onHelp={() => setModal("help")}
              />
            ) : tab === "PLAY" ? (
              session ? (
                intro === session.id ? (
                  assetLoading ? (
                    <section className="game-intro" aria-label="背景を準備中" />
                  ) : (
                    <GameIntro
                      motion={save!.settings.motion}
                      onDone={() => setIntro(null)}
                    />
                  )
                ) : (
                  <Play
                    key={`${session.id}:${session.step}`}
                    {...props}
                    onEntry={setEntry}
                    onExit={() =>
                      confirm(
                        "プレイを中断",
                        "回答済みの問題は保存されます。PLAYから再開できます。完走するまでGPは加算されません。",
                        () => void navigate("HOME"),
                      )
                    }
                    onChoose={() =>
                      confirm(
                        "文法を選び直す",
                        "このプレイを終了します。間違えた問題の記録は残りますが、未完走のGPは獲得できません。",
                        () =>
                          void commit((s) => {
                            s.session = null;
                          }),
                      )
                    }
                  />
                )
              ) : result ? (
                <ResultScreen
                  {...props}
                  onRetry={() => launch(result.topic, result.difficulty)}
                  onNext={() =>
                    void commit((s) => {
                      s.result = null;
                    }).then((s) => {
                      if (s) {
                        if (result.topic === "G60")
                          notify(
                            "全60文法の最後のステージです。好きな文法で復習しましょう。",
                          );
                        else
                          setTopic(
                            topics[
                              topics.findIndex((t) => t.id === result.topic) + 1
                            ].id,
                          );
                      }
                    })
                  }
                  onHome={() => void navigate("HOME")}
                />
              ) : (
                <Grammar
                  {...props}
                  topic={topic}
                  difficulty={difficulty}
                  setTopic={setTopic}
                  setDifficulty={setDifficulty}
                  onStart={() => launch()}
                />
              )
            ) : tab === "CARDS" ? (
              <CardsScreen {...props} onDetail={setDetail} />
            ) : tab === "GACHA" ? (
              reveal ? (
                <GachaReveal
                  ids={save!.gacha}
                  save={save!}
                  onDone={() => setReveal(false)}
                  onDetail={setDetail}
                />
              ) : (
                <GachaScreen
                  {...props}
                  onDraw={drawCards}
                  onPlay={() => void navigate("PLAY")}
                  onLast={() => setReveal(true)}
                />
              )
            ) : tab === "CHAT" ? (
              <ChatScreen
                {...props}
                onExit={() => void navigate("HOME")}
                onPlay={(member) =>
                  void commit((s) => {
                    s.settings.member = member;
                  }).then((s) => {
                    if (s) void navigate("PLAY");
                  })
                }
              />
            ) : (
              <SettingsScreen
                {...props}
                onSetting={setting}
                onEntry={setEntry}
                onWallpaper={() => setModal("wallpaper")}
                onExport={exportData}
                onImport={() => file.current?.click()}
                onBgm={() => bgm.current?.click()}
                onReset={reset}
                onHelp={() => setModal("help")}
                onUpdate={applyUpdate}
                updateAvailable={!!update}
                caching={caching}
                cacheProgress={cacheProgress}
                onCache={() => void cacheAll()}
              />
            )}
          </main>
        )}
        {save && started && !focus && (
          <nav className="nav" aria-label="メインナビゲーション">
            {tabs.map((t) => (
              <button
                key={t}
                aria-current={tab === t ? "page" : undefined}
                onClick={() => {
                  audio.effect();
                  void navigate(t);
                }}
              >
                <Icon name={t.toLowerCase()} />
                <span>{t}</span>
              </button>
            ))}
          </nav>
        )}
        <input
          hidden
          type="file"
          ref={file}
          accept="application/json,.json"
          onChange={(e) => {
            void importData(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
        <input
          hidden
          type="file"
          ref={bgm}
          accept="audio/*"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) {
              if (!f.type.startsWith("audio/") || f.size > 30_000_000)
                notify("30MB以下の音声ファイルを選んでください。");
              else
                void audio
                  .setBgm(f)
                  .then(() => notify("BGMを端末内に保存しました。"))
                  .catch((e) => notify(message(e)));
            }
            e.target.value = "";
          }}
        />
        {modal === "wallpaper" && save && (
          <Modal title="WALLPAPER · 20の景色" onClose={() => setModal(null)}>
            <div className="wallpaper-grid">
              {[...assets.backgrounds]
                .sort((a, b) => a.id.localeCompare(b.id))
                .map((b) => (
                  <button
                    key={b.id}
                    aria-pressed={save.settings.wallpaper === b.id}
                    disabled={busy}
                    onClick={() => setting({ wallpaper: b.id })}
                  >
                    <img
                      src={url(b.path)}
                      alt={`壁紙 ${b.id}`}
                      loading="lazy"
                    />
                    <span>
                      {b.id} {save.settings.wallpaper === b.id ? "✓" : ""}
                    </span>
                  </button>
                ))}
            </div>
          </Modal>
        )}
        {modal === "login" && props && (
          <LoginBonus
            {...props}
            onClose={() => {
              setDismissedLogin(localDate());
              setModal(null);
            }}
          />
        )}
        {modal === "help" && (
          <Modal title="Mrs.English の遊び方" onClose={() => setModal(null)}>
            <div className="help-grid">
              <section>
                <h3>01 · LEARN</h3>
                <p>
                  60文法、600英文。1回10問、制限時間はありません。EASYは4択、NORMALは並び替え、HARDはダミー語あり、MASTERは英文入力です。
                </p>
                <p>
                  正解100点。GPは難易度ごとに10 / 15 / 20 /
                  30。何度でも獲得できます。誤答の解説はNEXTまで表示されます。
                </p>
                <h3>02 · COLLECT</h3>
                <p>
                  1回300GP、10連2,700GP。10連はA以上1枚確定。重複カードは所持枚数に記録します。
                </p>
              </section>
              <section>
                <h3>03 · CONNECT</h3>
                <p>
                  選択メンバーの好感度は正解ごと+1、全問正解でさらに+5。好感度0
                  / 20 / 50 / 100 / 200で新しい会話が解放されます。
                </p>
                <h3>04 · KEEP</h3>
                <p>
                  自動保存に加え、設定からJSONバックアップを。オフラインで全写真・音声を使うには、素材保存を実行してください。
                </p>
                <p>推し・ニックネーム・ホームの壁紙は設定から変更できます。</p>
              </section>
            </div>
          </Modal>
        )}
        {detail && save && (
          <CardDetails
            card={detail}
            counts={save.cards}
            onClose={() => setDetail(null)}
            onCard={setDetail}
          />
        )}
        {fatal && (
          <Modal title="セーブを復旧" locked onClose={() => {}}>
            <p>{fatal}</p>
            <div className="actions">
              <Button onClick={() => file.current?.click()}>
                JSONから復元
              </Button>
              <Button kind="secondary" onClick={reset}>
                初期化
              </Button>
              <Button kind="secondary" onClick={reloadSave}>
                再読み込み
              </Button>
            </div>
          </Modal>
        )}
        {confirmation && (
          <Modal
            title={confirmation.title}
            onClose={() => setConfirmation(null)}
          >
            <p>{confirmation.body}</p>
            <div className="actions">
              <Button kind="secondary" onClick={() => setConfirmation(null)}>
                キャンセル
              </Button>
              <Button
                onClick={() => {
                  const run = confirmation.run;
                  setConfirmation(null);
                  run();
                }}
              >
                実行する
              </Button>
            </div>
          </Modal>
        )}
        <Loader
          pending={!save || assetLoading}
          error={assetError}
          retry={() => setBackgroundAttempt((n) => n + 1)}
        />
        {notice && (
          <div className="toast" role="status">
            {notice}
            <button onClick={() => setNotice("")} aria-label="通知を閉じる">
              ×
            </button>
          </div>
        )}
        {busy && (
          <span className="saving" role="status">
            SAVING…
          </span>
        )}
      </div>
    </div>
  );
}
