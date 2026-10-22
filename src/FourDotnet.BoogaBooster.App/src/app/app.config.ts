import { provideHttpClient, withFetch } from '@angular/common/http';
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { providePrimeNG } from 'primeng/config';

import { routes } from './app.routes';
import { HttpQueueSource } from './queue/data/http-queue-source';
import { QUEUE_SOURCE } from './queue/data/queue-source';
import { RIDE_TELEMETRY_SOURCE } from './ride-dashboard/data/ride-telemetry-source';
import { SseRideTelemetrySource } from './ride-dashboard/data/sse-ride-telemetry-source';
import { HttpWeatherSource } from './weather/data/http-weather-source';
import { BoogaBoosterPreset } from './theme/boogabooster-preset';
import { WEATHER_SOURCE } from './weather/data/weather-source';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withFetch()),
    providePrimeNG({
      theme: {
        preset: BoogaBoosterPreset,
        options: {
          // PrimeNG styles live in a cascade layer so the app's own (unlayered)
          // styles always win and the hand-rolled panels look unchanged.
          cssLayer: true,
          // The dashboard is permanently dark.
          darkModeSelector: ':root',
        },
      },
    }),
    { provide: RIDE_TELEMETRY_SOURCE, useExisting: SseRideTelemetrySource },
    { provide: WEATHER_SOURCE, useExisting: HttpWeatherSource },
    { provide: QUEUE_SOURCE, useExisting: HttpQueueSource },
  ],
};
