import type React from "react";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { loadAll, saveKey } from "./db";
import type { AppData } from "./types";

const empty: AppData = { beads: [], storages: [], modules: [], bracelets: [] };

interface Ctx {
  data: AppData;
  ready: boolean;
  update: <K extends keyof AppData>(key: K, fn: (prev: AppData[K]) => AppData[K]) => void;
  replaceAll: (d: AppData) => Promise<void>;
}

// Keep one context instance across hot reloads so provider and consumers always match.
const g = globalThis as unknown as { __perlenDataCtx?: React.Context<Ctx | null> };
const DataCtx = (g.__perlenDataCtx ??= createContext<Ctx | null>(null));

export function DataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(empty);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    loadAll()
      .then((d) => setData(d))
      .catch(console.error)
      .finally(() => setReady(true));
  }, []);

  const update = useCallback<Ctx["update"]>((key, fn) => {
    setData((prev) => {
      const next = fn(prev[key]);
      saveKey(key, next).catch(console.error);
      return { ...prev, [key]: next };
    });
  }, []);

  const replaceAll = useCallback(async (d: AppData) => {
    const clean: AppData = {
      beads: d.beads ?? [],
      storages: d.storages ?? [],
      modules: d.modules ?? [],
      bracelets: d.bracelets ?? [],
    };
    await Promise.all((Object.keys(clean) as (keyof AppData)[]).map((k) => saveKey(k, clean[k])));
    setData(clean);
  }, []);

  return <DataCtx.Provider value={{ data, ready, update, replaceAll }}>{children}</DataCtx.Provider>;
}

export function useData() {
  const c = useContext(DataCtx);
  if (!c) throw new Error("useData outside provider");
  return c;
}
