export type SoundType = "correct" | "taboo" | "skip";

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    if (!ctx) ctx = new AudioContext();
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    return ctx;
  } catch {
    return null;
  }
}

function playTone(
  audioCtx: AudioContext,
  freq: number,
  startAt: number,
  duration: number,
  type: OscillatorType = "sine",
  gain = 0.3,
) {
  const osc = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();
  osc.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  osc.type = type;
  osc.frequency.value = freq;
  gainNode.gain.setValueAtTime(gain, startAt);
  gainNode.gain.exponentialRampToValueAtTime(0.001, startAt + duration);
  osc.start(startAt);
  osc.stop(startAt + duration + 0.05);
}

const MUTE_KEY = "taboo_muted";

export function isMuted(): boolean {
  try {
    return localStorage.getItem(MUTE_KEY) === "true";
  } catch {
    return false;
  }
}

export function setMuted(value: boolean): void {
  try {
    localStorage.setItem(MUTE_KEY, value ? "true" : "false");
  } catch {}
}

export function toggleMute(): boolean {
  const next = !isMuted();
  setMuted(next);
  return next;
}

export function playSound(type: SoundType): void {
  if (isMuted()) return;
  try {
    const audioCtx = getCtx();
    if (!audioCtx) return;
    const t = audioCtx.currentTime;
    switch (type) {
      case "correct":
        // Short ascending double-beep: C5 → E5
        playTone(audioCtx, 523, t, 0.09);
        playTone(audioCtx, 659, t + 0.08, 0.12);
        break;
      case "skip":
        // Brief neutral tap: A4
        playTone(audioCtx, 440, t, 0.07, "sine", 0.18);
        break;
      case "taboo":
        // Short descending buzz: A3 → E3
        playTone(audioCtx, 220, t, 0.09, "sawtooth", 0.25);
        playTone(audioCtx, 165, t + 0.08, 0.13, "sawtooth", 0.2);
        break;
    }
  } catch {
    // never crash the game on audio failure
  }
}
