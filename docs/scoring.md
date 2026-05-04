# How scoring works

A walkthrough of how Trip Score turns a weather forecast into an activity
ranking, with worked examples. If the *Scoring approach* section in the main
[README](../README.md) reads as too technical, start here instead — it
covers the same logic but builds it up from a concrete example.

## The whole idea in one line

For each activity, ask **three questions** about the weather, give each
answer a **0–100 score**, then take a **weighted average**.

That's it. Everything else is detail.

## Skiing — a worked example

The three questions for skiing:

1. **Is it cold?** (40% importance)
2. **Is there snow?** (40% importance)
3. **Is the wind manageable?** (20% importance)

### A perfect ski day in the Alps

| Question | Reading | Answer (0–100) |
|---|---|---|
| Cold? | Temp -3°C | 100 |
| Snow? | 12cm fresh snowfall | 100 |
| Wind manageable? | 15 km/h | 100 |

Final = `100 × 0.4 + 100 × 0.4 + 100 × 0.2` = **100** → *Ideal*

### London in May

| Question | Reading | Answer (0–100) |
|---|---|---|
| Cold? | Temp 18°C | 0 (too warm) |
| Snow? | 0cm | 25 (baseline) |
| Wind manageable? | 15 km/h | 100 |

Final = `0 × 0.4 + 25 × 0.4 + 100 × 0.2` = `0 + 10 + 20` = **30** → *Poor*

That's the whole calculation. Everything in the code is just answering those
three questions for one specific activity.

## The questions per activity

| Activity | Q1 | Q2 | Q3 |
|---|---|---|---|
| **Skiing** | Cold? (40%) | Snow? (40%) | Wind OK? (20%) |
| **Surfing** | Right wave size? (70%) | Wind OK? (20%) | Air temp OK? (10%) |
| **Outdoor sightseeing** | Dry? (50%) | Comfortable temp? (30%) | Wind OK? (20%) |

## Indoor sightseeing — the odd one out

Indoor doesn't compute three sub-scores. It has a different shape:

> Start at **55** (the *"museums are always a decent plan"* baseline). Then
> nudge up or down based on weather:
>
> - Heavy rain → **+35** (*"perfect to be inside"*)
> - Hot day or very cold morning → **+20**
> - Strong winds → **+15**
> - Lovely outside (mild, dry, calm) → **-25** (*"feels wasteful indoors"*)
>
> Clamp the result to 0–100.

So an indoor score of 90 doesn't mean *"the museum is amazing today"* — it
means *"the weather is making indoor a much better option than usual."* A 30
means the opposite: it's so beautiful outside that staying inside feels
wrong.

## Why weighted, not pass/fail?

The simple version would be *"if cold AND snowy AND calm, return 100, else
0."* But weather is rarely all-or-nothing. The weighted blend means:

- A day that's perfect except for **one** flaw still scores reasonably well.
- A day with **multiple** flaws compounds into a low score.
- The reasons shown in the UI tell you *which* factor pulled it down.

## Why these specific weights?

Picked by **what dominates the experience**:

- **Surfing 70% on wave height** — without waves, nothing else matters. You
  can't redeem a flat day with great wind.
- **Outdoor 50% on rain** — a comfortable 20°C doesn't save you from a
  downpour.
- **Skiing 40/40 on temp and snow** — co-essential. No snow means no
  skiing. Too warm means no snow.

## Soft caps for unsafe conditions

A few extreme conditions get capped so they can't score "great" even if other
factors are perfect:

- **Skiing at ≤ -15°C** — frostbite-risk band caps the temp answer at 25, so
  even with perfect powder and zero wind the day can't exceed ~75.
- **Surfing at > 4m waves** — wave answer drops to 20, which limits the final
  score to around 44 even with ideal wind and warm air.

## One-sentence summary

> *"For each activity, we score how well the weather hits three things that
> matter for it. Each thing is rated 0–100, and we blend them with weights
> based on importance. Indoor is structured differently because it's about
> whether the weather makes 'go inside' the smart call."*

## Where this lives in code

- One file per activity, each exporting a pure scoring function:
  - [apps/api/src/activities/skiing.ts](../apps/api/src/activities/skiing.ts)
  - [apps/api/src/activities/surfing.ts](../apps/api/src/activities/surfing.ts)
  - [apps/api/src/activities/outdoorSightseeing.ts](../apps/api/src/activities/outdoorSightseeing.ts)
  - [apps/api/src/activities/indoorSightseeing.ts](../apps/api/src/activities/indoorSightseeing.ts)
- The shared `Activity` interface they implement:
  [apps/api/src/activities/types.ts](../apps/api/src/activities/types.ts)
- The registry that wires them up (adding a fifth activity is one line here):
  [apps/api/src/activities/index.ts](../apps/api/src/activities/index.ts)
- The orchestrator that runs every activity over every day:
  [apps/api/src/ranking/rankCity.ts](../apps/api/src/ranking/rankCity.ts)
