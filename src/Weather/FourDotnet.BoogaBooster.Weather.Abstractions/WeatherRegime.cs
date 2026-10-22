namespace FourDotnet.BoogaBooster.Weather.Abstractions;

/// <summary>
/// The active weather regime driving the simulation toward a particular target.
/// </summary>
public enum WeatherRegime
{
    /// <summary>Autonomous moderate weather drifting around the defaults.</summary>
    Calm = 0,

    /// <summary>A user-triggered precipitation event is active.</summary>
    Precipitation = 1,

    /// <summary>A user-triggered strong-wind event is active.</summary>
    StrongWind = 2,

    /// <summary>
    /// A user-summoned Godzilla event is active. Appended so the numeric values of the
    /// existing members stay stable for clients that receive the regime as a number.
    /// </summary>
    Godzilla = 3,
}
