import { AudioPlayer } from '../audio-player';

/**
 * Deterministic {@link AudioPlayer} for tests: no media, no timers. It records
 * calls and lets a spec end the current clip or make the next `play` reject.
 */
export class FakeAudioPlayer implements AudioPlayer {
  /** Every `play` call, in order. */
  readonly played: string[] = [];
  stopCount = 0;

  private rejection: Error | null = null;
  private readonly listeners = new Set<() => void>();

  play(src: string): Promise<void> {
    this.played.push(src);
    return this.rejection ? Promise.reject(this.rejection) : Promise.resolve();
  }

  stop(): void {
    this.stopCount++;
  }

  onEnded(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /** Simulate the current clip reaching its natural end. */
  emitEnded(): void {
    this.listeners.forEach((listener) => listener());
  }

  /** Make every following `play` reject, as when the browser blocks playback. */
  rejectPlay(error = new Error('play() failed')): void {
    this.rejection = error;
  }
}
