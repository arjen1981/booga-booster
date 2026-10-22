import { provideHttpClient, withFetch } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { routes } from '../app.routes';
import { QUEUE_SOURCE } from '../queue/data/queue-source';
import { FakeQueueSource } from '../queue/testing/fake-queue-source';
import { AUDIO_PLAYER } from '../soundboard/audio-player';
import { FakeAudioPlayer } from '../soundboard/testing/fake-audio-player';
import { WEATHER_SOURCE } from '../weather/data/weather-source';
import { FakeWeatherSource } from '../weather/testing/fake-weather-source';
import { RIDE_TELEMETRY_SOURCE } from './data/ride-telemetry-source';
import { RideTelemetryDto } from './models/ride.models';
import { RideDashboard } from './ride-dashboard';
import {
  createGondolas,
  createTelemetry,
  FakeRideTelemetrySource,
} from './testing/fake-ride-telemetry-source';

const TELEMETRY_URL = '/api/ride/telemetry';

describe('RideDashboard', () => {
  let source: FakeRideTelemetrySource;
  let http: HttpTestingController;

  beforeEach(() => {
    source = new FakeRideTelemetrySource();
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes),
        provideHttpClient(withFetch()),
        provideHttpClientTesting(),
        { provide: RIDE_TELEMETRY_SOURCE, useValue: source },
        { provide: WEATHER_SOURCE, useValue: new FakeWeatherSource() },
        { provide: QUEUE_SOURCE, useValue: new FakeQueueSource() },
        { provide: AUDIO_PLAYER, useValue: new FakeAudioPlayer() },
      ],
    });
    http = TestBed.inject(HttpTestingController);
  });

  it('renders the dashboard on the default route', async () => {
    const harness = await RouterTestingHarness.create();
    const component = await harness.navigateByUrl('/', RideDashboard);
    http
      .expectOne(TELEMETRY_URL)
      .flush({ state: 'Idle', availableTransitions: ['Loading'] } satisfies RideTelemetryDto);

    expect(component).toBeInstanceOf(RideDashboard);
    expect(harness.routeNativeElement?.querySelector('bb-ride-visualization')).not.toBeNull();
  });

  it('renders the soundboard in the central section, after the visualization', () => {
    const fixture = TestBed.createComponent(RideDashboard);
    http.expectOne(TELEMETRY_URL).flush({ state: 'Idle', availableTransitions: [] });
    fixture.detectChanges();
    const center = (fixture.nativeElement as HTMLElement).querySelector('section.center')!;
    const children = Array.from(center.children).map((c) => c.localName);

    expect(children).toEqual(['bb-ride-visualization', 'bb-soundboard']);
  });

  it('redirects an unknown route to the dashboard', async () => {
    const harness = await RouterTestingHarness.create();
    const component = await harness.navigateByUrl('/does-not-exist', RideDashboard);
    http
      .expectOne(TELEMETRY_URL)
      .flush({ state: 'Idle', availableTransitions: ['Loading'] } satisfies RideTelemetryDto);

    expect(component).toBeInstanceOf(RideDashboard);
  });

  it('summary reflects lifecycle state, occupancy and security', () => {
    source.setTelemetry(createTelemetry({ gondolas: createGondolas(10) }));
    const fixture = TestBed.createComponent(RideDashboard);
    http.expectOne(TELEMETRY_URL).flush({
      state: 'Started',
      availableTransitions: ['Stopping', 'EmergencyStop'],
    } satisfies RideTelemetryDto);
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('Started');
    expect(text).toContain('20');
    expect(text).toContain('Secured');
  });
});
