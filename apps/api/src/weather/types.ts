/**
 * Normalised daily weather record. The Open-Meteo response is flattened into
 * one of these per day so scoring functions never touch raw API shapes.
 */
export type DailyWeather = {
  date: string;
  tempMaxC: number;
  tempMinC: number;
  precipitationMm: number;
  snowfallCm: number;
  windSpeedMaxKmh: number;
  uvIndexMax: number;
  weatherCode: number;
  /**
   * Inland locations and Marine-API failures collapse to 0 at the data
   * boundary, so the scorer never has to special-case "no ocean nearby".
   */
  waveHeightMaxM: number;
  wavePeriodMaxS: number;
};

export type GeoLocation = {
  name: string;
  country: string;
  latitude: number;
  longitude: number;
};
