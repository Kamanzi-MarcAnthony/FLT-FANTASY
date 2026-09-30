const DAY = 864e5;
const iso = (ms) => new Date(ms).toISOString();

function offset(utcMs, tz) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit',
    day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).formatToParts(new Date(utcMs)).map((x) => [x.type, x.value]));
  return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - utcMs;
}
// Wall-clock time in a timezone -> UTC ms (handles DST)
export function zonedToUtc(date, time, tz) {
  const [y, m, d] = date.split('-').map(Number), [h, mi] = time.split(':').map(Number);
  const guess = Date.UTC(y, m - 1, d, h, mi);
  return guess - offset(guess - offset(guess, tz), tz);
}

// One matchday per week from the first `weekday` (0=Sun) on/after startDate, up to endDate.
export function generateMatchdays({ startDate, endDate, recurring, weekday, kickoff, end, tz, deadlineHours }) {
  const last = Date.parse(`${endDate}T00:00:00Z`), out = [];
  let d = Date.parse(`${startDate}T00:00:00Z`);
  while (d <= last && new Date(d).getUTCDay() !== weekday) d += DAY;
  for (let n = 1; d <= last; d += 7 * DAY, n++) {
    const day = iso(d).slice(0, 10), st = zonedToUtc(day, kickoff, tz);
    out.push({ number: n, starts_at: iso(st), ends_at: iso(zonedToUtc(day, end, tz)),
      transfer_deadline_at: iso(st - deadlineHours * 36e5), matchweek_start_at: iso(st - 7 * DAY) });
    if (!recurring) break;
  }
  return out;
}
