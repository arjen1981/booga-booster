import { HtmlAudioPlayer } from './html-audio-player';

describe('HtmlAudioPlayer', () => {
  let play: ReturnType<typeof vi.spyOn>;
  let pause: ReturnType<typeof vi.spyOn>;
  let player: HtmlAudioPlayer;

  beforeEach(() => {
    play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue();
    pause = vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => undefined);
    player = new HtmlAudioPlayer();
  });

  afterEach(() => vi.restoreAllMocks());

  it('sets the source, rewinds and plays', async () => {
    await player.play('/sounds/a.mp3');

    const audio = play.mock.contexts[0] as HTMLAudioElement;
    expect(audio.src).toContain('/sounds/a.mp3');
    expect(audio.currentTime).toBe(0);
    expect(play).toHaveBeenCalledTimes(1);
  });

  it('reuses one audio element for every clip', async () => {
    await player.play('/sounds/a.mp3');
    await player.play('/sounds/b.mp3');

    expect(play.mock.contexts[0]).toBe(play.mock.contexts[1]);
    expect((play.mock.contexts[1] as HTMLAudioElement).src).toContain('/sounds/b.mp3');
  });

  it('rewinds a clip that is pressed again', async () => {
    await player.play('/sounds/a.mp3');
    const audio = play.mock.contexts[0] as HTMLAudioElement;
    audio.currentTime = 7;

    await player.play('/sounds/a.mp3');

    expect(audio.currentTime).toBe(0);
  });

  it('pauses on stop', async () => {
    await player.play('/sounds/a.mp3');
    player.stop();

    expect(pause).toHaveBeenCalledTimes(1);
  });

  it('does nothing on stop before the first play', () => {
    player.stop();

    expect(pause).not.toHaveBeenCalled();
  });

  it('propagates a rejected play', async () => {
    play.mockRejectedValue(new Error('blocked'));

    await expect(player.play('/sounds/a.mp3')).rejects.toThrow('blocked');
  });

  it('forwards ended events until unsubscribed', async () => {
    const listener = vi.fn();
    const unsubscribe = player.onEnded(listener);
    await player.play('/sounds/a.mp3');
    const audio = play.mock.contexts[0] as HTMLAudioElement;

    audio.dispatchEvent(new Event('ended'));
    unsubscribe();
    audio.dispatchEvent(new Event('ended'));

    expect(listener).toHaveBeenCalledTimes(1);
  });
});
