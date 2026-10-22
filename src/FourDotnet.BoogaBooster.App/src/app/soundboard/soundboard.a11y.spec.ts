import { ComponentFixture, TestBed } from '@angular/core/testing';
import axe from 'axe-core';

import { AUDIO_PLAYER } from './audio-player';
import { Soundboard } from './soundboard';
import { FakeAudioPlayer } from './testing/fake-audio-player';

/**
 * Automated accessibility audit of the soundboard: idle, with a sound playing
 * and with the credits popover open. Colour contrast needs real layout/colour
 * (unavailable in jsdom) and is checked separately.
 */
describe('Soundboard accessibility', () => {
  let fixture: ComponentFixture<Soundboard>;

  const settle = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  };
  const audit = async (context: HTMLElement) =>
    (
      await axe.run(context, {
        resultTypes: ['violations'],
        rules: { 'color-contrast': { enabled: false } },
      })
    ).violations;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [{ provide: AUDIO_PLAYER, useValue: new FakeAudioPlayer() }],
    });
    fixture = TestBed.createComponent(Soundboard);
    await settle();
  });

  it('has no AXE violations when idle', async () => {
    expect(await audit(fixture.nativeElement as HTMLElement)).toEqual([]);
  });

  it('has no AXE violations while a sound is playing', async () => {
    const root = fixture.nativeElement as HTMLElement;
    root.querySelector<HTMLButtonElement>('button[aria-pressed]')!.click();
    await settle();

    expect(root.querySelector('button[aria-pressed="true"]')).not.toBeNull();
    expect(await audit(root)).toEqual([]);
  });

  it('has no AXE violations with the credits open', async () => {
    const root = fixture.nativeElement as HTMLElement;
    root.querySelector<HTMLButtonElement>('bb-sound-credits button')!.click();
    await settle();

    // The popover is appended to <body>, outside the component's host element.
    expect(document.body.querySelector('[role="dialog"]')).not.toBeNull();
    expect(await audit(document.body)).toEqual([]);
  });
});
