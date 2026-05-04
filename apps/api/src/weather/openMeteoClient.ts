import type { DailyWeather, GeoLocation } from './types.js';
import { TtlCache } from './cache.js';

const GEOCODE_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const MARINE_URL = 'https://marine-api.open-meteo.com/v1/marine';

const FORECAST_TTL_MS = 10 * 60 * 1000;
const forecastCache = new TtlCache<DailyWeather[]>(FORECAST_TTL_MS);
const geocodeCache = new TtlCache<GeoLocation>(FORECAST_TTL_MS);

export class CityNotFoundError extends Error {
  constructor(city: string) {
    super(`No location matched "${city}"`);
    this.name = 'CityNotFoundError';
  }
}

type GeocodeResponse = {
  results?: Array<{
    name: string;
    country: string;
    latitude: number;
    longitude: number;
  }>;
};

type ForecastResponse = {
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_sum: number[];
    snowfall_sum: number[];
    wind_speed_10m_max: number[];
    uv_index_max: number[];
    weather_code: number[];
  };
};

type MarineResponse = {
  daily: {
    time: string[];
    wave_height_max: Array<number | null>;
    wave_period_max: Array<number | null>;
  };
};

export async function geocode(city: string): Promise<GeoLocation> {
  const cached = geocodeCache.get(city.toLowerCase());
  if (cached) return cached;

  const url = `${GEOCODE_URL}?name=${encodeURIComponent(city)}&count=1`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Geocoding failed (${res.status})`);

  const json = (await res.json()) as GeocodeResponse;
  const first = json.results?.[0];
  if (!first) throw new CityNotFoundError(city);

  const location: GeoLocation = {
    name: first.name,
    country: first.country,
    latitude: first.latitude,
    longitude: first.longitude,
  };
  geocodeCache.set(city.toLowerCase(), location);
  return location;
}

export async function fetchForecast(loc: GeoLocation): Promise<DailyWeather[]> {
  const key = `${loc.latitude.toFixed(2)},${loc.longitude.toFixed(2)}`;
  const cached = forecastCache.get(key);
  if (cached) return cached;

  const [forecast, marine] = await Promise.all([
    fetchDailyForecast(loc),
    fetchMarineForecast(loc).catch(() => null),
  ]);

  const days: DailyWeather[] = forecast.daily.time.map((date, i) => ({
    date,
    tempMaxC: forecast.daily.temperature_2m_max[i],
    tempMinC: forecast.daily.temperature_2m_min[i],
    precipitationMm: forecast.daily.precipitation_sum[i],
    snowfallCm: forecast.daily.snowfall_sum[i],
    windSpeedMaxKmh: forecast.daily.wind_speed_10m_max[i],
    uvIndexMax: forecast.daily.uv_index_max[i],
    weatherCode: forecast.daily.weather_code[i],
    waveHeightMaxM: marine?.daily.wave_height_max[i] ?? 0,
    wavePeriodMaxS: marine?.daily.wave_period_max[i] ?? 0,
  }));

  forecastCache.set(key, days);
  return days;
}

async function fetchDailyForecast(loc: GeoLocation): Promise<ForecastResponse> {
  const params = new URLSearchParams({
    latitude: String(loc.latitude),
    longitude: String(loc.longitude),
    daily: [
      'temperature_2m_max',
      'temperature_2m_min',
      'precipitation_sum',
      'snowfall_sum',
      'wind_speed_10m_max',
      'uv_index_max',
      'weather_code',
    ].join(','),
    forecast_days: '7',
    timezone: 'auto',
  });
  const res = await fetch(`${FORECAST_URL}?${params}`);
  if (!res.ok) throw new Error(`Forecast failed (${res.status})`);
  return (await res.json()) as ForecastResponse;
}

async function fetchMarineForecast(loc: GeoLocation): Promise<MarineResponse> {
  const params = new URLSearchParams({
    latitude: String(loc.latitude),
    longitude: String(loc.longitude),
    daily: 'wave_height_max,wave_period_max',
    forecast_days: '7',
    timezone: 'auto',
  });
  const res = await fetch(`${MARINE_URL}?${params}`);
  if (!res.ok) throw new Error(`Marine failed (${res.status})`);
  return (await res.json()) as MarineResponse;
}
