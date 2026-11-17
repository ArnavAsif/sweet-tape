// Sound management with Web Audio API

export const SOUNDS = {
  TAPE_STRETCH: "/assets/sounds/tape-stretch.wav",
  TAPE_CUT: "/assets/sounds/tape-stretch.wav", // fallback if tape-cut not found
  SLIDE_CHANGE: "/assets/sounds/slide-change.mp3",
  TAPE_PRESS: "/assets/sounds/tape-press.wav",
  BALL_HIT: "/assets/sounds/box-pop.mp3",
  MENU_PULL: "/assets/sounds/menu-pull.mp3",
  MENU_HOVER: "/assets/sounds/menu-hover.mp3",
  SOUND_TOGGLE: "/assets/sounds/sound-toggle.mp3",
  CLICK: "/assets/sounds/cursor-click.mp3",
  HAND_OUT: "/assets/sounds/hand-out.mp3",
  LOGO_ZOOM: "/assets/sounds/logo-zoom.mp3",
  BOX_POP: "/assets/sounds/box-pop.mp3",
  NEXT_HOVER: "/assets/sounds/next-hover.mp3",
  PICK_HOVER: "/assets/sounds/pick-hover.mp3",
  BGM: "/assets/sounds/bgm.m4a",
} as const;

let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let isSoundActive = false;
const audioCache = new Map<string, Promise<AudioBuffer | null>>();
const listeners = new Set<(active: boolean) => void>();
let bgmSource: AudioBufferSourceNode | null = null;
let bgmGain: GainNode | null = null;

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
      masterGain = audioCtx.createGain();
      masterGain.connect(audioCtx.destination);
    }
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

export function loadAudioBuffer(url: string): Promise<AudioBuffer | null> {
  const cached = audioCache.get(url);
  if (cached) return cached;

  const promise = (async () => {
    try {
      const res = await fetch(url);
      if (!res.ok) return null;
      const arrayBuffer = await res.arrayBuffer();
      const ctx = getContext();
      if (!ctx) return null;
      return await ctx.decodeAudioData(arrayBuffer);
    } catch {
      return null;
    }
  })();

  audioCache.set(url, promise);
  return promise;
}

export function createLoop(url: string) {
  let gainNode: GainNode | null = null;
  let sourceNode: AudioBufferSourceNode | null = null;
  let isFetching = false;
  let isStopped = false;

  return {
    set(gainValue: number, playbackRate = 1) {
      const ctx = getContext();
      if (gainNode && sourceNode && ctx) {
        gainNode.gain.setTargetAtTime(isSoundActive ? gainValue : 0, ctx.currentTime, 0.06);
        sourceNode.playbackRate.setTargetAtTime(playbackRate, ctx.currentTime, 0.06);
        return;
      }
      if (!isSoundActive || gainValue <= 0 || isFetching) return;
      isFetching = true;
      loadAudioBuffer(url).then((buf) => {
        if (!buf || isStopped || !audioCtx || !masterGain) return;
        sourceNode = audioCtx.createBufferSource();
        gainNode = audioCtx.createGain();
        sourceNode.buffer = buf;
        sourceNode.loop = true;
        gainNode.gain.value = 0;
        sourceNode.connect(gainNode).connect(masterGain);
        sourceNode.start();
      });
    },
    stop() {
      isStopped = true;
      try {
        sourceNode?.stop();
      } catch {}
      sourceNode?.disconnect();
      gainNode?.disconnect();
      sourceNode = null;
      gainNode = null;
    },
  };
}

export function playOnce(url: string, volume = 1) {
  if (!isSoundActive) return;
  const ctx = getContext();
  if (!ctx || !masterGain) return;

  loadAudioBuffer(url).then((buffer) => {
    if (!buffer || !isSoundActive || !ctx || !masterGain) return;
    try {
      const source = ctx.createBufferSource();
      const gain = ctx.createGain();
      source.buffer = buffer;
      gain.gain.value = volume;
      source.connect(gain);
      gain.connect(masterGain);
      source.start();
    } catch (e) {
      console.warn("Audio play error", e);
    }
  });
}

function startBgm() {
  const ctx = getContext();
  if (!ctx || !masterGain) return;
  loadAudioBuffer(SOUNDS.BGM).then((buffer) => {
    if (!buffer || !isSoundActive || !ctx || !masterGain) return;
    if (bgmSource) {
      try {
        bgmSource.stop();
      } catch {}
    }
    bgmSource = ctx.createBufferSource();
    bgmGain = ctx.createGain();
    bgmSource.buffer = buffer;
    bgmSource.loop = true;
    bgmGain.gain.setValueAtTime(0, ctx.currentTime);
    bgmGain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 1.5);
    bgmSource.connect(bgmGain);
    bgmGain.connect(masterGain);
    bgmSource.start();
  });
}

function stopBgm() {
  if (bgmGain && audioCtx) {
    try {
      bgmGain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
      setTimeout(() => {
        if (bgmSource) {
          try {
            bgmSource.stop();
          } catch {}
          bgmSource.disconnect();
          bgmSource = null;
        }
      }, 500);
    } catch {
      if (bgmSource) {
        bgmSource.stop();
        bgmSource = null;
      }
    }
  }
}

export function setSoundOn(on: boolean) {
  isSoundActive = on;
  const ctx = getContext();
  if (on) {
    playOnce(SOUNDS.SOUND_TOGGLE, 0.8);
    startBgm();
  } else {
    stopBgm();
  }
  for (const cb of listeners) {
    cb(on);
  }
}

export function isSoundOn() {
  return isSoundActive;
}

export function onSoundChange(cb: (active: boolean) => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}
