import { provideHttpClient, withFetch } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { routes } from '../app.routes';
import { QUEUE_SOURCE } from '../queue/data/queue-source';
import { FakeQueueSource } from '../queue/testing/fake-queue-source';
import { WEATHER_SOURCE } from '../weather/data/weather-source';
import { FakeWeatherSource, createConditions } from '../weather/testing/fake-weather-source';
import { RIDE_TELEMETRY_SOURCE } from './data/ride-telemetry-source';
import { RideTelemetryDto } from './models/ride.models';
import { RideDashboard } from './ride-dashboard';
import { RideVisualization } from './visualization/ride-visualization';
import {
  createGondolas,
  createTelemetry,
  FakeRideTelemetrySource,
} from './testing/fake-ride-telemetry-source';

const TELEMETRY_URL = '/api/ride/telemetry';

describe('RideDashboard', () => {
  let source: FakeRideTelemetrySource;
  let weather: FakeWeatherSource;
  let http: HttpTestingController;

  beforeEach(() => {
    source = new FakeRideTelemetrySource();
    weather = new FakeWeatherSource();
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes),
        provideHttpClient(withFetch()),
        provideHttpClientTesting(),
        { provide: RIDE_TELEMETRY_SOURCE, useValue: source },
        { provide: WEATHER_SOURCE, useValue: weather },
        { provide: QUEUE_SOURCE, useValue: new FakeQueueSource() },
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

  it('redirects an unknown route to the dashboard', async () => {
    const harness = await RouterTestingHarness.create();
    const component = await harness.navigateByUrl('/does-not-exist', RideDashboard);
    http
      .expectOne(TELEMETRY_URL)
      .flush({ state: 'Idle', availableTransitions: ['Loading'] } satisfies RideTelemetryDto);

    expect(component).toBeInstanceOf(RideDashboard);
  });

  describe('Godzilla', () => {
    function godzillaInput(): boolean {
      const fixture = TestBed.createComponent(RideDashboard);
      http.expectOne(TELEMETRY_URL).flush({ state: 'Idle', availableTransitions: [] });
      fixture.detectChanges();
      return fixture.debugElement
        .query(By.directive(RideVisualization))
        .componentInstance.godzillaPresent();
    }

    it('tells the visualization Godzilla is present while the regime is Godzilla', () => {
      weather.setConditions(createConditions({ regime: 'Godzilla', niceWeather: 0 }));

      expect(godzillaInput()).toBe(true);
    });

    it('tells the visualization Godzilla is absent for other regimes', () => {
      weather.setConditions(createConditions({ regime: 'StrongWind' }));
      expect(godzillaInput()).toBe(false);
    });

    it('tells the visualization Godzilla is absent when there are no conditions yet', () => {
      expect(godzillaInput()).toBe(false);
    });
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
