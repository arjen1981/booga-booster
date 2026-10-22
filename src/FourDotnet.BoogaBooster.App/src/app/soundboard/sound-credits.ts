import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ButtonDirective } from 'primeng/button';
import { Popover } from 'primeng/popover';

import { Sound } from './sounds';

/**
 * "Credits" disclosure: a text button that opens a popover with the title
 * (linked to its source), author and licence of every sound — the attribution
 * Creative Commons requires. The popover is a focus-trapping dialog that
 * Escape closes, returning focus to the button.
 */
@Component({
  selector: 'bb-sound-credits',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonDirective, Popover],
  template: `
    <button
      type="button"
      pButton
      size="small"
      severity="secondary"
      [text]="true"
      (click)="popover.toggle($event)"
    >
      Credits
    </button>
    <p-popover #popover ariaLabel="Sound credits">
      <ul class="credits">
        @for (sound of sounds(); track sound.id) {
          <li>
            <a [href]="sound.credit.url" target="_blank" rel="noopener noreferrer">{{
              sound.credit.title
            }}</a>
            by {{ sound.credit.author }},
            <a [href]="sound.credit.licenceUrl" target="_blank" rel="noopener noreferrer">{{
              sound.credit.licence
            }}</a>
          </li>
        }
      </ul>
      <p class="note">Links open in a new tab. Clips are trimmed and re-encoded excerpts.</p>
    </p-popover>
  `,
  styles: `
    .credits {
      margin: 0;
      padding-left: 1.25rem;
      display: grid;
      gap: 0.5rem;
      max-width: 22rem;
    }
    .note {
      margin: 0.75rem 0 0;
      font-size: 0.8125rem;
      opacity: 0.85;
    }
  `,
})
export class SoundCredits {
  readonly sounds = input.required<readonly Sound[]>();
}
