using FourDotnet.BoogaBooster.Core;
using FourDotnet.BoogaBooster.Weather.Abstractions;
using FourDotnet.BoogaBooster.Weather.Domain;
using FourDotnet.BoogaBooster.Weather.Tests.Testing;
using Xunit;
using WeatherModel = FourDotnet.BoogaBooster.Weather.Domain.Weather;

namespace FourDotnet.BoogaBooster.Weather.Tests;

public sealed class WeatherEventTests
{
    private static readonly TimeSpan Tick = WeatherDefaults.TickInterval;

    [Theory]
    [InlineData(PrecipitationType.Rain)]
    [InlineData(PrecipitationType.Snow)]
    [InlineData(PrecipitationType.Hail)]
    public void Starting_precipitation_activates_the_chosen_type(PrecipitationType type)
    {
        var weather = WeatherModel.CreateDefault();

        weather.StartPrecipitation(type);

        Assert.Equal(WeatherRegime.Precipitation, weather.Regime);
        Assert.Equal(WeatherDefaults.PrecipitationDuration, weather.RemainingEventDuration);
    }

    [Fact]
    public void Starting_precipitation_with_none_is_rejected()
    {
        var weather = WeatherModel.CreateDefault();

        Assert.Throws<DomainValidationException>(() => weather.StartPrecipitation(PrecipitationType.None));
    }

    [Fact]
    public void During_precipitation_temperature_drops_and_wind_picks_up()
    {
        var weather = WeatherModel.CreateDefault();
        weather.StartPrecipitation(PrecipitationType.Rain);

        for (var i = 0; i < 8; i++)
        {
            weather.Advance(Tick, ConstantSampler.Zero);
        }

        var conditions = weather.ToConditionDto();
        Assert.True(conditions.TemperatureCelsius < WeatherDefaults.DefaultTemperatureCelsius,
            $"Expected temperature below default, was {conditions.TemperatureCelsius}.");
        Assert.True(conditions.WindBeaufort > WeatherDefaults.DefaultWindBeaufort,
            $"Expected wind above default, was {conditions.WindBeaufort}.");
        Assert.Equal(PrecipitationType.Rain, conditions.Precipitation);
    }

    [Fact]
    public void Precipitation_stops_after_its_duration_and_reverts_to_defaults()
    {
        var weather = WeatherModel.CreateDefault();
        weather.StartPrecipitation(PrecipitationType.Snow);

        // One large step past the ~15 minute duration expires the event.
        weather.Advance(WeatherDefaults.PrecipitationDuration + Tick, ConstantSampler.Zero);
        Assert.Equal(WeatherRegime.Calm, weather.Regime);

        // Continued calm ticks revert the weather back toward the moderate defaults.
        for (var i = 0; i < 400; i++)
        {
            weather.Advance(Tick, ConstantSampler.Zero);
        }

        var conditions = weather.ToConditionDto();
        Assert.True(Math.Abs(conditions.TemperatureCelsius - WeatherDefaults.DefaultTemperatureCelsius) <= 1d,
            $"Temperature did not revert near the default, was {conditions.TemperatureCelsius}.");
        Assert.True(conditions.WindBeaufort <= WeatherDefaults.DefaultWindBeaufort + 1,
            $"Wind did not ease back near the default, was {conditions.WindBeaufort}.");
        Assert.Equal(PrecipitationType.None, conditions.Precipitation);
    }

    [Fact]
    public void Starting_strong_wind_activates_the_regime_for_its_duration()
    {
        var weather = WeatherModel.CreateDefault();

        weather.StartStrongWind();

        Assert.Equal(WeatherRegime.StrongWind, weather.Regime);
        Assert.Equal(WeatherDefaults.StrongWindDuration, weather.RemainingEventDuration);
    }

    [Fact]
    public void During_strong_wind_wind_climbs_sunshine_fades_and_temperature_drops()
    {
        var weather = WeatherModel.CreateDefault();
        weather.StartStrongWind();

        for (var i = 0; i < 10; i++)
        {
            weather.Advance(Tick, ConstantSampler.Zero);
        }

        var conditions = weather.ToConditionDto();
        Assert.True(conditions.WindBeaufort > WeatherDefaults.DefaultWindBeaufort + 2,
            $"Expected much stronger wind, was {conditions.WindBeaufort}.");
        Assert.True(conditions.SunshinePercent < WeatherDefaults.DefaultSunshinePercent,
            $"Expected reduced sunshine, was {conditions.SunshinePercent}.");
        Assert.True(conditions.TemperatureCelsius < WeatherDefaults.DefaultTemperatureCelsius,
            $"Expected lower temperature, was {conditions.TemperatureCelsius}.");
    }

    [Fact]
    public void Strong_wind_stops_after_its_duration_and_wind_eases_back()
    {
        var weather = WeatherModel.CreateDefault();
        weather.StartStrongWind();

        weather.Advance(WeatherDefaults.StrongWindDuration + Tick, ConstantSampler.Zero);
        Assert.Equal(WeatherRegime.Calm, weather.Regime);

        for (var i = 0; i < 400; i++)
        {
            weather.Advance(Tick, ConstantSampler.Zero);
        }

        var conditions = weather.ToConditionDto();
        Assert.True(conditions.WindBeaufort <= WeatherDefaults.DefaultWindBeaufort + 1,
            $"Wind did not ease back near the default, was {conditions.WindBeaufort}.");
        Assert.True(conditions.SunshinePercent >= WeatherDefaults.DefaultSunshinePercent - 2,
            $"Sunshine did not return near the default, was {conditions.SunshinePercent}.");
        Assert.True(Math.Abs(conditions.TemperatureCelsius - WeatherDefaults.DefaultTemperatureCelsius) <= 1d,
            $"Temperature did not revert near the default, was {conditions.TemperatureCelsius}.");
    }

    [Fact]
    public void Godzilla_is_appended_to_the_regimes_so_existing_numeric_values_stay_stable()
    {
        // The frontend maps numeric payloads by index, so the order is part of the contract.
        Assert.Equal(0, (int)WeatherRegime.Calm);
        Assert.Equal(1, (int)WeatherRegime.Precipitation);
        Assert.Equal(2, (int)WeatherRegime.StrongWind);
        Assert.Equal(3, (int)WeatherRegime.Godzilla);
    }

    [Fact]
    public void Godzilla_pulls_the_readings_toward_the_calm_profile()
    {
        Assert.Equal(
            WeatherDefaults.ProfileFor(WeatherRegime.Calm),
            WeatherDefaults.ProfileFor(WeatherRegime.Godzilla));
    }

    [Fact]
    public void Summoning_godzilla_activates_the_regime_and_starts_its_countdown()
    {
        var weather = WeatherModel.CreateDefault();

        weather.StartGodzilla();

        Assert.Equal(WeatherRegime.Godzilla, weather.Regime);
        Assert.Equal(WeatherDefaults.GodzillaDuration, weather.RemainingEventDuration);
    }

    [Fact]
    public void Summoning_godzilla_replaces_an_active_strong_wind_and_starts_from_its_beginning()
    {
        var weather = WeatherModel.CreateDefault();
        weather.StartStrongWind();
        weather.Advance(Tick, ConstantSampler.Zero);

        weather.StartGodzilla();

        Assert.Equal(WeatherRegime.Godzilla, weather.Regime);
        Assert.Equal(WeatherDefaults.GodzillaDuration, weather.RemainingEventDuration);
    }

    [Fact]
    public void Godzilla_is_still_present_one_tick_before_its_duration_ends()
    {
        var weather = WeatherModel.CreateDefault();
        weather.StartGodzilla();

        var ticksBeforeLeaving = (int)(WeatherDefaults.GodzillaDuration / Tick) - 1;
        for (var i = 0; i < ticksBeforeLeaving; i++)
        {
            weather.Advance(Tick, ConstantSampler.Zero);
        }

        Assert.Equal(WeatherRegime.Godzilla, weather.Regime);
        Assert.Equal(Tick, weather.RemainingEventDuration);
    }

    [Fact]
    public void Godzilla_leaves_and_the_regime_returns_to_calm_once_its_duration_elapses()
    {
        var weather = WeatherModel.CreateDefault();
        weather.StartGodzilla();

        var ticksUntilLeaving = (int)(WeatherDefaults.GodzillaDuration / Tick);
        for (var i = 0; i < ticksUntilLeaving; i++)
        {
            weather.Advance(Tick, ConstantSampler.Zero);
        }

        Assert.Equal(WeatherRegime.Calm, weather.Regime);
        Assert.Equal(TimeSpan.Zero, weather.RemainingEventDuration);
    }

    [Fact]
    public void During_godzilla_readings_drift_toward_the_calm_defaults_rather_than_the_storm()
    {
        var weather = WeatherModel.CreateDefault();
        weather.StartStrongWind();
        for (var i = 0; i < 10; i++)
        {
            weather.Advance(Tick, ConstantSampler.Zero);
        }

        var stormy = weather.ToConditionDto();

        weather.StartGodzilla();
        for (var i = 0; i < 5; i++)
        {
            weather.Advance(Tick, ConstantSampler.Zero);
        }

        var conditions = weather.ToConditionDto();
        Assert.True(conditions.WindBeaufort < stormy.WindBeaufort,
            $"Expected wind to ease from {stormy.WindBeaufort}, was {conditions.WindBeaufort}.");
        Assert.True(conditions.SunshinePercent > stormy.SunshinePercent,
            $"Expected sunshine to return from {stormy.SunshinePercent}, was {conditions.SunshinePercent}.");
        Assert.True(conditions.TemperatureCelsius > stormy.TemperatureCelsius,
            $"Expected temperature to recover from {stormy.TemperatureCelsius}, was {conditions.TemperatureCelsius}.");
        Assert.Equal(PrecipitationType.None, conditions.Precipitation);
    }
}
