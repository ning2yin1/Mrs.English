import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  assets,
  byQuestion,
  difficulties,
  memberPhoto,
  members,
  questions,
  rates,
  topics,
  ui,
  url,
  type Card,
  type Difficulty,
  type Member,
} from "./data";
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
  localDate,
  loginRewards,
  sentence,
  type Save,
  type Settings,
} from "./game";
import { load, mutate, replace } from "./storage";
import { audio } from "./audio";
import { chatTitles, conversation, thresholds } from "./chat";
type Tab = "HOME" | "PLAY" | "CARDS" | "GACHA" | "CHAT" | "SETTINGS";
const tabs: Tab[] = ["HOME", "PLAY", "CARDS", "GACHA", "CHAT", "SETTINGS"];
export function Icon({ name }: { name: string }) {
  return <img className="icon" src={ui(`icons/${name}.svg`)} alt="" />;
}
function Button({
  children,
  onClick,
  kind = "",
  disabled = false,
  ...props
}: {
  children: ReactNode;
  onClick?: () => void;
  kind?: string;
  disabled?: boolean;
  [key: string]: any;
}) {
  return (
    <button
      className={`button ${kind}`}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
function Modal({
  title,
  children,
  onClose,
  locked = false,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  locked?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
    return () => ref.current?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      aria-label={title}
      onCancel={(e) => {
        e.preventDefault();
        if (!locked) onClose();
      }}
    >
      <div className="modal-head">
        <h2>{title}</h2>
        {!locked && (
          <Button onClick={onClose} aria-label="閉じる">
            <Icon name="close" />
          </Button>
        )}
      </div>
      <div className="modal-body">{children}</div>
    </dialog>
  );
}
function CardFace({
  card,
  owned = true,
  count = 0,
  onClick,
}: {
  card: Card;
  owned?: boolean;
  count?: number;
  onClick?: () => void;
}) {
  const inner = (
    <>
      <div className="card-art">
        {owned ? (
          <>
            <img
              className="card-photo"
              src={url(card.path)}
              alt={`${members.find((m) => m.id === card.member)?.name} ${card.category}`}
              loading="lazy"
              style={{ objectPosition: card.objectPosition }}
            />
            <img
              className="card-frame"
              src={ui(`cards/frame-${card.rarity.toLowerCase()}.png`)}
              alt=""
            />
            <span className="card-label">
              {card.rarity} · {members.find((m) => m.id === card.member)?.short}
            </span>
          </>
        ) : (
          <>
            <img
              className="card-frame"
              src={ui("cards/unowned-card.png")}
              alt="未所持"
            />
            <span className="locked-label">
              <Icon name="lock" /> {card.rarity}
            </span>
          </>
        )}
      </div>
      {count > 0 && <span className="count">×{count}</span>}
    </>
  );
  return onClick ? (
    <button
      className={`card rarity-${card.rarity}`}
      onClick={onClick}
      aria-label={`${card.id} ${owned ? "所持" : "未所持"} 詳細`}
    >
      {inner}
    </button>
  ) : (
    <div className={`card rarity-${card.rarity}`}>{inner}</div>
  );
}
const errorText = (e: unknown) =>
  e instanceof Error ? e.message : "操作に失敗しました。";
export default function App() {
  const [save, setSave] = useState<Save | null>(null),
    [started, setStarted] = useState(false),
    [tab, setTab] = useState<Tab>("HOME");
  const [fatal, setFatal] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false);
  const lock = useRef(false),
    [topic, setTopic] = useState("G01"),
    [difficulty, setDifficulty] = useState<Difficulty>("EASY");
  const [modal, setModal] = useState<"login" | "wallpaper" | "help" | null>(
      null,
    ),
    [detail, setDetail] = useState<Card | null>(null),
    [voiceBlocked, setVoiceBlocked] = useState(false);
  const [reveal, setReveal] = useState(false),
    [offline, setOffline] = useState(!navigator.onLine),
    [updateReady, setUpdateReady] = useState<ServiceWorker | null>(null);
  const [confirm, setConfirm] = useState<{
    title: string;
    body: string;
    action: () => void;
  } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null),
    bgmRef = useRef<HTMLInputElement>(null),
    [cacheProgress, setCacheProgress] = useState(""),
    [caching, setCaching] = useState(false);
  const [cardMember, setCardMember] = useState("all"),
    [cardRarity, setCardRarity] = useState("all"),
    [ownedOnly, setOwnedOnly] = useState(false);
  const [chatMember, setChatMember] = useState<Member>("motoki"),
    [chatIndex, setChatIndex] = useState(0),
    [chatStep, setChatStep] = useState(0),
    [gradeFilter, setGradeFilter] = useState(0),
    [mistakesOnly, setMistakesOnly] = useState(false);
  const notify = useCallback((s: string) => setNotice(s), []);
  useEffect(() => {
    void load()
      .then(({ save, recovered }) => {
        setSave(save);
        if (recovered)
          notify(
            "直前の正常な保存データから復旧しました。JSONバックアップをおすすめします。",
          );
      })
      .catch((e) => {
        setFatal(errorText(e));
        setSave(freshSave());
      });
    void audio.restoreBgm().catch(() => {});
    const on = () => setOffline(!navigator.onLine);
    window.addEventListener("online", on);
    window.addEventListener("offline", on);
    const vv = window.visualViewport;
    const resize = () => {
      document.documentElement.style.setProperty(
        "--visible-height",
        `${vv?.height ?? innerHeight}px`,
      );
      document.documentElement.classList.toggle(
        "keyboard",
        !!vv && vv.height < innerHeight * 0.76,
      );
    };
    vv?.addEventListener("resize", resize);
    resize();
    let channel: BroadcastChannel | undefined;
    try {
      channel = new BroadcastChannel("mrs-save");
      channel.onmessage = () =>
        void load()
          .then((x) => setSave(x.save))
          .catch((e) => notify(errorText(e)));
    } catch {}
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", on);
      vv?.removeEventListener("resize", resize);
      channel?.close();
    };
  }, [notify]);
  useEffect(() => {
    if (save) audio.configure(save.settings);
  }, [save?.settings]);
  useEffect(() => {
    if (notice) {
      const timer = setTimeout(() => setNotice(""), 7000);
      return () => clearTimeout(timer);
    }
  }, [notice]);
  useEffect(() => {
    if ("serviceWorker" in navigator && import.meta.env.PROD) {
      void navigator.serviceWorker
        .register(url("sw.js"))
        .then((reg) => {
          if (reg.waiting) setUpdateReady(reg.waiting);
          reg.addEventListener("updatefound", () => {
            const worker = reg.installing;
            worker?.addEventListener("statechange", () => {
              if (
                worker.state === "installed" &&
                navigator.serviceWorker.controller
              )
                setUpdateReady(worker);
            });
          });
        })
        .catch(() =>
          notify(
            "オフライン機能を準備できませんでした。接続と空き容量を確認してください。",
          ),
        );
    }
  }, [notify]);
  const commit = useCallback(
    async (fn: (s: Save) => void) => {
      if (lock.current) return null;
      lock.current = true;
      setBusy(true);
      try {
        if (fatal) throw Error("保存の復元または初期化が必要です。");
        const next = await mutate(fn);
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
            ? "保存できませんでした。ブラウザの保存許可と空き容量を確認し、再試行してください。"
            : errorText(e),
        );
        try {
          const current = await load();
          setSave(current.save);
        } catch {
          /* Keep the last visible state until explicit recovery. */
        }
        return null;
      } finally {
        lock.current = false;
        setBusy(false);
      }
    },
    [notify, fatal],
  );
  const setting = (patch: Partial<Settings>) =>
    void commit((s) => {
      Object.assign(s.settings, patch);
    });
  const navigate = (next: Tab) => {
    if (next === "PLAY" && tab !== "PLAY" && save?.result && !save.session)
      void commit((s) => {
        s.result = null;
      });
    audio.stop();
    setTab(next);
    setReveal(false);
    setDetail(null);
    setModal(null);
  };
  const launch = (id = topic, level = difficulty) => {
    audio.unlock();
    void commit((s) => begin(s, id, level)).then((s) => {
      if (s) {
        setTopic(id);
        setTab("PLAY");
      }
    });
  };
  const result = save?.result,
    session = save?.session;
  const resultVisible = tab === "PLAY" && !session && !!result;
  useEffect(() => {
    if (started && resultVisible && result) {
      const v = assets.audio.find((v) => v.id === result.voiceId)!;
      void audio.play(v).then((ok) => setVoiceBlocked(!ok));
      return () => audio.stop();
    }
  }, [started, resultVisible, result?.id]);
  useEffect(() => {
    if (!started || !save) return;
    const check = () => {
      if (localDate() > save.login.last) setModal("login");
    };
    check();
    const timer = setInterval(check, 30000);
    return () => clearInterval(timer);
  }, [started, save?.login.last]);
  if (!save)
    return (
      <div className="loading">
        <span className="brand">Mrs.English</span>
        <p>学習ルームを準備しています…</p>
      </div>
    );
  const me = members.find((m) => m.id === save.settings.member)!;
  const bg = assets.backgrounds.find(
    (b) =>
      b.id ===
      (tab === "PLAY" && session
        ? topics.find((t) => t.id === session.topic)!.backgroundId
        : save.settings.wallpaper),
  )!;
  const themeStyle = {
    "--wallpaper": `url("${url(bg.path)}")`,
    "--member-color": me.color,
  } as React.CSSProperties;
  const continueTopic =
    topics.find((t) => !save.records[`${t.id}:${difficulty}`]) ?? topics[59];
  const chats = conversation(chatMember, chatIndex),
    unlocked = save.affection[chatMember] >= thresholds[chatIndex];
  const showLogin = () => setModal("login");
  const importFile = async (file?: File) => {
    if (!file) return;
    try {
      const next = importSave(await file.text());
      setConfirm({
        title: "バックアップを復元",
        body: `現在のデータを、${next.gp.toLocaleString()} GP・カード${Object.keys(next.cards).length}種のバックアップで置き換えます。`,
        action: () => {
          void replace(next)
            .then((s) => {
              audio.stop();
              setSave(s);
              setFatal("");
              navigate("HOME");
              notify("バックアップを復元しました。");
            })
            .catch((e) => notify(errorText(e)));
        },
      });
    } catch (e) {
      notify(errorText(e));
    }
  };
  const exportFile = () => {
    const a = document.createElement("a"),
      u = URL.createObjectURL(
        new Blob([exportSave(save)], { type: "application/json" }),
      );
    a.href = u;
    a.download = `MrsEnglish-${localDate()}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(u), 1000);
    notify("バックアップを書き出しました。音声・写真・追加BGMは含まれません。");
  };
  const cacheAll = async () => {
    if (caching) return;
    setCaching(true);
    try {
      if (!("caches" in window))
        throw Error("このブラウザはオフライン保存に対応していません。");
      const c = await caches.open("mrs-media-v1"),
        paths = [...assets.backgrounds, ...assets.cards, ...assets.audio].map(
          (a) => url(a.path),
        );
      let done = 0;
      for (const path of paths) {
        if (!(await c.match(path))) {
          const r = await fetch(path);
          if (!r.ok) throw Error(`素材取得に失敗しました: ${path}`);
          await c.put(path, r);
        }
        setCacheProgress(`${++done} / ${paths.length}`);
      }
      await navigator.storage?.persist?.();
      notify(
        "すべての写真・音声をオフライン保存しました。OSによる削除に備え、セーブのJSONも保管してください。",
      );
    } catch (e) {
      notify(errorText(e));
    } finally {
      setCaching(false);
    }
  };
  const drawCards = (count: 1 | 10) => {
    if (reveal || busy) return;
    audio.unlock();
    void commit((s) => draw(s, count)).then((s) => {
      if (s) {
        setReveal(true);
        audio.effect("gacha");
      }
    });
  };
  const cardList = assets.cards.filter(
    (c) =>
      (cardMember === "all" || c.member === cardMember) &&
      (cardRarity === "all" || c.rarity === cardRarity) &&
      (!ownedOnly || save.cards[c.id]),
  );
  const title = (
    <>
      <small className="eyebrow">YOUR WORDS, YOUR WORLD</small>
      <h1 className="brand">
        Mrs.English<span>LEARN · COLLECT · CONNECT</span>
      </h1>
    </>
  );
  return (
    <div
      className={`app ${!save.settings.motion ? "reduced-motion" : ""} ${tab === "PLAY" && session ? "is-playing" : ""}`}
      style={themeStyle}
    >
      <div className="wallpaper" />
      <div className="scrim" />
      <img className="edge-aurora" src={ui("effects/edge-aurora.png")} alt="" />
      <div className="rotate">
        <Icon name="rotate" />
        <h2>iPhoneを横向きにしてください</h2>
        <p>回転ロックを解除して、横画面でお楽しみください。</p>
      </div>
      {!started ? (
        <main className="title-screen">
          <img className="title-halo" src={ui("title/title-halo.svg")} alt="" />
          {title}
          <p>英語の一歩が、毎日の楽しみに。</p>
          <Button
            kind="primary start"
            onClick={() => {
              audio.unlock();
              audio.effect();
              setStarted(true);
            }}
          >
            TAP TO START <span>→</span>
          </Button>
          <small>非公式・個人用ファン学習ゲーム</small>
          {fatal && <p className="error">{fatal}</p>}
        </main>
      ) : (
        <>
          <header className="topbar">
            <button
              className="brand small-brand"
              onClick={() => navigate("HOME")}
            >
              Mrs.English<span>YOUR LITTLE ENGLISH ROOM</span>
            </button>
            <div className="status">
              <span className="connection">
                {offline ? "OFFLINE" : "LOCAL SAVE"}
              </span>
              <button onClick={() => navigate("GACHA")} aria-label="GPを確認">
                <Icon name="gp" />
                <b data-testid="gp">{save.gp.toLocaleString()}</b>
                <small>GP</small>
              </button>
              <button
                onClick={() => {
                  setChatMember(save.settings.member);
                  navigate("CHAT");
                }}
                aria-label="好感度を確認"
              >
                <Icon name="heart" />
                <b>{save.affection[save.settings.member]}</b>
              </button>
              <button
                className="member-status"
                onClick={() => navigate("SETTINGS")}
              >
                <img src={url(memberPhoto(me.id).path)} alt="" />
                <span>{me.short}</span>
              </button>
            </div>
          </header>
          {fatal && (
            <div className="fatal">
              <p>{fatal}</p>
              <Button onClick={() => navigate("SETTINGS")}>
                復元・初期化へ
              </Button>
            </div>
          )}
          <main className={`main view-${tab.toLowerCase()}`} key={tab}>
            {tab === "HOME" && (
              <section className="home">
                <div className="home-caption">
                  <span className="eyebrow">A LITTLE MORE, EVERY DAY</span>
                  <h2>今日も、ひとつ先へ。</h2>
                  <p>
                    {save.affection[me.id] >= 200
                      ? "積み重ねた言葉が、あなたの力に。"
                      : save.affection[me.id] >= 50
                        ? "続けてきた時間を、今日の自信に。"
                        : "好きな気持ちを、学ぶ力に変えて。"}
                  </p>
                </div>
                <div className="home-bottom">
                  <div className="lesson panel">
                    <span className="eyebrow">
                      YOUR NEXT CHAPTER <span>↗</span>
                    </span>
                    <div className="lesson-title">
                      <strong>
                        {continueTopic.number.toString().padStart(2, "0")}
                      </strong>
                      <div>
                        <small>
                          {continueTopic.grade}年 /{" "}
                          {continueTopic.number >= 57 ? "発展" : "基礎・応用"}
                        </small>
                        <h3>{continueTopic.title}</h3>
                      </div>
                    </div>
                    <progress
                      max={60}
                      value={
                        topics.filter((t) =>
                          Object.keys(save.records).some((k) =>
                            k.startsWith(t.id + ":"),
                          ),
                        ).length
                      }
                    />
                    <Button
                      kind="primary"
                      onClick={() => {
                        setTopic(continueTopic.id);
                        navigate("PLAY");
                      }}
                    >
                      CONTINUE <Icon name="next" />
                    </Button>
                  </div>
                  <div className="home-note">
                    <span>60 GRAMMAR · 600 SENTENCES</span>
                    <p>何度でも、あなたのペースで。</p>
                    <div className="member-pills">
                      {members.map((m) => (
                        <button
                          key={m.id}
                          aria-pressed={me.id === m.id}
                          onClick={() => setting({ member: m.id })}
                        >
                          {m.short}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <aside className="home-actions">
                  <Button
                    onClick={() => setModal("wallpaper")}
                    aria-label="壁紙を選択"
                  >
                    <Icon name="wallpaper" />
                  </Button>
                  <Button onClick={showLogin} aria-label="ログインボーナス">
                    <Icon name="gift" />
                  </Button>
                  <Button onClick={() => setModal("help")} aria-label="遊び方">
                    <Icon name="help" />
                  </Button>
                </aside>
              </section>
            )}
            {tab === "PLAY" &&
              (session ? (
                <Play
                  key={`${session.id}:${session.step}`}
                  save={save}
                  busy={busy}
                  commit={commit}
                  notify={notify}
                  onChoose={() =>
                    setConfirm({
                      title: "文法を選び直す",
                      body: "このプレイを終了して文法一覧に戻ります。途中の正誤記録は残りますが、未完走のGPは獲得できません。",
                      action: () => {
                        void commit((s) => {
                          s.session = null;
                        });
                      },
                    })
                  }
                  onExit={() =>
                    setConfirm({
                      title: "プレイを中断",
                      body: "回答済みの問題は保存されます。あとでPLAYから再開できます。完走するまでGPは加算されません。",
                      action: () => navigate("HOME"),
                    })
                  }
                />
              ) : result ? (
                <ResultView
                  save={save}
                  blocked={voiceBlocked}
                  onReplay={() => {
                    audio.unlock();
                    void audio
                      .play(assets.audio.find((v) => v.id === result.voiceId)!)
                      .then((ok) => setVoiceBlocked(!ok));
                  }}
                  onRetry={() => launch(result.topic, result.difficulty)}
                  onNext={() => {
                    if (result.topic === "G60") {
                      notify(
                        "全60文法の最後のステージです。好きな文法で復習を続けましょう。",
                      );
                      void commit((s) => {
                        s.result = null;
                      });
                    } else {
                      setTopic(
                        topics[
                          topics.findIndex((t) => t.id === result.topic) + 1
                        ].id,
                      );
                      void commit((s) => {
                        s.result = null;
                      });
                    }
                  }}
                  onHome={() => navigate("HOME")}
                />
              ) : (
                <section className="two-column grammar-screen">
                  <div className="panel grammar-panel">
                    <div className="section-heading">
                      <div>
                        <span className="eyebrow">CHOOSE YOUR CHAPTER</span>
                        <h2>文法を選ぼう</h2>
                      </div>
                      <label>
                        学年
                        <select
                          value={gradeFilter}
                          onChange={(e) =>
                            setGradeFilter(Number(e.target.value))
                          }
                        >
                          <option value={0}>すべて</option>
                          {[1, 2, 3].map((n) => (
                            <option key={n} value={n}>
                              {n}年
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <label className="check-label">
                      <input
                        type="checkbox"
                        checked={mistakesOnly}
                        onChange={(e) => setMistakesOnly(e.target.checked)}
                      />
                      間違えた問題のある文法
                    </label>
                    <div className="grammar-list scroll">
                      {topics
                        .filter(
                          (t) =>
                            (!gradeFilter || t.grade === gradeFilter) &&
                            (!mistakesOnly ||
                              t.questionIds.some((id) =>
                                save.mistakes.includes(id),
                              )),
                        )
                        .map((t) => (
                          <button
                            key={t.id}
                            className={`grammar-row ${topic === t.id ? "selected" : ""}`}
                            onClick={() => setTopic(t.id)}
                          >
                            <span className="chapter-no">
                              {String(t.number).padStart(2, "0")}
                            </span>
                            <span>
                              {t.title}
                              <small>
                                {t.number >= 57 ? "発展 / " : ""}
                                {t.grade}年 · 10問{" "}
                                {t.questionIds.some((id) =>
                                  save.mistakes.includes(id),
                                )
                                  ? " · 要復習"
                                  : ""}
                              </small>
                            </span>
                            <span className="mini-score">
                              {save.records[`${t.id}:${difficulty}`]?.best ??
                                "—"}
                            </span>
                          </button>
                        ))}
                      {mistakesOnly && !save.mistakes.length && (
                        <p className="empty">復習待ちの問題はありません。</p>
                      )}
                    </div>
                  </div>
                  <div className="panel difficulty-panel">
                    <span className="eyebrow">MAKE IT YOUR OWN</span>
                    <h2>{topics.find((t) => t.id === topic)!.title}</h2>
                    <p>{topics.find((t) => t.id === topic)!.explanation}</p>
                    <div className="difficulty-grid">
                      {difficulties.map((d, i) => (
                        <button
                          key={d}
                          aria-pressed={difficulty === d}
                          className={`difficulty ${difficulty === d ? "selected" : ""}`}
                          onClick={() => setDifficulty(d)}
                        >
                          <b>{d}</b>
                          <small>
                            {
                              [
                                "4択穴埋め",
                                "単語の並び替え",
                                "ダミー語つき",
                                "英文を入力",
                              ][i]
                            }
                          </small>
                          <span>{rates[d]} GP / 正解</span>
                        </button>
                      ))}
                    </div>
                    <div className="stage-record">
                      <span>
                        BEST {save.records[`${topic}:${difficulty}`]?.best ?? 0}{" "}
                        / 1000
                      </span>
                      <span>
                        {save.records[`${topic}:${difficulty}`]?.plays ?? 0}{" "}
                        PLAYS
                      </span>
                    </div>
                    <Button
                      kind="primary"
                      onClick={() => launch()}
                      disabled={busy}
                    >
                      START · 10 QUESTIONS <Icon name="play" />
                    </Button>
                  </div>
                </section>
              ))}
            {tab === "CARDS" && (
              <section className="collection">
                <div className="section-heading">
                  <div>
                    <span className="eyebrow">MOMENTS TO KEEP</span>
                    <h2>
                      MY COLLECTION{" "}
                      <small>
                        {Object.keys(save.cards).length} / {assets.cards.length}
                      </small>
                    </h2>
                  </div>
                  <div className="filters">
                    <select
                      aria-label="カードのメンバー"
                      value={cardMember}
                      onChange={(e) => setCardMember(e.target.value)}
                    >
                      <option value="all">全メンバー</option>
                      {members.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                    <select
                      aria-label="カードのレア度"
                      value={cardRarity}
                      onChange={(e) => setCardRarity(e.target.value)}
                    >
                      <option value="all">全ランク</option>
                      {["C", "B", "A", "S"].map((r) => (
                        <option key={r}>{r}</option>
                      ))}
                    </select>
                    <label className="check-label">
                      <input
                        type="checkbox"
                        checked={ownedOnly}
                        onChange={(e) => setOwnedOnly(e.target.checked)}
                      />
                      所持のみ
                    </label>
                  </div>
                </div>
                <div className="card-strip">
                  {cardList.map((c) => (
                    <CardFace
                      key={c.id}
                      card={c}
                      owned={!!save.cards[c.id]}
                      count={save.cards[c.id]}
                      onClick={() => setDetail(c)}
                    />
                  ))}
                  {!cardList.length && (
                    <div className="empty panel">
                      <p>まだこの条件のカードはありません。</p>
                      <Button onClick={() => navigate("GACHA")}>
                        ガチャへ
                      </Button>
                    </div>
                  )}
                </div>
                <p className="caption">
                  写真をタップして詳細へ。重複カードも大切に、所持枚数として記録されます。
                </p>
              </section>
            )}
            {tab === "GACHA" && (
              <section className="gacha-screen">
                {reveal ? (
                  <GachaReveal
                    animate={save.settings.motion}
                    ids={save.gacha}
                    onDone={() => setReveal(false)}
                    onDetail={setDetail}
                  />
                ) : (
                  <>
                    <div className="gacha-art">
                      <img
                        className="orbit"
                        src={ui("gacha/stage-orbit.svg")}
                        alt=""
                      />
                      <img
                        className="card-back"
                        src={ui("gacha/card-back.png")}
                        alt="ガチャのカード裏面"
                      />
                      <span className="eyebrow">A MOMENT, JUST FOR YOU</span>
                      <div className="gacha-secondary">
                        {save.gp < 300 && (
                          <Button onClick={() => navigate("PLAY")}>
                            GPをためにPLAYへ →
                          </Button>
                        )}
                        {save.gacha.length > 0 && (
                          <Button onClick={() => setReveal(true)}>
                            前回の結果を見る
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="panel gacha-controls">
                      <span className="eyebrow">STANDARD COLLECTION</span>
                      <h2>お気に入りの瞬間を。</h2>
                      <p>学んだ時間を、新しい一枚に。</p>
                      <div className="odds">
                        <span>
                          C <b>60%</b>
                        </span>
                        <span>
                          B <b>25%</b>
                        </span>
                        <span>
                          A <b>12%</b>
                        </span>
                        <span>
                          S <b>3%</b>
                        </span>
                      </div>
                      <Button
                        kind="gold"
                        onClick={() => drawCards(1)}
                        disabled={busy || save.gp < 300}
                      >
                        1回引く <span>300 GP</span>
                      </Button>
                      <Button
                        kind="gold"
                        onClick={() => drawCards(10)}
                        disabled={busy || save.gp < 2700}
                      >
                        10連を引く <span>2,700 GP</span>
                      </Button>
                      <small>
                        10連はAランク以上1枚確定。
                        <br />
                        保証枠はA:S＝80:20。重複は所持枚数に加算。
                      </small>
                    </div>
                  </>
                )}
              </section>
            )}
            {tab === "CHAT" && (
              <section className="chat-screen two-column">
                <div className="panel chat-sidebar">
                  <span className="eyebrow">LITTLE CONVERSATIONS</span>
                  <div className="chat-members">
                    {members.map((m) => (
                      <button
                        key={m.id}
                        aria-pressed={chatMember === m.id}
                        onClick={() => {
                          setChatMember(m.id);
                          setChatIndex(0);
                          setChatStep(0);
                        }}
                      >
                        <img src={url(memberPhoto(m.id).path)} alt="" />
                        <small>{m.short}</small>
                        <span>♡ {save.affection[m.id]}</span>
                      </button>
                    ))}
                  </div>
                  <div className="scroll chat-topics">
                    {chatTitles.map((title, i) => (
                      <button
                        className={chatIndex === i ? "selected" : ""}
                        key={i}
                        onClick={() => {
                          setChatIndex(i);
                          setChatStep(0);
                        }}
                      >
                        <span>
                          {thresholds[i] > save.affection[chatMember]
                            ? "🔒 "
                            : ""}
                          {title}
                        </span>
                        <small>
                          {thresholds[i] > save.affection[chatMember]
                            ? `♡ ${thresholds[i]}で解放`
                            : !!((save.chat[chatMember] ?? 0) & (1 << i))
                              ? "既読"
                              : "会話する"}
                        </small>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="panel chat-thread">
                  <div className="section-heading">
                    <h2>{members.find((m) => m.id === chatMember)!.name}</h2>
                    <small>♡ {save.affection[chatMember]}</small>
                  </div>
                  <p className="fiction">
                    ゲーム内の創作会話です。本人の発言・返信ではありません。
                  </p>
                  <div
                    className="scroll messages"
                    key={`${chatMember}:${chatIndex}`}
                  >
                    {unlocked ? (
                      <>
                        <div className="chat-date">{chatTitles[chatIndex]}</div>
                        {chats.slice(0, chatStep + 1).map((text, i) => (
                          <div className="bubble incoming" key={i}>
                            {text}
                          </div>
                        ))}
                        {chatStep >= chats.length && (
                          <>
                            <div className="bubble outgoing">
                              ありがとう。また練習してくるね。
                            </div>
                            <p className="chat-end">また、ここでひと休み。</p>
                          </>
                        )}
                      </>
                    ) : (
                      <div className="locked-chat">
                        <Icon name="lock" />
                        <h3>もう少し仲良くなろう</h3>
                        <p>
                          必要な好感度：{thresholds[chatIndex]}
                          <br />
                          現在：{save.affection[chatMember]}
                        </p>
                        <Button
                          onClick={() => {
                            setting({ member: chatMember });
                            navigate("PLAY");
                          }}
                        >
                          このメンバーとPLAY
                        </Button>
                      </div>
                    )}
                  </div>
                  {unlocked && chatStep < chats.length && (
                    <Button
                      kind="primary"
                      disabled={busy}
                      onClick={() => {
                        if (chatStep === chats.length - 1) {
                          void commit((s) => {
                            s.chat[chatMember] =
                              (s.chat[chatMember] ?? 0) | (1 << chatIndex);
                          }).then((s) => {
                            if (s) setChatStep((n) => n + 1);
                          });
                        } else setChatStep((n) => n + 1);
                      }}
                    >
                      {" "}
                      {chatStep === chats.length - 1
                        ? "ありがとう、と返信"
                        : "続きを読む"}{" "}
                      <Icon name="next" />
                    </Button>
                  )}
                </div>
              </section>
            )}
            {tab === "SETTINGS" && (
              <section className="settings-screen panel scroll">
                <div className="section-heading">
                  <div>
                    <span className="eyebrow">JUST THE WAY YOU LIKE IT</span>
                    <h2>SETTINGS</h2>
                  </div>
                  <Button onClick={() => setModal("help")}>
                    <Icon name="help" />
                    遊び方
                  </Button>
                </div>
                <div className="settings-grid">
                  <div>
                    <h3>サウンド・演出</h3>
                    {(["bgm", "sfx", "voice"] as const).map((k, i) => (
                      <label className="volume-row" key={k}>
                        <span>{["BGM", "効果音", "メンバー音声"][i]}</span>
                        <input
                          aria-label={
                            ["BGM音量", "効果音音量", "メンバー音声音量"][i]
                          }
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          value={save.settings[k]}
                          onChange={(e) =>
                            setting({ [k]: Number(e.target.value) })
                          }
                        />
                        <output>{Math.round(save.settings[k] * 100)}%</output>
                      </label>
                    ))}
                    <div className="setting-toggles">
                      <label>
                        <input
                          type="checkbox"
                          checked={save.settings.muted}
                          onChange={(e) => setting({ muted: e.target.checked })}
                        />
                        ミュート
                      </label>
                      <label>
                        <input
                          type="checkbox"
                          checked={save.settings.motion}
                          onChange={(e) =>
                            setting({ motion: e.target.checked })
                          }
                        />
                        アニメーション
                      </label>
                    </div>
                    <Button onClick={() => bgmRef.current?.click()}>
                      <Icon name="music" />
                      自分のBGMを追加
                    </Button>
                    <p className="caption">
                      BGMは未同梱。追加した音声はこの端末内に保存されます。
                    </p>
                    <h3>メンバー・壁紙</h3>
                    <div className="member-pills">
                      {members.map((m) => (
                        <button
                          key={m.id}
                          aria-pressed={me.id === m.id}
                          onClick={() => setting({ member: m.id })}
                        >
                          {m.short}
                        </button>
                      ))}
                    </div>
                    <Button onClick={() => setModal("wallpaper")}>
                      <Icon name="wallpaper" />
                      20枚から壁紙を選ぶ
                    </Button>
                  </div>
                  <div>
                    <h3>データを大切に</h3>
                    <div className="data-actions">
                      <Button onClick={exportFile}>
                        <Icon name="download" />
                        JSONバックアップ
                      </Button>
                      <Button onClick={() => fileRef.current?.click()}>
                        <Icon name="upload" />
                        JSONから復元
                      </Button>
                    </div>
                    <p className="caption">
                      自動保存はこのブラウザ内。端末の変更・データ消去前にはバックアップを。
                    </p>
                    <Button disabled={caching} onClick={() => void cacheAll()}>
                      <Icon name="save" />
                      {caching
                        ? `保存中 ${cacheProgress}`
                        : "写真・音声をオフライン保存"}
                    </Button>
                    <p className="caption">
                      約26MB。教材・アプリは自動保存、写真と音声は閲覧時に順次保存されます。全素材を保存すると未閲覧の素材もオフラインで利用できます。
                    </p>
                    <Button
                      kind="danger"
                      onClick={() =>
                        setConfirm({
                          title: "データを初期化",
                          body: "GP・カード・好感度・学習記録・設定をすべて削除します。先にJSONバックアップを保存してください。",
                          action: () => {
                            void replace(freshSave())
                              .then((s) => {
                                setSave(s);
                                setFatal("");
                                notify("ゲームデータを初期化しました。");
                              })
                              .catch((e) => notify(errorText(e)));
                          },
                        })
                      }
                    >
                      <Icon name="reset" />
                      ゲームデータを初期化
                    </Button>
                    <p className="caption">
                      iPhone：Safariの共有 →「ホーム画面に追加」。
                      <br />
                      非公式の個人用ファンゲームです。
                    </p>
                    {updateReady && (
                      <Button
                        onClick={() =>
                          setConfirm({
                            title: "アプリを更新",
                            body: "保存済みのデータを保持して再読み込みします。入力途中の未送信の回答は失われます。",
                            action: () => {
                              updateReady.postMessage("SKIP_WAITING");
                              navigator.serviceWorker.addEventListener(
                                "controllerchange",
                                () => location.reload(),
                                { once: true },
                              );
                            },
                          })
                        }
                      >
                        新しいバージョンを適用
                      </Button>
                    )}
                  </div>
                </div>
              </section>
            )}
          </main>
          <nav className="nav" aria-label="メインナビゲーション">
            {tabs.map((t) => (
              <button
                key={t}
                aria-current={tab === t ? "page" : undefined}
                onClick={() => {
                  audio.effect();
                  navigate(t);
                }}
              >
                <Icon name={t.toLowerCase()} />
                <span>{t}</span>
                {t === "CHAT" &&
                  members.some((m) =>
                    thresholds.some(
                      (v, i) =>
                        v <= save.affection[m.id] &&
                        !((save.chat[m.id] ?? 0) & (1 << i)),
                    ),
                  ) && <i className="notification" />}
              </button>
            ))}
          </nav>
        </>
      )}
      <input
        hidden
        type="file"
        accept="application/json,.json"
        ref={fileRef}
        onChange={(e) => {
          void importFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      <input
        hidden
        type="file"
        accept="audio/*"
        ref={bgmRef}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) {
            if (!f.type.startsWith("audio/") || f.size > 30_000_000)
              notify("30MB以下の音声ファイルを選んでください。");
            else
              void audio
                .setBgm(f)
                .then(() => notify("BGMを端末内に保存しました。"))
                .catch((err) => notify(errorText(err)));
          }
          e.target.value = "";
        }}
      />
      {modal === "wallpaper" && (
        <Modal title="WALLPAPER · 20の景色" onClose={() => setModal(null)}>
          <div className="wallpaper-grid">
            {[...assets.backgrounds]
              .sort((a, b) => a.id.localeCompare(b.id))
              .map((b) => (
                <button
                  key={b.id}
                  aria-pressed={save.settings.wallpaper === b.id}
                  onClick={() => setting({ wallpaper: b.id })}
                >
                  <img src={url(b.path)} alt={`壁紙 ${b.id}`} loading="lazy" />
                  <span>
                    {b.id} {save.settings.wallpaper === b.id ? "✓" : ""}
                  </span>
                </button>
              ))}
          </div>
        </Modal>
      )}
      {modal === "login" && (
        <Modal title="DAILY GIFT" onClose={() => setModal(null)}>
          <span className="eyebrow">A LITTLE GIFT FOR SHOWING UP</span>
          <h3>今日も会えてうれしい。</h3>
          <div className="login-days">
            {loginRewards.map((gp, i) => {
              const current =
                save.login.last === localDate()
                  ? (save.login.days - 1) % 7
                  : save.login.days % 7;
              return (
                <div
                  key={i}
                  className={`login-day ${i === current ? "today" : ""}`}
                >
                  <small>DAY {i + 1}</small>
                  <Icon name={i === 6 ? "gift" : "gp"} />
                  <b>{gp} GP</b>
                  <small>
                    {i === current
                      ? save.login.last >= localDate()
                        ? "受領済み"
                        : "TODAY"
                      : i < current
                        ? "✓"
                        : "GIFT"}
                  </small>
                </div>
              );
            })}
          </div>
          <p>1日1回、7日でひと巡り。連続ログインでなくても続きから。</p>
          <Button
            kind="gold"
            disabled={busy || localDate() <= save.login.last}
            onClick={() =>
              void commit((s) => {
                claimLogin(s);
              }).then((s) => {
                if (s) {
                  audio.effect("correct");
                  notify("ログインボーナスを受け取りました。");
                }
              })
            }
          >
            {localDate() <= save.login.last
              ? "本日は受領済み"
              : "今日のGPを受け取る"}
          </Button>
          <Button onClick={() => setModal(null)}>CLOSE</Button>
        </Modal>
      )}
      {modal === "help" && (
        <Modal title="Mrs.English の遊び方" onClose={() => setModal(null)}>
          <div className="help-grid">
            <div>
              <h3>01 · LEARN</h3>
              <p>
                PLAYで60文法から選択。1回10問、時間制限はありません。間違えたら解説を読み、NEXTで進みます。
              </p>
              <p>
                EASYは4択、NORMALは並び替え、HARDはダミー語あり、MASTERは英文入力。大小文字・末尾句読点・余分な空白は採点に影響しません。
              </p>
              <h3>02 · COLLECT</h3>
              <p>
                正解100点。GPは正解ごとに10 / 15 / 20 /
                30。何度でも獲得できます。300GPで1回、2,700GPで10連（A以上1枚保証）。
              </p>
            </div>
            <div>
              <h3>03 · CONNECT</h3>
              <p>
                選んだメンバーに正解ごと好感度+1。全問正解は追加+5。好感度0 / 20
                / 50 / 100 / 200で創作会話が解放されます。
              </p>
              <h3>04 · KEEP IT SAFE</h3>
              <p>
                自動保存に加え、SETTINGSからJSONバックアップを。オフラインで全素材を使うには写真・音声の保存を実行してください。
              </p>
              <p>
                写真・音声を含む公開配信は行っていません。実在のメンバー本人からのメッセージではありません。
              </p>
            </div>
          </div>
        </Modal>
      )}
      {detail && (
        <Modal title="CARD DETAILS" onClose={() => setDetail(null)}>
          <div className="card-detail">
            <CardFace card={detail} owned={!!save.cards[detail.id]} />
            <div>
              <span className={`rarity-text rank-${detail.rarity}`}>
                {detail.rarity} RANK
              </span>
              <h2>{members.find((m) => m.id === detail.member)?.name}</h2>
              <p>{detail.category}</p>
              <p>{detail.id}</p>
              <h3>
                {save.cards[detail.id]
                  ? `所持 ${save.cards[detail.id]}枚 · 重複 ${save.cards[detail.id] - 1}枚`
                  : "未所持"}
              </h3>
              <p className="caption">写真は縦横比を保って表示しています。</p>
              <div className="actions">
                <Button
                  onClick={() =>
                    setDetail(
                      assets.cards[
                        (assets.cards.indexOf(detail) +
                          assets.cards.length -
                          1) %
                          assets.cards.length
                      ],
                    )
                  }
                >
                  ← 前
                </Button>
                <Button
                  onClick={() =>
                    setDetail(
                      assets.cards[
                        (assets.cards.indexOf(detail) + 1) % assets.cards.length
                      ],
                    )
                  }
                >
                  次 →
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}
      {confirm && (
        <Modal title={confirm.title} onClose={() => setConfirm(null)}>
          <p>{confirm.body}</p>
          <div className="actions">
            <Button onClick={() => setConfirm(null)}>キャンセル</Button>
            <Button
              kind="primary"
              onClick={() => {
                const action = confirm.action;
                setConfirm(null);
                action();
              }}
            >
              実行する
            </Button>
          </div>
        </Modal>
      )}
      {notice && (
        <div className="toast" role="status">
          {notice}
          <button aria-label="通知を閉じる" onClick={() => setNotice("")}>
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
  );
}
function Play({
  save,
  busy,
  commit,
  notify,
  onExit,
  onChoose,
}: {
  save: Save;
  busy: boolean;
  commit: (fn: (s: Save) => void) => Promise<Save | null>;
  notify: (s: string) => void;
  onExit: () => void;
  onChoose: () => void;
}) {
  const s = save.session!,
    topic = topics.find((t) => t.id === s.topic)!,
    q = byQuestion[topic.questionIds[s.step]],
    answered = s.answers[s.step];
  const [selected, setSelected] = useState<{ id: string; text: string }[]>([]),
    [typed, setTyped] = useState(""),
    [choice, setChoice] = useState("");
  const easy = useMemo(() => easyQuestion(q.id), [q.id]),
    tiles = useMemo(() => bank(q.id, s.difficulty), [q.id, s.difficulty]);
  const submit = () => {
    audio.unlock();
    const text =
      s.difficulty === "MASTER"
        ? typed
        : s.difficulty === "EASY"
          ? q.english.slice(0, importEasyStart(q.id)) +
            choice +
            q.english.slice(importEasyStart(q.id) + easy.answer.length)
          : sentence(selected);
    void commit((next) => {
      answerQuestion(next, s.id, s.step, text);
    }).then((next) => {
      if (next)
        audio.effect(
          next.session?.answers[s.step]?.correct ? "correct" : "incorrect",
        );
    });
  };
  const next = () => {
    audio.unlock();
    void commit((next) => {
      const p = next.session;
      if (
        !p ||
        p.id !== s.id ||
        p.step !== s.step ||
        p.answers.length !== s.step + 1
      )
        return;
      p.step++;
      if (p.step === 10) finish(next, s.id);
    });
  };
  return (
    <section className="play-screen">
      <div className="play-meta">
        <Button onClick={onExit} aria-label="プレイを中断">
          <Icon name="back" />
        </Button>
        <div>
          <span className="eyebrow">
            CHAPTER {topic.number.toString().padStart(2, "0")} · {s.difficulty}
          </span>
          <b>{topic.title}</b>
        </div>
        <progress value={s.step} max={10} />
        <span>
          {s.step + 1}
          <small> / 10</small>
        </span>
        <Button onClick={onChoose} kind="choose-stage">
          文法一覧
        </Button>
      </div>
      <div className="question panel">
        <span className="eyebrow">
          {s.difficulty === "EASY"
            ? "和訳に合う語を選ぼう"
            : s.difficulty === "MASTER"
              ? "日本語を英語にしよう"
              : "日本語に合う英文を組み立てよう"}
        </span>
        <h2>{q.japanese}</h2>
        {s.difficulty === "EASY" && (
          <p className="english-prompt">
            {easy.before}
            <span className="blank">{choice || "　　　"}</span>
            {easy.after}
          </p>
        )}
      </div>
      {s.difficulty === "MASTER" ? (
        <form
          className="master-answer"
          onSubmit={(e) => {
            e.preventDefault();
            if (typed.trim() && !busy && !answered) submit();
          }}
        >
          <textarea
            aria-label="英文を入力"
            autoCapitalize="sentences"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            placeholder="Type your answer in English…"
            value={typed}
            maxLength={1000}
            onChange={(e) => setTyped(e.target.value)}
          />
          <Button
            kind="primary"
            type="submit"
            disabled={busy || !typed.trim() || !!answered}
          >
            CHECK <Icon name="check" />
          </Button>
        </form>
      ) : s.difficulty === "EASY" ? (
        <div className="easy-options">
          {easy.options.map((o) => (
            <button
              key={o}
              className={choice === o ? "selected" : ""}
              disabled={busy || !!answered}
              onClick={() => setChoice(o)}
            >
              {o}
            </button>
          ))}
          <Button
            kind="primary"
            disabled={busy || !choice || !!answered}
            onClick={submit}
          >
            CHECK <Icon name="check" />
          </Button>
        </div>
      ) : (
        <>
          <div className="answer-bank panel" aria-label="組み立てた英文">
            {selected.length ? (
              selected.map((t) => (
                <button
                  key={t.id}
                  onClick={() =>
                    setSelected((p) => p.filter((v) => v.id !== t.id))
                  }
                  disabled={!!answered}
                  aria-label={`${t.text} を戻す`}
                >
                  {t.text}
                </button>
              ))
            ) : (
              <span>単語をタップして、ここに並べよう</span>
            )}
          </div>
          <div className="tile-row">
            <div className="tiles" aria-label="単語一覧">
              {tiles
                .filter((t) => !selected.some((v) => v.id === t.id))
                .map((t) => (
                  <button
                    key={t.id}
                    disabled={!!answered}
                    onClick={() => setSelected((p) => [...p, t])}
                  >
                    {t.text}
                  </button>
                ))}
            </div>
            <div className="check-actions">
              <Button
                disabled={!selected.length || !!answered}
                onClick={() => setSelected([])}
              >
                CLEAR
              </Button>
              <Button
                kind="primary"
                disabled={busy || !selected.length || !!answered}
                onClick={submit}
              >
                CHECK <Icon name="check" />
              </Button>
            </div>
          </div>
        </>
      )}
      {s.difficulty === "HARD" && !answered && (
        <small className="play-hint">
          使わない単語が3つあります。余った単語はそのままでOK。
        </small>
      )}
      {answered && (
        <Modal
          title={answered.correct ? "✓ CORRECT!" : "✕ もう一度、覚えよう"}
          locked
          onClose={() => {}}
        >
          <div
            className={`feedback ${answered.correct ? "correct" : "incorrect"}`}
          >
            <p className="eyebrow">
              {answered.correct ? "よくできました" : "正解と解説を確認しよう"}
            </p>
            <h2 lang="en">{q.english}</h2>
            <p>{q.translation}</p>
            {!answered.correct && (
              <p className="your-answer">
                あなたの回答：{answered.answer || "（未入力）"}
              </p>
            )}
            <div className="explanation">
              <strong>GRAMMAR NOTE</strong>
              <p>{q.grammarExplanation}</p>
            </div>
          </div>
          <div className="feedback-actions">
            {"speechSynthesis" in window && (
              <Button
                onClick={() => {
                  audio.unlock();
                  audio.speak(q.english);
                }}
              >
                <Icon name="volume" />
                英文を聴く
              </Button>
            )}
            <Button kind="primary" disabled={busy} onClick={next}>
              {s.step === 9 ? "RESULT" : "NEXT"} <Icon name="next" />
            </Button>
          </div>
        </Modal>
      )}
    </section>
  );
}
// The blank's location is explicit in the reviewed mode data, never inferred at runtime.
import { modes } from "./data";
function importEasyStart(id: string) {
  return modes[id].easy.start;
}
function CountUp({
  value,
  animate = true,
}: {
  value: number;
  animate?: boolean;
}) {
  const [n, setN] = useState(value);
  useEffect(() => {
    if (!animate || matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setN(value);
      return;
    }
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 800);
      setN(Math.round(value * (1 - (1 - t) ** 3)));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, animate]);
  return <>{n.toLocaleString()}</>;
}
function ResultView({
  save,
  blocked,
  onReplay,
  onRetry,
  onNext,
  onHome,
}: {
  save: Save;
  blocked: boolean;
  onReplay: () => void;
  onRetry: () => void;
  onNext: () => void;
  onHome: () => void;
}) {
  const r = save.result!,
    voice = assets.audio.find((v) => v.id === r.voiceId)!,
    photo = assets.cards.find((c) => c.id === voice.resultPhotoCardId),
    rank = grade(r.correct);
  return (
    <section className="result-screen">
      <div className="result-photo">
        <div className="result-portrait">
          {photo ? (
            <CardFace card={photo} />
          ) : (
            <img
              className="group-photo"
              src={url(
                assets.backgrounds.find(
                  (b) => b.id === save.settings.wallpaper,
                )!.path,
              )}
              alt="集合壁紙"
            />
          )}
        </div>
        <div className="voice-controls">
          <Button onClick={onReplay}>
            <Icon name="volume" />{" "}
            {blocked ? "タップして音声を再生" : `もう一度聴く · ${voice.label}`}
          </Button>
          <Button kind="stop-voice" onClick={() => audio.stop()}>
            停止
          </Button>
        </div>
      </div>
      <div className="panel result-info">
        <div className="section-heading">
          <div>
            <span className="eyebrow">CHAPTER COMPLETE · {r.difficulty}</span>
            <h2>積み重ねた、一歩。</h2>
          </div>
          <div
            className={`rank-emblem rank-${rank}`}
            style={{
              backgroundImage: `url(${ui(`result/rank-${rank.toLowerCase()}-emblem.png`)})`,
            }}
          >
            {rank}
          </div>
        </div>
        <div className="result-score">
          <strong>
            <CountUp value={r.correct * 100} animate={save.settings.motion} />
          </strong>
          <span>
            / 1,000 SCORE <b>{r.correct} / 10 正解</b>
          </span>
        </div>
        <div className="rewards">
          <div>
            <Icon name="gp" />
            <span>
              GP
              <big>
                +<CountUp value={r.gp} animate={save.settings.motion} />
              </big>
            </span>
          </div>
          <div>
            <Icon name="heart" />
            <span>
              {members.find((m) => m.id === r.member)?.short}
              <big>
                +<CountUp value={r.affection} animate={save.settings.motion} />
              </big>
            </span>
          </div>
          <div>
            <small>BEST SCORE</small>
            <b>{save.records[`${r.topic}:${r.difficulty}`]?.best ?? 0}</b>
          </div>
        </div>
        <progress value={Math.min(save.affection[r.member], 200)} max={200} />
        <div className="actions">
          <Button onClick={onRetry}>RETRY</Button>
          <Button kind="primary" onClick={onNext}>
            {r.topic === "G60" ? "60文法を振り返る" : "NEXT CHAPTER"}
          </Button>
          <Button onClick={onHome}>HOME</Button>
        </div>
      </div>
    </section>
  );
}
function GachaReveal({
  ids,
  onDone,
  onDetail,
  animate,
}: {
  ids: string[];
  animate: boolean;
  onDone: () => void;
  onDetail: (c: Card) => void;
}) {
  const rank = ids.some(
    (id) => assets.cards.find((c) => c.id === id)?.rarity === "S",
  )
    ? "S"
    : ids.some((id) => assets.cards.find((c) => c.id === id)?.rarity === "A")
      ? "A"
      : "C";
  const [done, setDone] = useState(false);
  useEffect(() => {
    const timer = setTimeout(
      () => setDone(true),
      !animate || matchMedia("(prefers-reduced-motion: reduce)").matches
        ? 120
        : rank === "S"
          ? 2200
          : rank === "A"
            ? 1500
            : 900,
    );
    return () => clearTimeout(timer);
  }, [rank, animate]);
  return (
    <div className={`gacha-reveal reveal-${rank} ${done ? "done" : ""}`}>
      <div className="section-heading">
        <div>
          <span className="eyebrow">YOUR NEW MOMENTS</span>
          <h2>{done ? "COLLECTION UPDATED" : "A SPECIAL MOMENT…"}</h2>
        </div>
        <Button onClick={() => (done ? onDone() : setDone(true))}>
          {done ? "ガチャに戻る" : "SKIP"}
        </Button>
      </div>
      {!done ? (
        <div className="reveal-stage">
          <img
            className="reveal-light"
            src={ui(
              rank === "S"
                ? "gacha/reveal-s-ring.png"
                : rank === "A"
                  ? "gacha/reveal-a.png"
                  : "gacha/reveal-normal.png",
            )}
            alt=""
          />
          <img
            className="flipping-card"
            src={ui("gacha/card-back.png")}
            alt="カードを開封中"
          />
        </div>
      ) : (
        <div className="card-strip">
          {ids.map((id, i) => (
            <CardFace
              key={`${id}:${i}`}
              card={assets.cards.find((c) => c.id === id)!}
              onClick={() => onDetail(assets.cards.find((c) => c.id === id)!)}
            />
          ))}
        </div>
      )}
      <p className="caption">
        結果とGPは演出前に保存済み。スキップしても抽選結果は変わりません。
      </p>
    </div>
  );
}
