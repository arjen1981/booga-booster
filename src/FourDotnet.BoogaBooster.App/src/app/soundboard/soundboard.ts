import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { ButtonDirective } from 'primeng/button';

import { AUDIO_PLAYER } from './audio-player';
import { SoundCredits } from './sound-credits';
import { Sound, SoundId, SOUNDS } from './sounds';

/**
 * Compact kermis soundboard: one row of toggle buttons, one sound at a time.
 *
 * The sound buttons are native `<button pButton>` elements with an explicit
 * `aria-pressed` bound to the `playing` signal. PrimeNG's `ToggleButton` is a
 * form control (it owns its checked state via ngModel/forms), so it cannot be
 * driven cleanly from a signal that also changes on `ended` and failed `play()`.
 */
@Component({
  selector: 'bb-soundboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonDirective, SoundCredits],
  template: `
    <section class="soundboard" aria-labelledby="soundboard-heading">
      <h2 id="soundboard-heading" class="sr-only">Kermis soundboard</h2>
      @for (sound of sounds; track sound.id) {
        <button
          type="button"
          pButton
          size="small"
          [severity]="playing() === sound.id ? 'primary' : 'secondary'"
          [outlined]="playing() !== sound.id"
          [attr.aria-pressed]="playing() === sound.id"
          (click)="toggle(sound)"
        >
          <span aria-hidden="true">{{ playing() === sound.id ? '■' : '▶' }}</span>
          <span lang="nl">{{ sound.label }}</span>
        </button>
      }
      <bb-sound-credits [sounds]="sounds" />
    </section>
  `,
  styles: `
    .soundboard {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      min-width: 0;
    }
    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }
  `,
})
export class Soundboard {
  private readonly player = inject(AUDIO_PLAYER);

  protected readonly sounds = SOUNDS;
  /** The sound currently playing, or `null` when the board is silent. */
  protected readonly playing = signal<SoundId | null>(null);

  constructor() {
    const stopListening = this.player.onEnded(() => this.playing.set(null));
    inject(DestroyRef).onDestroy(() => {
      stopListening();
      this.player.stop();
    });
  }

  protected toggle(sound: Sound): void {
    if (this.playing() === sound.id) {
      this.player.stop();
      this.playing.set(null);
      return;
    }
    this.playing.set(sound.id);
    this.player.play(sound.src).catch(() => {
      // Autoplay policy or decoding failure: reset, unless another sound has since taken over.
      this.playing.update((current) => (current === sound.id ? null : current));
    });
  }
}
