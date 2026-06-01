"use client";

// [IMPL-FILE_AGE_DISPLAY] [REQ-REACT_SSR_STABILITY] [REQ-CONFIG_DRIVEN_FILE_MANAGER]: stable "now" for SSR + post-hydration refresh

import { useSyncExternalStore } from "react";

const AGE_TICK_MS = 30_000;

type AgeTickerState = {
  nowMs: number;
  subscriberCount: number;
  intervalId: number | null;
};

const ticker: AgeTickerState = {
  nowMs: 0,
  subscriberCount: 0,
  intervalId: null,
};

function getClientAgeNowMs(serverReferenceMs: number): number {
  if (ticker.subscriberCount === 0) {
    return serverReferenceMs;
  }
  return ticker.nowMs;
}

function subscribeToAgeTicker(onStoreChange: () => void): () => void {
  const firstSubscriber = ticker.subscriberCount === 0;
  ticker.subscriberCount += 1;

  if (firstSubscriber) {
    ticker.nowMs = Date.now();
    ticker.intervalId = window.setInterval(() => {
      ticker.nowMs = Date.now();
      onStoreChange();
    }, AGE_TICK_MS);
    onStoreChange();
  }

  return () => {
    ticker.subscriberCount -= 1;
    if (ticker.subscriberCount === 0 && ticker.intervalId !== null) {
      window.clearInterval(ticker.intervalId);
      ticker.intervalId = null;
      ticker.nowMs = 0;
    }
  };
}

/**
 * Returns a clock value stable across server render and client hydration, then
 * advances on the client so relative age strings can update without mismatching SSR HTML.
 */
export function useHydrationSafeNowMs(serverReferenceMs: number): number {
  return useSyncExternalStore(
    subscribeToAgeTicker,
    () => getClientAgeNowMs(serverReferenceMs),
    () => serverReferenceMs,
  );
}
