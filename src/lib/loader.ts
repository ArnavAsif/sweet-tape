// Loading state coordinator matching sweet-tape.com module 608958

const EVENT_REVEALED = "sweettape:revealed";
const EVENT_SWEEPING = "sweettape:sweeping";
const EVENT_HOLDING = "sweettape:holding";

let isSwept = false;

function hasLoadingAttr(): boolean {
  if (typeof document === "undefined") return false;
  return document.documentElement.dataset.loading !== undefined;
}

export function hold(): void {
  isSwept = false;
  if (typeof document !== "undefined") {
    document.documentElement.dataset.loading = "";
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(EVENT_HOLDING));
  }
}

export function isHeld(): boolean {
  return hasLoadingAttr();
}

export function onHold(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const ac = new AbortController();
  window.addEventListener(EVENT_HOLDING, cb, { signal: ac.signal });
  return () => ac.abort();
}

export function release(): void {
  isSwept = true;
  if (typeof document !== "undefined") {
    delete document.documentElement.dataset.loading;
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(EVENT_REVEALED));
  }
}

export function startSweep(): void {
  isSwept = true;
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(EVENT_SWEEPING));
  }
}

export function whenRevealed(cb: () => void): () => void {
  if (!isHeld()) {
    cb();
    return () => {};
  }
  if (typeof window === "undefined") return () => {};
  const ac = new AbortController();
  window.addEventListener(EVENT_REVEALED, cb, { once: true, signal: ac.signal });
  return () => ac.abort();
}

export function whenSweeping(cb: () => void): () => void {
  if (!isHeld() || isSwept) {
    cb();
    return () => {};
  }
  if (typeof window === "undefined") return () => {};
  const ac = new AbortController();
  window.addEventListener(EVENT_SWEEPING, cb, { once: true, signal: ac.signal });
  return () => ac.abort();
}
