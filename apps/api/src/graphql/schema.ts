export const typeDefs = `#graphql
  """A score for a single activity on a single day."""
  type ActivityScore {
    activityId: String!
    activityName: String!
    score: Int!
    reasons: [String!]!
  }

  """Per-day rollup of all activity scores."""
  type DayRanking {
    date: String!
    activities: [ActivityScore!]!
  }

  """A geocoded city with 7 days of activity rankings."""
  type CityRanking {
    city: String!
    country: String!
    latitude: Float!
    longitude: Float!
    days: [DayRanking!]!
  }

  type Query {
    """Returns 7-day activity rankings for the given city."""
    rankings(city: String!): CityRanking!
  }
`;
