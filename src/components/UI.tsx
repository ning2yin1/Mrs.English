import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type ButtonHTMLAttributes,
} from "react";
import { assets, members, ui, url, type Card } from "../data";
export function Icon({ name }: { name: string }) {
  return <img className="icon" src={ui(`icons/${name}.svg`)} alt="" />;
}
export function Button({
  children,
  kind = "",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { kind?: string }) {
  return (
    <button
      type="button"
      className={`game-button ${kind} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
export function Panel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <section className={`paper-panel ${className}`}>{children}</section>;
}
export function Modal({
  title,
  children,
  onClose,
  locked = false,
  className = "",
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  locked?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
    return () => ref.current?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className={`sheet ${className}`}
      aria-label={title}
      onCancel={(e) => {
        e.preventDefault();
        if (!locked) onClose();
      }}
    >
      <header className="modal-head">
        <h2>{title}</h2>
        {!locked && (
          <Button
            className="icon-button"
            kind="secondary"
            onClick={onClose}
            aria-label="閉じる"
          >
            <Icon name="close" />
          </Button>
        )}
      </header>
      <div className="modal-body">{children}</div>
    </dialog>
  );
}
export function CardFace({
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
  const content = (
    <>
      <div className="card-art" data-badge-side={card.badgeSide}>
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
          </>
        ) : (
          <img
            className="card-frame"
            src={ui("cards/unowned-card.png")}
            alt="未所持"
          />
        )}
        <span
          className={`rarity-badge rank-${card.rarity}`}
          aria-label={`${card.rarity}ランク`}
        >
          {card.rarity}
        </span>
        <span className="card-label">
          {members.find((m) => m.id === card.member)?.short}
        </span>
        {!owned && (
          <span className="unowned-label">
            <Icon name="lock" />
            未所持
          </span>
        )}
      </div>
      {count > 0 && <span className="card-count">×{count}</span>}
    </>
  );
  return onClick ? (
    <button
      className={`photo-card rarity-${card.rarity}`}
      onClick={onClick}
      aria-label={`${card.id} ${owned ? "所持" : "未所持"} 詳細`}
    >
      {content}
    </button>
  ) : (
    <div className={`photo-card rarity-${card.rarity}`}>{content}</div>
  );
}
export function CountUp({
  value,
  motion = true,
  duration = 800,
}: {
  value: number;
  motion?: boolean;
  duration?: number;
}) {
  const [n, setN] = useState(() =>
    motion && !matchMedia("(prefers-reduced-motion: reduce)").matches
      ? 0
      : value,
  );
  useEffect(() => {
    if (!motion || matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setN(value);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      setN(Math.round(value * (1 - (1 - t) ** 3)));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, motion, duration]);
  return <>{n.toLocaleString()}</>;
}
export function Sparkles({
  hearts = false,
  count = 12,
}: {
  hearts?: boolean;
  count?: number;
}) {
  return (
    <div className={`particles ${hearts ? "hearts" : ""}`} aria-hidden="true">
      {Array.from({ length: Math.min(24, count) }, (_, i) => (
        <img
          key={i}
          src={ui(`effects/particle-${hearts ? "heart" : "star"}.png`)}
          alt=""
          style={
            {
              "--i": i,
              "--x": `${((i * 73) % 180) - 90}px`,
              "--y": `${-25 - ((i * 17) % 70)}px`,
              "--delay": `${(i % 5) * 90}ms`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
export function Loader({
  pending,
  error,
  retry,
}: {
  pending: boolean;
  error?: string;
  retry?: () => void;
}) {
  const [shown, setShown] = useState(false),
    [mounted, setMounted] = useState(false);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (pending) {
      timer = setTimeout(() => {
        setMounted(true);
        setShown(true);
      }, 100);
    } else {
      setShown(false);
      timer = setTimeout(() => setMounted(false), 200);
    }
    return () => clearTimeout(timer);
  }, [pending]);
  if (!mounted && !error) return null;
  return (
    <div className={`loader ${shown || error ? "visible" : ""}`} role="status">
      <div className="loader-center">
        <img
          className="loader-logo"
          src={url("assets/branding/mrs_green_apple_loading_symbol.png")}
          alt="Mrs. GREEN APPLE"
        />
        <span className={`loader-ring ${error ? "stopped" : ""}`} />
      </div>
      <p>{error || "読み込み中…"}</p>
      {error && retry && <Button onClick={retry}>再試行</Button>}
    </div>
  );
}
export function CardDetails({
  card,
  counts,
  onClose,
  onCard,
}: {
  card: Card;
  counts: Record<string, number>;
  onClose: () => void;
  onCard: (card: Card) => void;
}) {
  const index = assets.cards.indexOf(card);
  return (
    <Modal title="CARD COLLECTION" className="card-details" onClose={onClose}>
      <div className="card-detail-layout">
        <CardFace card={card} owned={!!counts[card.id]} />
        <div className="card-story">
          <span className={`rank-label rank-${card.rarity}`}>
            {card.rarity} RANK
          </span>
          <h2>{members.find((m) => m.id === card.member)?.name}</h2>
          <p>{card.category}</p>
          <small>{card.id}</small>
          <h3>
            {counts[card.id]
              ? `所持 ${counts[card.id]}枚 · 重複 ${counts[card.id] - 1}枚`
              : "まだ出会っていない一枚"}
          </h3>
          <div className="actions">
            <Button
              kind="secondary"
              onClick={() =>
                onCard(
                  assets.cards[
                    (index - 1 + assets.cards.length) % assets.cards.length
                  ],
                )
              }
            >
              ← 前へ
            </Button>
            <Button
              onClick={() =>
                onCard(assets.cards[(index + 1) % assets.cards.length])
              }
            >
              次へ →
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
