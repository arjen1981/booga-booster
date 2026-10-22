import Aura from '@primeuix/themes/aura';
import { definePreset, palette } from '@primeuix/themes';

/** The dashboard accent (`--bb-accent` in ride-dashboard.scss). */
const ACCENT = '#4aa3ff';

/**
 * PrimeNG preset: Aura with its primary colour mapped to the dashboard accent,
 * so PrimeNG components blend into the dark operator dashboard.
 */
export const BoogaBoosterPreset = definePreset(Aura, {
  semantic: {
    primary: palette(ACCENT),
  },
});
