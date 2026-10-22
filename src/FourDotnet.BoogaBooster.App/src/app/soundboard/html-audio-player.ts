import { Injectable } from '@angular/core';

import { AudioPlayer } from './audio-player';

/**
 * {@link AudioPlayer} backed by a single reused `HTMLAudioElement`, which makes
 * "one sound at a time" structural: there is only one element to play on.
 */
@Injectable({ providedIn: 'root' })
export class HtmlAudioPlayer implements AudioPlayer {
  private audio: HTMLAudioElement | null = null;

  play(src: string): Promise<void> {
    const audio = this.element();
    audio.src = src;
    audio.currentTime = 0;
    return audio.play();
  }

  stop(): void {
    this.audio?.pause();
  }

  onEnded(listener: () => void): () => void {
    const audio = this.element();
    audio.addEventListener('ended', listener);
    return () => audio.removeEventListener('ended', listener);
  }

  private element(): HTMLAudioElement {
    return (this.audio ??= new Audio());
  }
}
