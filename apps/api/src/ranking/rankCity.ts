import { activities } from '../activities/index.js';
import { fetchForecast, geocode } from '../weather/openMeteoClient.js';

export async function rankCity(city: string) {
  const location = await geocode(city);
  const forecast = await fetchForecast(location);

  const days = forecast.map((day) => ({
    date: day.date,
    activities: activities.map((activity) => {
      const verdict = activity.score(day);
      return {
        activityId: activity.id,
        activityName: activity.name,
        score: verdict.score,
        reasons: verdict.reasons,
      };
    }),
  }));

  return {
    city: location.name,
    country: location.country,
    latitude: location.latitude,
    longitude: location.longitude,
    days,
  };
}
