import { openDB } from "idb";
import { url, type Voice } from "./data";
import type { Settings } from "./game";
class AudioManager {
  context: AudioContext | null = null;
  voice = new Audio();
  bgm = new Audio();
  settings: Settings | null = null;
  voiceSource: AudioBufferSourceNode | null = null;
  voiceGain: GainNode | null = null;
  generation = 0;
  buffers = new Map<string, Promise<AudioBuffer>>();
  constructor() {
    this.voice.preload = "auto";
    this.bgm.loop = true;
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        this.stop();
        this.bgm.pause();
      } else this.startBgm();
    });
  }
  unlock() {
    if (!this.context) this.context = new AudioContext();
    void this.context.resume();
  }
  configure(settings: Settings) {
    this.settings = settings;
    this.voice.volume = settings.muted ? 0 : settings.voice;
    if (this.voiceGain)
      this.voiceGain.gain.value = settings.muted ? 0 : settings.voice;
    this.bgm.volume = settings.muted ? 0 : settings.bgm;
    if (settings.muted) this.bgm.pause();
    else this.startBgm();
  }
  effect(kind: "tap" | "correct" | "incorrect" | "gacha" = "tap") {
    const s = this.settings,
      ctx = this.context;
    if (!s || s.muted || !s.sfx || !ctx || ctx.state !== "running") return;
    const notes =
      kind === "gacha"
        ? [440, 554, 659, 880]
        : kind === "correct"
          ? [660, 880]
          : kind === "incorrect"
            ? [240, 180]
            : [480];
    notes.forEach((f, i) => {
      const osc = ctx.createOscillator(),
        gain = ctx.createGain(),
        t = ctx.currentTime + i * 0.09;
      osc.type = "sine";
      osc.frequency.value = f;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(s.sfx * 0.13, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.18);
    });
  }
  async prepareVoice(v: Voice) {
    if (!this.context) return null;
    let buffer = this.buffers.get(v.id);
    if (!buffer) {
      const ctx = this.context;
      buffer = fetch(url(v.path))
        .then((response) => {
          if (!response.ok) throw Error("音声を読み込めませんでした。");
          return response.arrayBuffer();
        })
        .then((data) => ctx.decodeAudioData(data));
      this.buffers.set(v.id, buffer);
      buffer.catch(() => this.buffers.delete(v.id));
    }
    return buffer;
  }
  async play(v: Voice) {
    this.stop();
    const generation = this.generation;
    if (this.settings?.muted || !this.settings?.voice) return true;
    const ctx = this.context;
    if (ctx?.state === "running") {
      try {
        const buffer = await this.prepareVoice(v);
        if (!buffer || generation !== this.generation) return false;
        const source = ctx.createBufferSource(),
          gain = ctx.createGain();
        gain.gain.value = this.settings?.muted
          ? 0
          : (this.settings?.voice ?? 0.7);
        source.buffer = buffer;
        source.connect(gain).connect(ctx.destination);
        this.voiceSource = source;
        this.voiceGain = gain;
        source.start();
        return true;
      } catch {
        return false;
      }
    }
    this.voice.src = url(v.path);
    try {
      await this.voice.play();
      if (generation !== this.generation) {
        this.voice.pause();
        return false;
      }
      return true;
    } catch {
      return false;
    }
  }
  stop() {
    this.generation++;
    this.voice.pause();
    this.voice.currentTime = 0;
    try {
      this.voiceSource?.stop();
    } catch {}
    this.voiceSource?.disconnect();
    this.voiceGain?.disconnect();
    this.voiceSource = null;
    this.voiceGain = null;
    window.speechSynthesis?.cancel();
  }
  speak(text: string) {
    this.stop();
    if (!("speechSynthesis" in window)) return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-US";
    u.rate = 0.85;
    u.volume = this.settings?.muted ? 0 : (this.settings?.voice ?? 0.7);
    window.speechSynthesis.speak(u);
  }
  async setBgm(file: Blob) {
    const db = await openDB("mrs-english-media", 1, {
      upgrade(db) {
        db.createObjectStore("files");
      },
    });
    await db.put("files", file, "bgm");
    await this.restoreBgm();
  }
  async restoreBgm() {
    const db = await openDB("mrs-english-media", 1, {
      upgrade(db) {
        db.createObjectStore("files");
      },
    });
    const file = await db.get("files", "bgm");
    if (file) {
      if (this.bgm.src.startsWith("blob:")) URL.revokeObjectURL(this.bgm.src);
      this.bgm.src = URL.createObjectURL(file);
      this.startBgm();
    }
  }
  startBgm() {
    if (this.bgm.src && !this.settings?.muted && this.settings?.bgm)
      void this.bgm.play().catch(() => {});
  }
}
export const audio = new AudioManager();
