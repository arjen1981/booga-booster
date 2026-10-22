import { InjectionToken } from '@angular/core';

/**
 * The seam between the soundboard and the browser's audio playback. The
 * default implementation drives one `HTMLAudioElement`; tests use a fake, as
 * jsdom cannot play media.
 */
export interface AudioPlayer {
  /** Start `src` from its beginning, replacing whatever is playing. Rejects if playback cannot start. */
  play(src: string): Promise<void>;

  /** Stop playback. */
  stop(): void;

  /** Register a listener for the current clip reaching its natural end; returns an unsubscribe function. */
  onEnded(listener: () => void): () => void;
}

/** DI token for the active {@link AudioPlayer} implementation. */
export const AUDIO_PLAYER = new InjectionToken<AudioPlayer>('AUDIO_PLAYER');
