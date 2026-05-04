import { GraphQLError } from 'graphql';
import { rankCity } from '../ranking/rankCity.js';
import { CityNotFoundError } from '../weather/openMeteoClient.js';

export const resolvers = {
  Query: {
    rankings: async (_: unknown, { city }: { city: string }) => {
      try {
        return await rankCity(city);
      } catch (err) {
        if (err instanceof CityNotFoundError) {
          throw new GraphQLError(err.message, {
            extensions: { code: 'CITY_NOT_FOUND' },
          });
        }
        throw err;
      }
    },
  },
};
