import { useEffect, useRef, useState } from "react";
import { assets, members, ui, type Card } from "../data";
import { audio } from "../audio";
import {
  Button,
  CardFace,
  CardDetails,
  Icon,
  Sparkles,
} from "../components/UI";
import type { ScreenProps } from "./types";
export function CardsScreen({
  save,
  onDetail,
}: ScreenProps & { onDetail: (c: Card) => void }) {
  const [member, setMember] = useState("all"),
    [rarity, setRarity] = useState("all"),
    [owned, setOwned] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const cards = assets.cards.filter(
    (c) =>
      (member === "all" || member === c.member) &&
      (rarity === "all" || rarity === c.rarity) &&
      (!owned || save.cards[c.id]),
  );
  return (
    <section className="collection">
      <header className="collection-toolbar">
        <h2>
          MY CARDS{" "}
          <small>
            {Object.keys(save.cards).length} / {assets.cards.length}
          </small>
        </h2>
        <div className="filters">
          <select
            aria-label="カードのメンバー"
            value={member}
            onChange={(e) => {
              setMember(e.target.value);
              ref.current?.scrollTo({ left: 0 });
            }}
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
            value={rarity}
            onChange={(e) => {
              setRarity(e.target.value);
              ref.current?.scrollTo({ left: 0 });
            }}
          >
            <option value="all">全ランク</option>
            {["C", "B", "A", "S"].map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
          <label className="check-label">
            <input
              type="checkbox"
              checked={owned}
              onChange={(e) => setOwned(e.target.checked)}
            />
            所持のみ
          </label>
        </div>
      </header>
      <div className="collection-gallery">
        <Button
          className="gallery-arrow prev"
          kind="secondary"
          aria-label="前のカードページ"
          onClick={() =>
            ref.current?.scrollBy({
              left: -ref.current.clientWidth,
              behavior: "smooth",
            })
          }
        >
          ‹
        </Button>
        <div className="card-pages scroll" ref={ref}>
          {Array.from({ length: Math.ceil(cards.length / 10) }, (_, p) => (
            <div className="card-page" key={p}>
              {cards.slice(p * 10, p * 10 + 10).map((c) => (
                <CardFace
                  card={c}
                  key={c.id}
                  owned={!!save.cards[c.id]}
                  count={save.cards[c.id]}
                  onClick={() => onDetail(c)}
                />
              ))}
            </div>
          ))}
          {!cards.length && (
            <div className="empty">
              <Icon name="cards" />
              <p>この条件のカードはまだありません。</p>
            </div>
          )}
        </div>
        <Button
          className="gallery-arrow next-page"
          kind="secondary"
          aria-label="次のカードページ"
          onClick={() =>
            ref.current?.scrollBy({
              left: ref.current.clientWidth,
              behavior: "smooth",
            })
          }
        >
          ›
        </Button>
      </div>
      <p className="gallery-caption">
        左右にスワイプ · カードをタップして大きく見る
      </p>
    </section>
  );
}
export function GachaScreen({
  save,
  busy,
  onDraw,
  onPlay,
  onLast,
}: ScreenProps & {
  onDraw: (n: 1 | 10) => void;
  onPlay: () => void;
  onLast: () => void;
}) {
  return (
    <section className="gacha-screen">
      <div className="gacha-copy">
        <span className="eyebrow">COLLECT YOUR SPECIAL MOMENTS</span>
        <h2>その一枚が、宝物になる。</h2>
      </div>
      <div className="gacha-stage">
        <img className="stage-orbit" src={ui("gacha/stage-orbit.png")} alt="" />
        <img
          className="card-back"
          src={ui("gacha/card-back.png")}
          alt="ガチャのカード裏面"
        />
        <span className="gacha-prism" />
        <Sparkles count={12} />
      </div>
      <div className="gacha-draws">
        <Button
          className="draw-one"
          disabled={busy || save.gp < 300}
          onClick={() => onDraw(1)}
        >
          <b>1回引く</b>
          <span>
            <Icon name="gp" />
            300 GP
          </span>
        </Button>
        <Button
          className="draw-ten"
          disabled={busy || save.gp < 2700}
          onClick={() => onDraw(10)}
        >
          <b>10連を引く</b>
          <span>
            <Icon name="gp" />
            2,700 GP
          </span>
        </Button>
      </div>
      <div className="gacha-rules">
        <span>C 60% · B 25% · A 12% · S 3%</span>
        <span>10連はA以上1枚確定</span>
        {save.gacha.length > 0 && (
          <Button kind="secondary" onClick={onLast}>
            前回の結果を見る
          </Button>
        )}
        {save.gp < 300 && (
          <Button kind="secondary" onClick={onPlay}>
            GPをためにPLAYへ
          </Button>
        )}
      </div>
    </section>
  );
}
export function GachaReveal({
  ids,
  save,
  onDone,
  onDetail,
  gift = false,
}: {
  ids: string[];
  save: ScreenProps["save"];
  onDone: () => void;
  onDetail?: (c: Card) => void;
  gift?: boolean;
}) {
  const cards = ids.map((id) => assets.cards.find((c) => c.id === id)!);
  const rank = cards.some((c) => c.rarity === "S")
    ? "S"
    : cards.some((c) => c.rarity === "A")
      ? "A"
      : "C";
  const [skipped, setSkipped] = useState(false);
  const [done, setDone] = useState(false),
    [flipped, setFlipped] = useState(false),
    [detail, setDetail] = useState<Card | null>(null);
  const motion =
    save.settings.motion &&
    !matchMedia("(prefers-reduced-motion: reduce)").matches;
  useEffect(() => {
    const reveal = setTimeout(
        () => setFlipped(true),
        motion ? (rank === "S" ? 700 : rank === "A" ? 450 : 250) : 0,
      ),
      finish = setTimeout(
        () => setDone(true),
        motion ? (rank === "S" ? 1800 : rank === "A" ? 1500 : 900) : 1,
      );
    return () => {
      clearTimeout(reveal);
      clearTimeout(finish);
    };
  }, [motion, rank]);
  const star = cards.find((c) => c.rarity === rank) || cards[0];
  return (
    <section
      className={`gacha-reveal reveal-${rank} ${done ? "done" : ""} ${skipped ? "instant" : ""}`}
    >
      <header className="reveal-heading">
        <div>
          <span className="eyebrow">
            {gift ? "YOUR WELCOME GIFT" : "YOUR SPECIAL MOMENTS"}
          </span>
          <h2>
            {done
              ? gift
                ? "WELCOME COLLECTION"
                : "COLLECTION UPDATED"
              : "心ときめく、一瞬。"}
          </h2>
        </div>
        <Button
          kind="secondary"
          onClick={() => (done ? onDone() : (setSkipped(true), setDone(true)))}
        >
          {done ? (gift ? "HOMEへ" : "ガチャに戻る") : "SKIP"}
        </Button>
      </header>
      {!done ? (
        <div className={`reveal-theatre ${flipped ? "flipped" : ""}`}>
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
          <Sparkles count={rank === "S" ? 24 : 12} />
          <div className="flipping-card">
            <div className="card-back-face">
              <img src={ui("gacha/card-back.png")} alt="カードを開封中" />
            </div>
            <div className="card-front-face">
              <CardFace card={star} />
            </div>
          </div>
        </div>
      ) : (
        <div className="reveal-card-pages scroll">
          <div className={`reveal-grid ${cards.length === 1 ? "single" : ""}`}>
            {cards.map((card, i) => (
              <div
                className="grant"
                key={`${card.id}:${i}`}
                style={{ "--delay": `${i * 70}ms` } as React.CSSProperties}
              >
                <CardFace
                  card={card}
                  onClick={() => (onDetail ? onDetail(card) : setDetail(card))}
                />
                <span
                  className={
                    (save.cards[card.id] ?? 0) === 1
                      ? "new-label"
                      : "duplicate-label"
                  }
                >
                  {(save.cards[card.id] ?? 0) === 1
                    ? "NEW"
                    : `所持 ${save.cards[card.id] ?? 0}枚 · 重複 ${Math.max(0, (save.cards[card.id] ?? 0) - 1)}`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      <p className="reveal-caption">
        {gift
          ? "無料10枚 · A以上1枚確定 · GP消費なし"
          : "結果とGPは演出前に保存済み。スキップしても結果は変わりません。"}
      </p>
      {detail && (
        <CardDetails
          card={detail}
          counts={save.cards}
          onClose={() => setDetail(null)}
          onCard={setDetail}
        />
      )}
    </section>
  );
}
