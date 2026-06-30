// Returns the current "game day" as YYYY-MM-DD in Eastern Time (America/New_York).
// All games reset at midnight ET — this is the single source of truth for that date.
export function getGameDay(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(new Date());
}

// Returns milliseconds until the next midnight Eastern Time.
export function msUntilNextReset(): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
  }).formatToParts(new Date());
  const get = (t: string) => parseInt(parts.find((p) => p.type === t)?.value ?? '0');
  const elapsed = (get('hour') % 24) * 3600 + get('minute') * 60 + get('second');
  return (86400 - elapsed) * 1000;
}

export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
