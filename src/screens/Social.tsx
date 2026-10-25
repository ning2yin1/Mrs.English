import { useEffect, useState } from "react";
import { members, memberPhoto, url, type Member } from "../data";
import { chatTitles, conversation, thresholds } from "../chat";
import { claimLogin, localDate, loginRewards } from "../game";
import { audio } from "../audio";
import { Button, CountUp, Icon, Modal, Sparkles } from "../components/UI";
import type { ScreenProps } from "./types";
export function LoginBonus({
  save,
  busy,
  commit,
  onClose,
}: ScreenProps & { onClose: () => void }) {
  const [claimed, setClaimed] = useState(0);
  const received = localDate() <= save.login.last;
  const current =
    (received ? Math.max(0, save.login.days - 1) : save.login.days) % 7;
  const today = new Date(),
    formatted = new Intl.DateTimeFormat("ja-JP", {
      month: "long",
      day: "numeric",
    }).format(today);
  return (
    <Modal title="LOGIN BONUS" className="login-sheet" onClose={onClose}>
      <div className="login-intro">
        <span className="eyebrow">A GIFT IN YOUR GARDEN</span>
        <h3>{save.profile.nickname}さん、今日もようこそ。</h3>
        <p>
          {formatted} · 累計 {save.login.days}日 · 7日ごとのプレゼント
        </p>
      </div>
      <div className="login-garden">
        {loginRewards.map((gp, i) => (
          <div
            key={i}
            className={`login-day day-${i + 1} ${i === current ? "today" : ""} ${i < current || (i === current && received) ? "claimed" : ""}`}
          >
            <span className="day-title">DAY {i + 1}</span>
            <div className="reward-orb">
              <Icon name={i === 6 ? "ticket" : "gp"} />
              <b>{gp}</b>
              <small>GP</small>
              {(i < current || (i === current && received)) && (
                <span className="claimed-check">✓</span>
              )}
            </div>
            <span className="reward-pedestal" />
            <span className="day-status">
              {i === current
                ? received
                  ? "受領済み"
                  : "TODAY"
                : i < current
                  ? "受領済み"
                  : "GIFT"}
            </span>
          </div>
        ))}
      </div>
      <div className="login-claim">
        <Button
          className="gold"
          disabled={busy || received}
          onClick={() =>
            void commit((s) => {
              const gp = claimLogin(s);
              if (gp) setClaimed(gp);
            }).then((s) => {
              if (s) audio.effect("correct");
            })
          }
        >
          {received ? "本日は受領済み" : "今日のGPを受け取る"}
        </Button>
        {claimed > 0 && (
          <div className="login-reward-pop" role="status">
            <Sparkles count={10} />
            <Icon name="gp" />+
            <CountUp value={claimed} motion={save.settings.motion} />
          </div>
        )}
        <Button kind="secondary" onClick={onClose}>
          CLOSE
        </Button>
      </div>
    </Modal>
  );
}
export function ChatScreen({
  save,
  busy,
  commit,
  onExit,
  onPlay,
}: ScreenProps & { onExit: () => void; onPlay: (member: Member) => void }) {
  const [member, setMember] = useState<Member | null>(null),
    [index, setIndex] = useState(0),
    [step, setStep] = useState(0);
  const [messageScroll, setMessageScroll] = useState<HTMLDivElement | null>(
    null,
  );
  const pick = (id: Member) => {
    const first = thresholds.findIndex(
      (v, i) => v <= save.affection[id] && !((save.chat[id] ?? 0) & (1 << i)),
    );
    setMember(id);
    setIndex(first < 0 ? 0 : first);
    setStep(0);
  };
  useEffect(() => {
    messageScroll?.scrollTo({
      top: messageScroll.scrollHeight,
      behavior: save.settings.motion ? "smooth" : "instant",
    });
  }, [step, member, index, messageScroll]);
  const selected = members.find((m) => m.id === member),
    unlocked = member !== null && save.affection[member] >= thresholds[index],
    messages = member ? conversation(member, index) : [];
  return (
    <section className={`chat-app ${member ? "thread-open" : "list-open"}`}>
      <header className="chat-header">
        <Button
          className="icon-button"
          kind="secondary"
          aria-label={member ? "チャット一覧へ" : "ゲームに戻る"}
          onClick={() => (member ? setMember(null) : onExit())}
        >
          <Icon name="back" />
        </Button>
        {selected ? (
          <>
            <img src={url(memberPhoto(selected.id).path)} alt="" />
            <div>
              <h1>{selected.name}</h1>
              <span>♡ {save.affection[selected.id]}</span>
            </div>
          </>
        ) : (
          <div>
            <span className="eyebrow">YOUR LITTLE MESSAGE ROOM</span>
            <h1>MESSAGES</h1>
          </div>
        )}
        <Icon name="chat" />
      </header>
      {!member ? (
        <>
          <div className="chat-list scroll">
            {members.map((m) => {
              const available = thresholds
                  .map((v, i) => ({ v, i }))
                  .filter(({ v }) => v <= save.affection[m.id]),
                unread = available.filter(
                  ({ i }) => !((save.chat[m.id] ?? 0) & (1 << i)),
                ).length,
                last = available.at(-1)!.i,
                preview = conversation(m.id, last)[0];
              return (
                <button
                  className="chat-member-row"
                  key={m.id}
                  onClick={() => pick(m.id)}
                >
                  <div className="avatar">
                    <img src={url(memberPhoto(m.id).path)} alt="" />
                    {unread > 0 && (
                      <span className="unread-count">{unread}</span>
                    )}
                  </div>
                  <div>
                    <h2>{m.name}</h2>
                    <p>{preview}</p>
                    <small>
                      ♡ {save.affection[m.id]} · {available.length}会話
                    </small>
                  </div>
                  <Icon name="next" />
                </button>
              );
            })}
          </div>
          <div className="chat-list-note">
            <Icon name="heart" />
            <p>
              一緒に学んだ時間が、
              <br />
              新しい会話につながる。
            </p>
          </div>
          <footer className="chat-footer">
            <Button onClick={onExit}>
              ゲームに戻る
              <Icon name="home" />
            </Button>
          </footer>
        </>
      ) : (
        <>
          <div className="chat-topic">
            <label>
              会話
              <select
                aria-label="会話を選択"
                value={index}
                onChange={(e) => {
                  setIndex(Number(e.target.value));
                  setStep(0);
                }}
              >
                {chatTitles.map((title, i) => (
                  <option key={i} value={i}>
                    {save.affection[member] < thresholds[i] ? "🔒 " : ""}
                    {title}{" "}
                    {(save.chat[member] ?? 0) & (1 << i) ? "· 既読" : ""}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="messages scroll" ref={setMessageScroll}>
            <span className="chat-date">{chatTitles[index]}</span>
            {unlocked ? (
              <>
                {messages.slice(0, step + 1).map((text, i) => (
                  <div className="incoming-row" key={i}>
                    <img
                      className="message-avatar"
                      src={url(memberPhoto(member).path)}
                      alt=""
                    />
                    <div className="chat-bubble incoming">{text}</div>
                  </div>
                ))}
                {step >= messages.length && (
                  <>
                    <div className="chat-bubble outgoing">
                      ありがとう。また練習してくるね。
                    </div>
                    <small className="chat-read">既読</small>
                    <p className="chat-end">また、ここでひと休み。</p>
                  </>
                )}
              </>
            ) : (
              <div className="locked-chat">
                <Icon name="lock" />
                <h2>もう少し仲良くなろう</h2>
                <p>
                  必要な好感度 ♡ {thresholds[index]}
                  <br />
                  現在 ♡ {save.affection[member]}
                </p>
                <Button onClick={() => onPlay(member)}>
                  このメンバーとPLAY
                </Button>
              </div>
            )}
          </div>
          <footer className="chat-footer">
            {unlocked && step < messages.length ? (
              <Button
                disabled={busy}
                onClick={() => {
                  if (step === messages.length - 1)
                    void commit((s) => {
                      s.chat[member] = (s.chat[member] ?? 0) | (1 << index);
                    }).then((s) => {
                      if (s) setStep((n) => n + 1);
                    });
                  else setStep((n) => n + 1);
                }}
              >
                {step === messages.length - 1
                  ? "ありがとう、と返信"
                  : "続きを読む"}
                <Icon name="next" />
              </Button>
            ) : (
              <Button kind="secondary" onClick={() => setMember(null)}>
                チャット一覧へ
              </Button>
            )}
          </footer>
        </>
      )}
    </section>
  );
}
