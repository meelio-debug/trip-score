import { type FormEvent, useState } from 'react';
import { gql, useLazyQuery } from '@apollo/client';

const RANKINGS = gql`
  query Rankings($city: String!) {
    rankings(city: $city) {
      city
      country
      latitude
      longitude
      days {
        date
        activities {
          activityId
          activityName
          score
          reasons
        }
      }
    }
  }
`;

type ActivityScore = {
  activityId: string;
  activityName: string;
  score: number;
  reasons: string[];
};

type DayRanking = { date: string; activities: ActivityScore[] };

type CityRanking = {
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  days: DayRanking[];
};

type Tone = 'ideal' | 'good' | 'fair' | 'poor' | 'avoid';
type Verdict = { label: string; tone: Tone; range: string };

const VERDICTS: ReadonlyArray<Verdict> = [
  { label: 'Ideal', tone: 'ideal', range: '80+' },
  { label: 'Good', tone: 'good', range: '60–79' },
  { label: 'Fair', tone: 'fair', range: '40–59' },
  { label: 'Poor', tone: 'poor', range: '20–39' },
  { label: 'Avoid', tone: 'avoid', range: '<20' },
];

const TONE: Record<Tone, { bg: string; chip: string; chipText: string }> = {
  ideal: { bg: 'hsl(142 65% 94%)', chip: 'hsl(142 55% 32%)', chipText: 'white' },
  good: { bg: 'hsl(95 55% 94%)', chip: 'hsl(95 45% 35%)', chipText: 'white' },
  fair: { bg: 'hsl(45 80% 94%)', chip: 'hsl(35 75% 42%)', chipText: 'white' },
  poor: { bg: 'hsl(20 80% 95%)', chip: 'hsl(15 65% 48%)', chipText: 'white' },
  avoid: { bg: 'hsl(0 70% 95%)', chip: 'hsl(0 55% 48%)', chipText: 'white' },
};

function verdictForScore(score: number): Verdict {
  if (score >= 80) return VERDICTS[0];
  if (score >= 60) return VERDICTS[1];
  if (score >= 40) return VERDICTS[2];
  if (score >= 20) return VERDICTS[3];
  return VERDICTS[4];
}

export default function App() {
  const [input, setInput] = useState('Cape Town');
  const [search, { data, loading, error }] = useLazyQuery<{ rankings: CityRanking }>(RANKINGS);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const city = input.trim();
    if (city) search({ variables: { city } });
  };

  return (
    <main style={styles.page}>
      <header style={styles.header}>
        <h1 style={styles.title}>Trip Score</h1>
        <p style={styles.subtitle}>
          7 day activity rankings, scored from weather forecasts.
        </p>
      </header>

      <form onSubmit={onSubmit} style={styles.form}>
        <input
          aria-label="City"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter a city or town"
          style={styles.input}
        />
        <button type="submit" disabled={loading} style={styles.button}>
          {loading ? 'Scoring…' : 'Rank'}
        </button>
      </form>

      {error && <p style={styles.error}>{error.message}</p>}
      {data?.rankings && <Results data={data.rankings} />}
    </main>
  );
}

function Results({ data }: { data: CityRanking }) {
  const activityIds = data.days[0]?.activities.map((a) => a.activityId) ?? [];
  const activityNames = data.days[0]?.activities.map((a) => a.activityName) ?? [];

  return (
    <section>
      <h2 style={styles.h2}>
        {data.city}, {data.country}{' '}
        <span style={styles.coords}>
          ({data.latitude.toFixed(2)}, {data.longitude.toFixed(2)})
        </span>
      </h2>

      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Date</th>
              {activityNames.map((name) => (
                <th key={name} style={styles.th}>
                  {name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.days.map((day) => (
              <tr key={day.date}>
                <td style={styles.dateCell}>
                  <div style={styles.dayName}>{formatWeekday(day.date)}</div>
                  <div style={styles.dayDate}>{formatMonthDay(day.date)}</div>
                </td>
                {activityIds.map((id) => {
                  const a = day.activities.find((x) => x.activityId === id);
                  if (!a) return <td key={id} style={styles.scoreCell} />;
                  return <ScoreCell key={id} activity={a} />;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Legend />
    </section>
  );
}

function ScoreCell({ activity }: { activity: ActivityScore }) {
  const v = verdictForScore(activity.score);
  const tone = TONE[v.tone];
  const reasons = activity.reasons.slice(0, 2);

  return (
    <td
      style={{ ...styles.scoreCell, background: tone.bg }}
      title={activity.reasons.join(' · ')}
    >
      <div style={styles.scoreRow}>
        <span style={styles.scoreNum}>{activity.score}</span>
        <span style={{ ...styles.chip, background: tone.chip, color: tone.chipText }}>
          {v.label}
        </span>
      </div>
      {reasons[0] && <div style={styles.reasonPrimary}>{reasons[0]}</div>}
      {reasons[1] && <div style={styles.reasonSecondary}>{reasons[1]}</div>}
    </td>
  );
}

function Legend() {
  return (
    <div style={styles.legend}>
      <span style={styles.legendLabel}>What the scores mean:</span>
      {VERDICTS.map((v) => {
        const tone = TONE[v.tone];
        return (
          <span key={v.tone} style={styles.legendItem}>
            <span style={{ ...styles.legendSwatch, background: tone.chip }} />
            <strong style={styles.legendStrong}>{v.label}</strong>
            <span style={styles.legendRange}>{v.range}</span>
          </span>
        );
      })}
    </div>
  );
}

function formatWeekday(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { weekday: 'short' });
}

function formatMonthDay(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
    maxWidth: 1100,
    margin: '0 auto',
    padding: '40px 24px 80px',
    color: '#1f2328',
  },
  header: { marginBottom: 28 },
  title: { margin: 0, fontSize: 36, letterSpacing: '-0.02em', fontWeight: 700 },
  subtitle: { margin: '6px 0 0', color: '#656d76', fontSize: 16 },
  form: { display: 'flex', gap: 8, marginBottom: 32 },
  input: {
    flex: 1,
    padding: '12px 16px',
    fontSize: 16,
    border: '1px solid #d0d7de',
    borderRadius: 8,
    outline: 'none',
  },
  button: {
    padding: '12px 22px',
    fontSize: 16,
    background: '#0969da',
    color: 'white',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    fontWeight: 600,
  },
  h2: { margin: '0 0 20px', fontSize: 22, fontWeight: 600 },
  coords: { color: '#656d76', fontWeight: 400, fontSize: 14 },
  error: { color: '#cf222e', background: '#ffebe9', padding: 12, borderRadius: 8 },
  tableWrap: {
    overflowX: 'auto',
    borderRadius: 12,
    background: 'white',
    boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 1px 8px rgba(0,0,0,0.04)',
  },
  table: { width: '100%', borderCollapse: 'separate', borderSpacing: 0, fontSize: 14 },
  th: {
    textAlign: 'left',
    padding: '14px 16px',
    background: '#f6f8fa',
    borderBottom: '1px solid #e5e7eb',
    fontWeight: 600,
    fontSize: 13,
    color: '#424a53',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  dateCell: {
    padding: '14px 16px',
    borderBottom: '1px solid #f1f3f5',
    verticalAlign: 'top',
    minWidth: 96,
    background: 'white',
  },
  dayName: { fontWeight: 600, fontSize: 14 },
  dayDate: { color: '#656d76', fontSize: 13, marginTop: 2 },
  scoreCell: {
    padding: '14px 16px',
    borderBottom: '1px solid white',
    verticalAlign: 'top',
    minWidth: 170,
  },
  scoreRow: { display: 'flex', alignItems: 'center', gap: 10 },
  scoreNum: { fontSize: 24, fontWeight: 700, lineHeight: 1 },
  chip: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    padding: '3px 8px',
    borderRadius: 999,
  },
  reasonPrimary: { fontSize: 13, color: '#1f2328', marginTop: 8, lineHeight: 1.35 },
  reasonSecondary: { fontSize: 12, color: '#656d76', marginTop: 3, lineHeight: 1.35 },
  legend: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 18,
    alignItems: 'center',
    marginTop: 20,
    padding: '14px 16px',
    background: '#f6f8fa',
    borderRadius: 8,
    fontSize: 13,
    color: '#424a53',
  },
  legendLabel: { fontWeight: 600 },
  legendItem: { display: 'inline-flex', alignItems: 'center', gap: 6 },
  legendSwatch: { display: 'inline-block', width: 12, height: 12, borderRadius: 3 },
  legendStrong: { fontWeight: 600, color: '#1f2328' },
  legendRange: { color: '#656d76' },
};
