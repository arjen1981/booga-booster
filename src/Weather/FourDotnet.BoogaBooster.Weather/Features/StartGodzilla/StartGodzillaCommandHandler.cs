using System.Diagnostics;
using System.Diagnostics.Metrics;
using FourDotnet.BoogaBooster.Core.Cqrs;
using FourDotnet.BoogaBooster.Core.Observability;
using FourDotnet.BoogaBooster.Weather.Application;
using FourDotnet.BoogaBooster.Weather.Observability;

namespace FourDotnet.BoogaBooster.Weather.Features.StartGodzilla;

/// <summary>
/// Summons Godzilla on the world weather and publishes the resulting weather
/// update, whose nice-weather indicator of 0 stops new queue arrivals.
/// </summary>
public sealed class StartGodzillaCommandHandler : CommandHandler<StartGodzillaCommand>
{
    private readonly IWeatherStore _store;
    private readonly IWeatherUpdatePublisher _publisher;

    public StartGodzillaCommandHandler(IWeatherStore store, IWeatherUpdatePublisher publisher)
    {
        _store = store ?? throw new ArgumentNullException(nameof(store));
        _publisher = publisher ?? throw new ArgumentNullException(nameof(publisher));
    }

    protected override async Task ExecuteAsync(StartGodzillaCommand command, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(command);

        var result = _store.StartGodzilla();

        BoogaBoosterTelemetry.WeatherDisturbances.Add(
            1,
            new TagList
            {
                {
                    WeatherTelemetryAttributes.DisturbanceKind,
                    WeatherTelemetryAttributes.GodzillaDisturbance
                },
            });

        await _publisher.PublishAsync(result.Snapshot, cancellationToken).ConfigureAwait(false);
    }

    /// <summary>
    /// The command carries no payload, so the span records the conditions Godzilla
    /// interrupted — the regime and how nice the weather was — which is what makes
    /// one invocation distinguishable from the next.
    /// </summary>
    protected override void EnrichActivity(Activity activity, StartGodzillaCommand command)
    {
        var snapshot = _store.GetSnapshot();
        activity.SetTag(WeatherTelemetryAttributes.Regime, snapshot.Regime.ToString());
        activity.SetTag(WeatherTelemetryAttributes.NiceWeather, snapshot.NiceWeather);
    }
}
