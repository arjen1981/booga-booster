import { SOUNDS } from './sounds';

describe('SOUNDS catalogue', () => {
  it('lists the four sounds in display order', () => {
    expect(SOUNDS.map((s) => s.label)).toEqual(['Draaiorgel', 'Booster', 'Kamelenrace', 'Kermis']);
  });

  it('has unique ids and sources', () => {
    expect(new Set(SOUNDS.map((s) => s.id)).size).toBe(SOUNDS.length);
    expect(new Set(SOUNDS.map((s) => s.src)).size).toBe(SOUNDS.length);
  });

  it.each(SOUNDS)('$id has a complete credit', ({ credit }) => {
    expect(credit.title).not.toBe('');
    expect(credit.author).not.toBe('');
    expect(credit.licence).toBe('CC BY 4.0');
    expect(credit.url).toMatch(/^https:\/\//);
    expect(credit.licenceUrl).toBe('https://creativecommons.org/licenses/by/4.0/');
  });
});
