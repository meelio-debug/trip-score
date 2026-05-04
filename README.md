# Trip Score

Enter a city, get a 7-day ranking of how good each day is for skiing, surfing,
outdoor sightseeing, and indoor sightseeing — scored from
[Open-Meteo](https://open-meteo.com) forecasts.

## Quick start

```bash
pnpm install
pnpm dev          # API on :4000, web on :5173
```

```bash
pnpm test         # unit tests across the four scoring functions
pnpm typecheck    # strict TS across both apps
```

Smoke test the GraphQL endpoint:

```bash
curl -s http://localhost:4000/ \
  -H 'Content-Type: application/json' \
  -d '{"query":"{ rankings(city:\"Newquay\"){ city country days { date activities { activityName score reasons } } } }"}'
```

Requires Node 20+ and pnpm 10.

## Architecture

```
trip-score/
├── apps/
│   ├── api/                       Apollo Server 4 (TypeScript, ESM)
│   │   └── src/
│   │       ├── index.ts           server bootstrap
│   │       ├── graphql/           schema + thin resolvers
│   │       ├── weather/           Open-Meteo client, cache, normalised types
│   │       ├── activities/        Activity strategies, one file per activity
│   │       │   └── __tests__/     pure-function unit tests
│   │       └── ranking/           orchestration: geocode → forecast → score
│   │
│   └── web/                       Vite + React + Apollo Client
│       └── src/
│           ├── main.tsx           ApolloProvider bootstrap
│           └── App.tsx            search input + score grid
│
├── pnpm-workspace.yaml
├── tsconfig.base.json
└── package.json
```

The backend is four layers, each with one job:

1. **Transport** ([graphql/](apps/api/src/graphql/)) — schema and resolvers.
   Resolvers stay thin: they call into ranking, translate domain errors to
   GraphQL errors, and return.
2. **Domain** ([activities/](apps/api/src/activities/)) — one file per activity
   exporting an [`Activity`](apps/api/src/activities/types.ts) strategy. Adding a
   fifth activity is one new file plus one entry in
   [`activities/index.ts`](apps/api/src/activities/index.ts) — nothing else changes.
3. **Orchestration** ([ranking/rankCity.ts](apps/api/src/ranking/rankCity.ts)) —
   geocode the city, fetch the 7-day forecast, run every activity over every
   day. Pure composition.
4. **Integrations** ([weather/](apps/api/src/weather/)) — typed Open-Meteo
   wrapper. The only place HTTP lives. A small in-memory TTL cache sits in front
   of both the geocoder and the forecast endpoint; it's the seam for swapping in
   Redis later.

Scoring functions are **pure** (`weather → {score, reasons}`), which makes them
easy to test and trivially horizontally scalable.

## Caching

Open-Meteo gets called twice per search — once to turn the city name into
coordinates, once to fetch the 7-day forecast. Hitting those APIs every
time someone re-searches the same place is slower for the user and noisy
for a free service. So both calls go through a small in-memory cache
([apps/api/src/weather/cache.ts](apps/api/src/weather/cache.ts)) that
remembers each answer for **10 minutes**.

Ten minutes is the right window: forecasts barely change on that
timescale, and city coordinates basically never change — so re-searching
feels instant without anyone ever seeing stale weather.

There are two caches sitting side by side. One for city lookups, so
*London* and *london* land on the same entry. One for forecasts, keyed by
coordinates rounded to about a kilometre, so two near-identical searches
of the same place share one upstream call. They work the same way; they
just hold different things.

The point worth calling out: nothing outside the weather client knows the
cache exists. Scoring, ranking, and the GraphQL layer just ask for a
forecast and get one. If this ever needs to share state across multiple
servers (Redis) or to put a hard limit on memory, it's a single file to
change — nothing else in the codebase moves.

## Scoring approach

Each `Activity` returns an integer score 0–100 plus a list of human-readable
reasons. Reasons are what make the UI feel like a product instead of a CSV dump
(*"Heavy rain (14mm) — perfect to be inside"* beats `0.62`).

**Parameterisation:** every activity composes three or four **sub-scores in the
0–100 range**, each mapping one weather variable through ordered bands. The
final score is `Math.round(Σ subScore × weight)` where weights sum to 1.0.
This keeps the units consistent across activities and makes weight changes
mechanical.

- **Skiing** — temp (40%) + snowfall (40%) + wind (20%). The warm-day band
  collapses temp to 0, which alone halves the final score; the frostbite band
  (≤ -15°C) caps temp at 25 so unsafe-cold days can't score above ~75 even
  with perfect snow.
- **Surfing** — wave height (70%) + wind (20%) + air temp (10%). Wave weight
  is high enough that a dangerous 5m swell maxes out around 44 — good wind
  and warm air can't override unsafe conditions. Inland locations get no
  wave data from the Marine API; we treat that as 0m waves at the data
  boundary, so they fall into the "flat" band and naturally score low
  (~37 / Poor) without any geography-aware code in the scorer.
- **Outdoor sightseeing** — precipitation (50%) + temp (30%) + wind (20%).
  Precipitation dominates because heavy rain ruins outdoor plans regardless of
  how mild it is.
- **Indoor sightseeing** — baseline 55 with weather adjustments. The baseline
  is intentional: museums and galleries are a reliable plan independent of
  weather, so the floor isn't 0. Heavy rain and temperature extremes push it
  up; a beautiful outdoor day pulls it down.

Heuristics live in plain `if/else` ladders rather than a config blob — easier
to read, easier to test, easier to change. Tuning the weights is one edit in
the `score()` function for that activity.

## Stack choices

- **pnpm workspaces** 
- **Apollo Server 4 (standalone)** 
- **Apollo Client 3** 
- **Vite + React 18** 
- **Vitest** 
- **TypeScript strict mode everywhere.**
- **GraphQL** 

## Testing

```bash
pnpm test
```

Each scoring function has 3 behavioural tests covering its happy path, its
strongest penalty, and one distinguishing edge (e.g. surfing's inland
short-circuit). A single shared registry test parametrises across all
activities to assert the 0–100 integer invariant — that way the property check
isn't repeated four times.

Tests use a `makeDay()` fixture builder so each one specifies only the fields
it cares about. The Open-Meteo client is intentionally not unit-tested: it's a
thin HTTP pass-through where mocking the network costs more than it's worth at
this size. Live smoke tests happen via the GraphQL endpoint.

## AI usage

Claude (Opus, in Claude Code) was used to:

- Draft the initial scoring heuristics, which I then tuned by running the live
  Open-Meteo response through them and adjusting weights when results looked
  off (most notably: outdoor sightseeing's first version weighted temperature
  too high — a "Heavy rain (14mm)" day was scoring 60. Bumped precipitation to
  50% and re-ran the tests).
- Draft this README, then revised by hand to remove planning-doc filler and
  match the final code.

Architectural choices (layered backend, strategy pattern for activities, pure
scoring functions, the precipitation-dominant outdoor weighting) were specified
deliberately because that's what the assessment is grading.

## Omissions & trade-offs

- **No persistence, no auth.** Stateless service; everything from Open-Meteo.
  A real deployment would add Redis, the cache is already isolated behind the
  same interface
- **No GraphQL codegen.** Hand written types are fine at this size
- **Minimal styling.** Inline styles, no design system, no dark mode, no a11y
  audit.
- **No deployment config.
- **Inland and Marine-API outage look the same.** Both collapse to
  `waveHeightMaxM = 0` at the data boundary, so the scorer doesn't need to
  know about geography — but it also can't tell *"you're in Birmingham,
  there's no ocean"* apart from *"the Marine API is down right now"*. Both
  surface as a low surf score. In production these should be distinguished
  so a transient outage doesn't silently drop a coastal location's score.
