import { useState } from "react";
import { assets, members, memberPhoto, url } from "../data";
import { claimWelcome, finishWelcome } from "../game";
import { Button, Icon, Sparkles } from "../components/UI";
import { GachaReveal } from "./Collection";
import type { ScreenProps } from "./types";
export function Onboarding({
  save,
  busy,
  commit,
  onEntry,
  onDone,
}: ScreenProps & { onEntry: (value: boolean) => void; onDone: () => void }) {
  const p = save.profile,
    [nickname, setNickname] = useState(p.nickname);
  const next = async () => {
    const name = Array.from(nickname.trim()).slice(0, 20).join("");
    if (p.step === 1 && !name) return;
    onEntry(false);
    (document.activeElement as HTMLElement)?.blur();
    await commit((s) => {
      if (p.step === 1) {
        s.profile.nickname = name;
        s.profile.step = 2;
      } else if (p.step === 2) s.profile.step = 3;
      else if (p.step === 3) s.profile.step = 4;
    });
  };
  if (p.step === 4 && p.giftClaimed)
    return (
      <div className="onboarding-gift">
        <GachaReveal
          ids={p.giftCards}
          save={save}
          onDone={() =>
            void commit((s) => finishWelcome(s)).then((next) => {
              if (next) onDone();
            })
          }
          gift
        />
      </div>
    );
  return (
    <section className={`onboarding setup-${p.step}`}>
      <header className="setup-heading">
        <span className="eyebrow">WELCOME TO YOUR ENGLISH GARDEN</span>
        <h1>Mrs.English</h1>
        <div className="setup-progress">
          {[1, 2, 3, 4].map((n) => (
            <span key={n} className={n <= p.step ? "active" : ""}>
              {n}
            </span>
          ))}
        </div>
      </header>
      <div className="setup-content">
        <h2>
          {
            [
              "",
              "あなたのお名前は？",
              "一緒に学ぶメンバーを選ぼう",
              "お気に入りの景色を、ホームに。",
              "最初の10パックをあなたに。",
            ][p.step]
          }
        </h2>
        {p.step === 1 ? (
          <>
            <p>ゲームの中で使うニックネームを教えてください。</p>
            <label className="nickname-field">
              <span>ニックネーム</span>
              <input
                autoComplete="nickname"
                aria-label="ニックネーム"
                value={nickname}
                onFocus={() => onEntry(true)}
                onChange={(e) => setNickname(e.target.value)}
                maxLength={40}
                placeholder="20文字まで"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void next();
                  }
                }}
              />
            </label>
          </>
        ) : p.step === 2 ? (
          <>
            <p>推しはあとから設定で変更できます。</p>
            <div className="setup-members">
              {members.map((m) => (
                <button
                  key={m.id}
                  className={save.settings.member === m.id ? "selected" : ""}
                  aria-pressed={save.settings.member === m.id}
                  onClick={() =>
                    void commit((s) => {
                      s.settings.member = m.id;
                    })
                  }
                >
                  <img src={url(memberPhoto(m.id).path)} alt="" />
                  <b>{m.name}</b>
                  <span>{m.short}</span>
                </button>
              ))}
            </div>
          </>
        ) : p.step === 3 ? (
          <div className="setup-wallpapers scroll">
            {[...assets.backgrounds]
              .sort((a, b) => a.id.localeCompare(b.id))
              .map((b) => (
                <button
                  key={b.id}
                  aria-pressed={save.settings.wallpaper === b.id}
                  onClick={() =>
                    void commit((s) => {
                      s.settings.wallpaper = b.id;
                    })
                  }
                >
                  <img src={url(b.path)} alt={`壁紙 ${b.id}`} />
                  <span>
                    {b.id}
                    {save.settings.wallpaper === b.id ? " ✓" : ""}
                  </span>
                </button>
              ))}
          </div>
        ) : (
          <div className="welcome-present">
            <Icon name="gift" />
            <Sparkles />
            <h3>WELCOME 10 PACKS</h3>
            <p>無料で10枚。Aランク以上が1枚確定。</p>
            <small>GPは消費しません。初回限定のプレゼントです。</small>
          </div>
        )}
      </div>
      <footer className="setup-actions">
        {p.step > 1 && (
          <Button
            kind="secondary"
            disabled={busy}
            onClick={() =>
              void commit((s) => {
                if (!s.profile.giftClaimed)
                  s.profile.step = (s.profile.step - 1) as 1 | 2 | 3;
              })
            }
          >
            戻る
          </Button>
        )}
        <Button
          className="next"
          disabled={busy || (p.step === 1 && !nickname.trim())}
          onClick={() =>
            p.step === 4
              ? void commit((s) => {
                  claimWelcome(s);
                })
              : void next()
          }
        >
          {p.step === 4 ? "無料10パックを受け取る" : "NEXT"}
          <Icon name="next" />
        </Button>
      </footer>
    </section>
  );
}
