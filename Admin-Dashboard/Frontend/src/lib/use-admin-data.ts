"use client";

import { useCallback, useEffect, useState } from "react";

type UseAdminDataOptions = {
  refreshMs?: number;
};

export function useAdminData<T>(
  url: string,
  options?: UseAdminDataOptions,
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(url, { cache: "no-store" });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.detail || `Request failed with ${response.status}`);
      }

      setData(payload as T);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      if (!mounted) return;
      await load();
    };

    void run();

    if (!options?.refreshMs) {
      return () => {
        mounted = false;
      };
    }

    const interval = window.setInterval(() => {
      void load();
    }, options.refreshMs);

    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, [load, options?.refreshMs]);

  return {
    data,
    loading,
    error,
    refresh: load,
    setData,
  };
}
