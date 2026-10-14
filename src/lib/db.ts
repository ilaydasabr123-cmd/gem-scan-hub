import type { AppData } from "./types";

const DB = "perlen-manager";
const STORE = "kv";
const KEYS: (keyof AppData)[] = ["beads", "storages", "modules", "bracelets"];

function open(): Promise<IDBDatabase> {
  return new Promise((res, rej) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(STORE);
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}

export async function loadAll(): Promise<AppData> {
  const db = await open();
  const tx = db.transaction(STORE, "readonly");
  const st = tx.objectStore(STORE);
  const vals = await Promise.all(
    KEYS.map(
      (k) =>
        new Promise<unknown>((res, rej) => {
          const g = st.get(k);
          g.onsuccess = () => res(g.result);
          g.onerror = () => rej(g.error);
        }),
    ),
  );
  const out = {} as AppData;
  KEYS.forEach((k, i) => ((out as unknown as Record<string, unknown>)[k] = (vals[i] as unknown[]) ?? []));
  return out;
}

export async function saveKey<K extends keyof AppData>(key: K, value: AppData[K]) {
  const db = await open();
  await new Promise<void>((res, rej) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(value, key);
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
}
