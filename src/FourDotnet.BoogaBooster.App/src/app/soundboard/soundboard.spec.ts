import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AUDIO_PLAYER } from './audio-player';
import { Soundboard } from './soundboard';
import { SOUNDS } from './sounds';
import { FakeAudioPlayer } from './testing/fake-audio-player';

describe('Soundboard', () => {
  let player: FakeAudioPlayer;
  let fixture: ComponentFixture<Soundboard>;
  let root: HTMLElement;

  const buttons = () =>
    Array.from(root.querySelectorAll<HTMLButtonElement>('button[aria-pressed]'));
  const button = (label: string) => buttons().find((b) => b.textContent?.includes(label))!;
  const pressed = () => buttons().map((b) => b.getAttribute('aria-pressed'));
  const settle = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  };
  const press = async (label: string) => {
    button(label).click();
    await settle();
  };

  beforeEach(() => {
    player = new FakeAudioPlayer();
    TestBed.configureTestingModule({ providers: [{ provide: AUDIO_PLAYER, useValue: player }] });
    fixture = TestBed.createComponent(Soundboard);
    root = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
  });

  it('renders four buttons in order, labelled in Dutch', () => {
    expect(buttons().map((b) => b.querySelector('[lang="nl"]')?.textContent)).toEqual([
      'Draaiorgel',
      'Booster',
      'Kamelenrace',
      'Kermis',
    ]);
    buttons().forEach((b) => expect(b.hasAttribute('aria-label')).toBe(false));
  });

  it('is a labelled region with a hidden heading', () => {
    const section = root.querySelector('section')!;
    const heading = root.querySelector(`#${section.getAttribute('aria-labelledby')}`);

    expect(heading?.textContent).toBe('Kermis soundboard');
  });

  it('starts all buttons not pressed', () => {
    expect(pressed()).toEqual(['false', 'false', 'false', 'false']);
  });

  it('starts a sound from the beginning', async () => {
    await press('Draaiorgel');

    expect(player.played).toEqual([SOUNDS[0].src]);
    expect(pressed()).toEqual(['true', 'false', 'false', 'false']);
  });

  it('switches sounds: only the newest is playing', async () => {
    await press('Draaiorgel');
    await press('Booster');

    expect(player.played).toEqual([SOUNDS[0].src, SOUNDS[1].src]);
    expect(pressed()).toEqual(['false', 'true', 'false', 'false']);
  });

  it('stops the playing sound when its button is pressed again', async () => {
    await press('Kermis');
    await press('Kermis');

    expect(player.stopCount).toBe(1);
    expect(player.played).toHaveLength(1);
    expect(pressed()).toEqual(['false', 'false', 'false', 'false']);
  });

  it('shows a non-colour cue for the playing sound', async () => {
    await press('Kamelenrace');

    expect(button('Kamelenrace').textContent).toContain('■');
    expect(button('Kermis').textContent).toContain('▶');
    expect(pressed()).toEqual(['false', 'false', 'true', 'false']);
  });

  it('resets when the clip ends', async () => {
    await press('Booster');
    player.emitEnded();
    await settle();

    expect(pressed()).toEqual(['false', 'false', 'false', 'false']);
  });

  it('resets without an unhandled error when play is rejected', async () => {
    player.rejectPlay();
    await press('Booster');

    expect(pressed()).toEqual(['false', 'false', 'false', 'false']);
  });

  it('keeps a newer sound pressed when an older play() rejects late', async () => {
    let rejectFirst!: () => void;
    vi.spyOn(player, 'play').mockImplementationOnce(
      () => new Promise<void>((_, reject) => (rejectFirst = () => reject(new Error('aborted')))),
    );

    await press('Draaiorgel');
    await press('Booster');
    rejectFirst();
    await settle();

    expect(pressed()).toEqual(['false', 'true', 'false', 'false']);
  });

  it('stops playback when destroyed', async () => {
    await press('Kermis');
    const before = player.stopCount;

    fixture.destroy();

    expect(player.stopCount).toBe(before + 1);
  });

  it('opens the credits listing every sound', async () => {
    (root.querySelector('bb-sound-credits button') as HTMLButtonElement).click();
    await settle();

    const text = document.body.textContent ?? '';
    for (const { credit } of SOUNDS) {
      expect(text).toContain(credit.author);
      expect(document.body.querySelector(`a[href="${credit.url}"]`)?.textContent?.trim()).toBe(
        credit.title,
      );
    }
    expect(text).toContain('CC BY 4.0');
    expect(document.body.querySelector('[role="dialog"]')).not.toBeNull();
  });
});
