import { useEffect, useMemo, useRef, useState } from "react";
import {
  byQuestion,
  topics,
  difficulties,
  rates,
  members,
  assets,
  modes,
  ui,
  url,
  memberPhoto,
  type Difficulty,
} from "../data";
import {
  answerQuestion,
  bank,
  easyQuestion,
  finish,
  grade,
  sentence,
} from "../game";
import { verifiedResultVoice } from "../voices";
import { audio } from "../audio";
import { Button, Icon, Modal, Sparkles } from "../components/UI";
import type { ScreenProps } from "./types";
export function Grammar({
  save,
  busy,
  topic,
  difficulty,
  setTopic,
  setDifficulty,
  onStart,
}: ScreenProps & {
  topic: string;
  difficulty: Difficulty;
  setTopic: (id: string) => void;
  setDifficulty: (d: Difficulty) => void;
  onStart: () => void;
}) {
  const [filter, setFilter] = useState(0),
    [review, setReview] = useState(false);
  const chosen = topics.find((t) => t.id === topic)!;
  return (
    <section className="grammar-screen">
      <div className="grammar-catalog">
        <header className="section-heading">
          <div>
            <span className="eyebrow">EXPLORE YOUR UNIVERSE</span>
            <h2>文法を選ぼう</h2>
          </div>
          <label>
            学年
            <select
              aria-label="学年"
              value={filter}
              onChange={(e) => setFilter(Number(e.target.value))}
            >
              <option value={0}>すべて</option>
              {[1, 2, 3].map((n) => (
                <option key={n} value={n}>
                  {n}年
                </option>
              ))}
            </select>
          </label>
        </header>
        <label className="check-label">
          <input
            type="checkbox"
            checked={review}
            onChange={(e) => setReview(e.target.checked)}
          />
          間違えた問題のある文法
        </label>
        <div className="grammar-list scroll">
          {topics
            .filter(
              (t) =>
                (!filter || t.grade === filter) &&
                (!review ||
                  t.questionIds.some((id) => save.mistakes.includes(id))),
            )
            .map((t) => {
              const record = save.records[`${t.id}:${difficulty}`];
              return (
                <button
                  key={t.id}
                  className={`grammar-row ${topic === t.id ? "selected" : ""}`}
                  aria-selected={topic === t.id}
                  onClick={() => setTopic(t.id)}
                >
                  <strong>{String(t.number).padStart(2, "0")}</strong>
                  <span>
                    {t.title}
                    <small>
                      {t.grade}年{t.number >= 57 ? " · 発展" : ""} · 10問{" "}
                      {t.questionIds.some((id) => save.mistakes.includes(id))
                        ? " · 要復習"
                        : ""}
                    </small>
                  </span>
                  <span className="row-score">
                    {record ? (
                      <>
                        {record.best}
                        <small>{record.plays} PLAY</small>
                      </>
                    ) : (
                      "—"
                    )}
                  </span>
                </button>
              );
            })}
          {review && !save.mistakes.length && (
            <p className="empty">復習待ちの問題はありません。</p>
          )}
        </div>
      </div>
      <div className="difficulty-panel">
        <span className="eyebrow">
          CHAPTER {String(chosen.number).padStart(2, "0")}
        </span>
        <h2>{chosen.title}</h2>
        <p className="grammar-description">{chosen.explanation}</p>
        <div className="difficulty-grid">
          {difficulties.map((d, i) => (
            <button
              key={d}
              className={`difficulty ${d.toLowerCase()}`}
              aria-pressed={difficulty === d}
              onClick={() => setDifficulty(d)}
            >
              <b>{d}</b>
              <span>
                {
                  ["4択穴埋め", "単語の並び替え", "ダミー語つき", "英文を入力"][
                    i
                  ]
                }
              </span>
              <small>{rates[d]} GP / 正解</small>
            </button>
          ))}
        </div>
        <div className="stage-record">
          <span>
            BEST {save.records[`${topic}:${difficulty}`]?.best ?? 0} / 1000
          </span>
          <span>
            {save.records[`${topic}:${difficulty}`]?.plays ?? 0} PLAYS
          </span>
        </div>
        <Button className="start" disabled={busy} onClick={onStart}>
          START · 10 QUESTIONS
          <Icon name="play" />
        </Button>
      </div>
    </section>
  );
}
export function GameIntro({
  motion,
  onDone,
}: {
  motion: boolean;
  onDone: () => void;
}) {
  const done = useRef(onDone);
  done.current = onDone;
  useEffect(() => {
    const reduced =
      !motion || matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = setTimeout(() => done.current(), reduced ? 100 : 950);
    return () => clearTimeout(timer);
  }, [motion]);
  return (
    <section className="game-intro" aria-label="ゲーム開始演出">
      <Sparkles count={16} />
      <div className="intro-ready">READY</div>
      <div className="intro-start">START!</div>
      <span className="intro-line" />
    </section>
  );
}
export function Play({
  save,
  busy,
  commit,
  onExit,
  onChoose,
  onEntry,
}: ScreenProps & {
  onExit: () => void;
  onChoose: () => void;
  onEntry: (value: boolean) => void;
}) {
  const session = save.session!,
    topic = topics.find((t) => t.id === session.topic)!,
    q = byQuestion[topic.questionIds[session.step]],
    answered = session.answers[session.step];
  const [selected, setSelected] = useState<{ id: string; text: string }[]>([]),
    [typed, setTyped] = useState(""),
    [choice, setChoice] = useState("");
  const easy = useMemo(() => easyQuestion(q.id), [q.id]),
    tiles = useMemo(
      () => bank(q.id, session.difficulty),
      [q.id, session.difficulty],
    );
  const submit = () => {
    audio.unlock();
    const text =
      session.difficulty === "MASTER"
        ? typed
        : session.difficulty === "EASY"
          ? easy.before + choice + easy.after
          : sentence(selected);
    (document.activeElement as HTMLElement)?.blur();
    onEntry(false);
    void commit((s) => {
      answerQuestion(s, session.id, session.step, text);
    }).then((s) => {
      if (s)
        audio.effect(
          s.session?.answers[session.step]?.correct ? "correct" : "incorrect",
        );
    });
  };
  const next = () => {
    audio.stop();
    audio.unlock();
    void commit((s) => {
      const p = s.session;
      if (
        !p ||
        p.id !== session.id ||
        p.step !== session.step ||
        p.answers.length !== p.step + 1
      )
        return;
      p.step++;
      if (p.step === 10) finish(s, p.id);
    });
  };
  return (
    <section className={`play-screen mode-${session.difficulty.toLowerCase()}`}>
      <header className="play-meta">
        <Button
          className="icon-button"
          kind="secondary"
          onClick={onExit}
          aria-label="プレイを中断"
        >
          <Icon name="back" />
        </Button>
        <div>
          <span className="eyebrow">
            CHAPTER {String(topic.number).padStart(2, "0")} ·{" "}
            {session.difficulty}
          </span>
          <b>{topic.title}</b>
        </div>
        <progress value={session.step} max={10} />
        <span className="question-number">
          {session.step + 1}
          <small> / 10</small>
        </span>
        <Button kind="secondary" onClick={onChoose}>
          文法一覧
        </Button>
      </header>
      <div className="play-photo-space" aria-hidden="true" />
      <div className="question">
        <span className="eyebrow">
          {session.difficulty === "EASY"
            ? "和訳に合う語を選ぼう"
            : session.difficulty === "MASTER"
              ? "日本語を英語にしよう"
              : "日本語に合う英文を組み立てよう"}
        </span>
        <h2>{q.japanese}</h2>
        {session.difficulty === "EASY" && (
          <p className="english-prompt">
            {easy.before}
            <span className="blank">{choice || "　　　"}</span>
            {easy.after}
          </p>
        )}
      </div>
      {session.difficulty === "EASY" ? (
        <div className="easy-options">
          {easy.options.map((o, i) => (
            <button
              className={`word-tile word-${["mint", "blue", "violet", "gold"][i]} ${choice === o ? "selected" : ""}`}
              aria-pressed={choice === o}
              key={o}
              disabled={!!answered || busy}
              onClick={() => setChoice(o)}
            >
              {o}
            </button>
          ))}
          <Button
            className="check"
            disabled={busy || !choice || !!answered}
            onClick={submit}
          >
            CHECK
            <Icon name="check" />
          </Button>
        </div>
      ) : session.difficulty === "MASTER" ? (
        <form
          className="master-answer"
          onSubmit={(e) => {
            e.preventDefault();
            if (typed.trim() && !answered && !busy) submit();
          }}
        >
          <textarea
            aria-label="英文を入力"
            placeholder="Type your answer in English…"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            maxLength={1000}
            value={typed}
            onFocus={() => onEntry(true)}
            onChange={(e) => setTyped(e.target.value)}
          />
          <Button
            className="check"
            type="submit"
            disabled={busy || !typed.trim() || !!answered}
          >
            CHECK
            <Icon name="check" />
          </Button>
        </form>
      ) : (
        <>
          <div className="answer-bank" aria-label="組み立てた英文">
            {selected.length ? (
              selected.map((t) => (
                <button
                  className="word-tile word-mint"
                  key={t.id}
                  disabled={!!answered}
                  aria-label={`${t.text} を戻す`}
                  onClick={() =>
                    setSelected((p) => p.filter((v) => v.id !== t.id))
                  }
                >
                  {t.text}
                </button>
              ))
            ) : (
              <span>単語をタップして、ここに並べよう</span>
            )}
          </div>
          <div className="tile-row">
            <div className="tiles scroll" aria-label="単語一覧">
              {tiles
                .filter((t) => !selected.some((v) => v.id === t.id))
                .map((t, i) => (
                  <button
                    key={t.id}
                    className={`word-tile word-${["blue", "mint", "rose", "violet", "gold"][i % 5]}`}
                    disabled={!!answered}
                    onClick={() => setSelected((p) => [...p, t])}
                  >
                    {t.text}
                  </button>
                ))}
            </div>
            <div className="check-actions">
              <Button
                kind="secondary"
                disabled={!selected.length || !!answered}
                onClick={() => setSelected([])}
              >
                CLEAR
              </Button>
              <Button
                className="check"
                disabled={busy || !selected.length || !!answered}
                onClick={submit}
              >
                CHECK
                <Icon name="check" />
              </Button>
            </div>
          </div>
        </>
      )}
      {session.difficulty === "HARD" && !answered && (
        <small className="play-hint">使わない単語が3つあります。</small>
      )}
      {answered && (
        <Modal
          title={answered.correct ? "✓ CORRECT!" : "✕ もう一度、覚えよう"}
          locked
          onClose={() => {}}
          className="feedback-sheet"
        >
          <div
            className={`feedback ${answered.correct ? "correct" : "incorrect"}`}
          >
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
            {answered.correct && (
              <img
                className="correct-sweep"
                src={ui("effects/correct-sweep.png")}
                alt=""
              />
            )}
          </div>
          <div className="feedback-actions">
            {"speechSynthesis" in window && (
              <Button kind="secondary" onClick={() => audio.speak(q.english)}>
                <Icon name="volume" />
                英文を聴く
              </Button>
            )}
            <Button className="next" disabled={busy} onClick={next}>
              {session.step === 9 ? "RESULT" : "NEXT"}
              <Icon name="next" />
            </Button>
          </div>
        </Modal>
      )}
    </section>
  );
}
function affectionLevel(value: number) {
  const thresholds = [0, 20, 50, 100, 200];
  let lower = 0,
    upper = 20,
    level = 1;
  for (let i = 1; i < thresholds.length; i++) {
    if (value < thresholds[i]) {
      lower = thresholds[i - 1];
      upper = thresholds[i];
      level = i;
      return { lower, upper, level, fill: (value - lower) / (upper - lower) };
    }
  }
  lower = 200 + Math.floor((value - 200) / 100) * 100;
  upper = lower + 100;
  level = 5 + Math.floor((value - 200) / 100);
  return { lower, upper, level, fill: (value - lower) / 100 };
}
export function ResultScreen({
  save,
  onRetry,
  onNext,
  onHome,
}: ScreenProps & {
  onRetry: () => void;
  onNext: () => void;
  onHome: () => void;
}) {
  const r = save.result!,
    rank = grade(r.correct),
    valid = verifiedResultVoice(r.member, rank, r.voiceId);
  const photo =
    (valid &&
      assets.cards.find(
        (c) => c.id === r.photoCardId && c.member === r.member,
      )) ||
    memberPhoto(r.member);
  const motion =
    save.settings.motion &&
    !matchMedia("(prefers-reduced-motion: reduce)").matches;
  const [progress, setProgress] = useState(motion ? 0 : 1);
  useEffect(() => {
    if (!motion) {
      setProgress(1);
      return;
    }
    let raf = 0;
    const start = performance.now() + 300;
    const tick = (now: number) => {
      const t = Math.max(0, Math.min(1, (now - start) / 1000));
      setProgress(1 - (1 - t) ** 3);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [r.id, motion]);
  const before = Math.max(0, save.affection[r.member] - r.affection),
    current = before + Math.round(r.affection * progress),
    level = affectionLevel(current),
    beforeLevel = affectionLevel(before),
    score = Math.round(r.correct * 100 * progress);
  return (
    <section className={`result-screen result-${rank}`}>
      <div className="result-photo">
        <img
          className="hero-photo"
          src={url(photo.path)}
          alt={members.find((m) => m.id === r.member)?.name}
          style={{ objectPosition: photo.objectPosition }}
        />
        <img className="photo-leaf" src={ui("common/leaf-corner.png")} alt="" />
      </div>
      <div className="result-info">
        <div className="result-heading">
          <div>
            <span className="eyebrow">CHAPTER {r.topic.slice(1)} COMPLETE</span>
            <h2>LESSON CLEAR</h2>
          </div>
          <div
            className={`rank-emblem rank-${rank}`}
            style={{
              backgroundImage: `url(${ui(`result/rank-${rank.toLowerCase()}-emblem.png`)})`,
            }}
          >
            {rank}
            <Sparkles
              count={
                rank === "S" ? 24 : rank === "A" ? 16 : rank === "B" ? 10 : 6
              }
            />
          </div>
        </div>
        <div className="result-score">
          <strong>{score.toLocaleString()}</strong>
          <span>
            / 1,000 SCORE<b>{r.correct} / 10 正解</b>
          </span>
          <span className="result-gp">
            <Icon name="gp" />
            <strong>+{Math.round(r.gp * progress)}</strong>
            <small>GP</small>
          </span>
        </div>
        <div className="affection-reward">
          <div
            className={`heart ${level.level > beforeLevel.level ? "full" : ""}`}
            style={{ "--progress": level.fill } as React.CSSProperties}
          >
            <div className="heart-mask">
              <div className="heart-liquid" />
            </div>
            <img
              className="heart-glass"
              src={ui("result/heart-glass.png")}
              alt="好感度"
            />
            <span>+{Math.round(r.affection * progress)}</span>
            <Sparkles hearts count={6} />
          </div>
          <div>
            <span className="eyebrow">
              {members.find((m) => m.id === r.member)?.short} · AFFECTION
            </span>
            <h3>
              ♡ {current} <small>LEVEL {level.level}</small>
            </h3>
            <progress value={level.fill} max={1} />
            <small>
              次のステップまで {level.upper - current} · BEST{" "}
              {save.records[`${r.topic}:${r.difficulty}`]?.best ??
                r.correct * 100}
            </small>
          </div>
        </div>
        <div className="result-actions">
          <Button kind="secondary" onClick={onRetry}>
            RETRY
          </Button>
          <Button className="next" onClick={onNext}>
            {r.topic === "G60" ? "60文法を振り返る" : "NEXT CHAPTER"}
          </Button>
          <Button kind="secondary" onClick={onHome}>
            HOME
          </Button>
        </div>
      </div>
    </section>
  );
}
