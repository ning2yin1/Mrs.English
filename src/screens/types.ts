import type { Save, Settings } from "../game";
export type Tab = "HOME" | "PLAY" | "CARDS" | "GACHA" | "CHAT" | "SETTINGS";
export type Commit = (change: (save: Save) => void) => Promise<Save | null>;
export type ScreenProps = {
  save: Save;
  busy: boolean;
  commit: Commit;
  notify: (text: string) => void;
};
export type Setting = (patch: Partial<Settings>) => void;
