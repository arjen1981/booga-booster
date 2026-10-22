export type SoundId = 'draaiorgel' | 'booster' | 'kamelenrace' | 'kermis';

/** Attribution required by the recording's Creative Commons licence. */
export interface SoundCredit {
  readonly title: string;
  readonly author: string;
  readonly url: string;
  readonly licence: string;
  readonly licenceUrl: string;
}

export interface Sound {
  readonly id: SoundId;
  /** Dutch display name. */
  readonly label: string;
  readonly src: string;
  readonly credit: SoundCredit;
}

const CC_BY_4 = {
  licence: 'CC BY 4.0',
  licenceUrl: 'https://creativecommons.org/licenses/by/4.0/',
} as const;

/**
 * The soundboard catalogue, in display order. The buttons and the credits
 * popover both render from this list; keep it in sync with
 * `public/sounds/CREDITS.md`.
 */
export const SOUNDS: readonly Sound[] = [
  {
    id: 'draaiorgel',
    label: 'Draaiorgel',
    src: '/sounds/draaiorgel.mp3',
    credit: {
      title: 'Mechanical Street Organ - The Hague',
      author: 'RTB45',
      url: 'https://freesound.org/people/RTB45/sounds/203424/',
      ...CC_BY_4,
    },
  },
  {
    id: 'booster',
    label: 'Booster',
    src: '/sounds/booster.mp3',
    credit: {
      title: 'FunFair NL 002 160827_00.wav',
      author: 'klankbeeld',
      url: 'https://freesound.org/people/klankbeeld/sounds/352980/',
      ...CC_BY_4,
    },
  },
  {
    id: 'kamelenrace',
    label: 'Kamelenrace',
    src: '/sounds/kamelenrace.mp3',
    credit: {
      title: 'fairground camel race ambience NL 140829_19.wav',
      author: 'klankbeeld',
      url: 'https://freesound.org/people/klankbeeld/sounds/263142/',
      ...CC_BY_4,
    },
  },
  {
    id: 'kermis',
    label: 'Kermis',
    src: '/sounds/kermis.mp3',
    credit: {
      title: 'FunFair NL 001 160827_00.wav',
      author: 'klankbeeld',
      url: 'https://freesound.org/people/klankbeeld/sounds/353221/',
      ...CC_BY_4,
    },
  },
];
