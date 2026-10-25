import { useEffect, useState } from "react";
import { members, topics, type Difficulty } from "../data";
import { audio } from "../audio";
import { Button, Icon } from "../components/UI";
import type { ScreenProps, Setting } from "./types";
export function HomeScreen({
  save,
  difficulty,
  onPlay,
  onWallpaper,
  onLogin,
  onHelp,
}: ScreenProps & {
  difficulty: Difficulty;
  onPlay: (id: string) => void;
  onWallpaper: () => void;
  onLogin: () => void;
  onHelp: () => void;
}) {
  const next =
    topics.find((t) => !save.records[`${t.id}:${difficulty}`]) ?? topics[59];
  return (
    <section className="home-screen">
      <div className="home-greeting">
        <span className="eyebrow">YOUR WORDS, YOUR WORLD</span>
        <p>
          {save.profile.nickname}さん、
          <br />
          <strong>今日も、ひとつ先へ。</strong>
        </p>
      </div>
      <aside className="home-actions">
        <Button
          className="icon-button"
          kind="secondary"
          onClick={onWallpaper}
          aria-label="壁紙を選択"
        >
          <Icon name="wallpaper" />
        </Button>
        <Button
          className="icon-button gold"
          onClick={onLogin}
          aria-label="ログインボーナス"
        >
          <Icon name="gift" />
        </Button>
        <Button
          className="icon-button"
          kind="secondary"
          onClick={onHelp}
          aria-label="遊び方"
        >
          <Icon name="help" />
        </Button>
      </aside>
      <div className="home-bottom">
        <div className="home-lesson">
          <span className="eyebrow">
            {save.session ? "RESUME YOUR CHAPTER" : "YOUR NEXT CHAPTER"}
          </span>
          <p>
            <strong>{(save.session?.topic ?? next.id).slice(1)}</strong>
            <span>
              {
                topics.find((t) => t.id === (save.session?.topic ?? next.id))!
                  .title
              }
            </span>
          </p>
          <small>60 GRAMMAR · 600 SENTENCES</small>
        </div>
        <Button className="home-play" onClick={() => onPlay(next.id)}>
          {save.session ? "CONTINUE" : "PLAY"}
          <Icon name="play" />
        </Button>
      </div>
    </section>
  );
}
export function SettingsScreen({
  save,
  busy,
  commit,
  notify,
  onSetting,
  onWallpaper,
  onExport,
  onImport,
  onBgm,
  onReset,
  onHelp,
  onEntry,
  onUpdate,
  updateAvailable,
  caching,
  cacheProgress,
  onCache,
}: ScreenProps & {
  onSetting: Setting;
  onWallpaper: () => void;
  onExport: () => void;
  onImport: () => void;
  onBgm: () => void;
  onReset: () => void;
  onHelp: () => void;
  onEntry: (v: boolean) => void;
  onUpdate: () => void;
  updateAvailable: boolean;
  caching: boolean;
  cacheProgress: string;
  onCache: () => void;
}) {
  const [draft, setDraft] = useState(save.settings),
    [nickname, setNickname] = useState(save.profile.nickname);
  useEffect(() => setDraft(save.settings), [save.settings]);
  const commitVolume = (key: "bgm" | "sfx" | "voice") =>
    onSetting({ [key]: draft[key] });
  return (
    <section className="settings-screen paper-panel scroll">
      <header className="section-heading">
        <div>
          <span className="eyebrow">MAKE THIS GARDEN YOURS</span>
          <h2>SETTINGS</h2>
        </div>
        <Button kind="secondary" onClick={onHelp}>
          <Icon name="help" />
          遊び方
        </Button>
      </header>
      <div className="settings-grid">
        <section>
          <h3>サウンド・演出</h3>
          {(["bgm", "sfx", "voice"] as const).map((key, i) => (
            <label className="volume-row" key={key}>
              <span>{["BGM", "効果音", "メンバー音声"][i]}</span>
              <input
                aria-label={["BGM音量", "効果音音量", "メンバー音声音量"][i]}
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={draft[key]}
                onChange={(e) => {
                  const next = { ...draft, [key]: Number(e.target.value) };
                  setDraft(next);
                  audio.configure(next);
                }}
                onPointerUp={() => commitVolume(key)}
                onKeyUp={() => commitVolume(key)}
                onBlur={() => commitVolume(key)}
              />
              <output>{Math.round(draft[key] * 100)}%</output>
            </label>
          ))}
          <div className="setting-toggles">
            <label>
              <input
                type="checkbox"
                checked={save.settings.muted}
                onChange={(e) => onSetting({ muted: e.target.checked })}
              />
              ミュート
            </label>
            <label>
              <input
                type="checkbox"
                checked={save.settings.motion}
                onChange={(e) => onSetting({ motion: e.target.checked })}
              />
              アニメーション
            </label>
          </div>
          <Button kind="secondary" onClick={onBgm}>
            <Icon name="music" />
            自分のBGMを追加
          </Button>
          <p className="caption">
            BGMは未同梱。追加した音声はこの端末内に保存されます。
          </p>
          <h3>あなたのプロフィール</h3>
          <div className="nickname-editor">
            <input
              aria-label="ニックネームを変更"
              value={nickname}
              maxLength={40}
              onFocus={() => onEntry(true)}
              onChange={(e) => setNickname(e.target.value)}
            />
            <Button
              disabled={busy || !nickname.trim()}
              onClick={() => {
                const name = Array.from(nickname.trim()).slice(0, 20).join("");
                onEntry(false);
                (document.activeElement as HTMLElement)?.blur();
                void commit((s) => {
                  s.profile.nickname = name;
                }).then((s) => {
                  if (s) notify("ニックネームを保存しました。");
                });
              }}
            >
              保存
            </Button>
          </div>
          <div className="member-pills">
            {members.map((m) => (
              <Button
                key={m.id}
                kind={save.settings.member === m.id ? "" : "secondary"}
                aria-pressed={save.settings.member === m.id}
                disabled={busy}
                onClick={() => onSetting({ member: m.id })}
              >
                {m.short}
              </Button>
            ))}
          </div>
          <Button kind="secondary" onClick={onWallpaper}>
            <Icon name="wallpaper" />
            20枚から壁紙を選ぶ
          </Button>
        </section>
        <section>
          <h3>データを大切に</h3>
          <div className="data-actions">
            <Button onClick={onExport}>
              <Icon name="download" />
              JSONバックアップ
            </Button>
            <Button kind="secondary" onClick={onImport}>
              <Icon name="upload" />
              JSONから復元
            </Button>
          </div>
          <p className="caption">
            自動保存はこのブラウザ内。端末の変更・データ消去前にはバックアップを。
          </p>
          <Button kind="secondary" disabled={caching} onClick={onCache}>
            <Icon name="save" />
            {caching ? `保存中 ${cacheProgress}` : "写真・音声をオフライン保存"}
          </Button>
          <p className="caption">
            約26MB。教材・専用背景・UIは自動保存されます。全素材を保存すると未閲覧の写真・音声もオフラインで利用できます。
          </p>
          {updateAvailable && (
            <Button className="gold" onClick={onUpdate}>
              新しいバージョンを適用
            </Button>
          )}
          <Button className="danger" kind="secondary" onClick={onReset}>
            <Icon name="reset" />
            ゲームデータを初期化
          </Button>
          <p className="caption">
            iPhone：Safariの共有から「ホーム画面に追加」。
            <br />
            画面の向きはOSの固定ではなく、CSS表示で切り替えます。
          </p>
        </section>
      </div>
    </section>
  );
}
