import { openDB } from "idb";
import { freshSave, validateSave, type Save } from "./game";
const dbPromise = openDB("mrs-english", 1, {
  upgrade(db) {
    db.createObjectStore("saves");
  },
});
export async function load(): Promise<{ save: Save; recovered: boolean }> {
  const db = await dbPromise,
    raw = await db.get("saves", "current");
  if (raw === undefined) return { save: freshSave(), recovered: false };
  try {
    return { save: validateSave(raw), recovered: false };
  } catch {
    const previous = await db.get("saves", "previous");
    if (previous)
      try {
        return { save: validateSave(previous), recovered: true };
      } catch {}
    throw Error(
      "保存データを読み取れません。バックアップJSONから復元するか、設定の初期化を選んでください。",
    );
  }
}
export async function mutate(fn: (save: Save) => void): Promise<Save> {
  const db = await dbPromise,
    tx = db.transaction("saves", "readwrite");
  try {
    const raw = await tx.store.get("current");
    let save: Save;
    if (raw === undefined) save = freshSave();
    else
      try {
        save = validateSave(raw);
      } catch {
        const previous = await tx.store.get("previous");
        if (previous === undefined)
          throw Error("保存データの復元または初期化が必要です。");
        save = validateSave(previous);
      }
    const before = structuredClone(save);
    fn(save);
    validateSave(save);
    await tx.store.put(before, "previous");
    await tx.store.put(save, "current");
    await tx.done;
    return save;
  } catch (error) {
    try {
      tx.abort();
    } catch {}
    await tx.done.catch(() => {});
    throw error;
  }
}
export async function replace(save: Save): Promise<Save> {
  const next = validateSave(save),
    db = await dbPromise,
    tx = db.transaction("saves", "readwrite");
  try {
    const before = await tx.store.get("current");
    // Preserve the last usable backup when replacing a corrupt current record.
    if (before !== undefined) {
      let valid: Save | undefined;
      try {
        valid = validateSave(before);
      } catch {}
      if (valid) await tx.store.put(valid, "previous");
    }
    await tx.store.put(next, "current");
    await tx.done;
    return next;
  } catch (error) {
    try {
      tx.abort();
    } catch {}
    await tx.done.catch(() => {});
    throw error;
  }
}
