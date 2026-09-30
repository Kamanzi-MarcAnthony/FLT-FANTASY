// Pure: (matchdays, nowMs) -> tracker state. Times are ISO strings in UTC.
export function getMatchdayState(mds, now) {
  const m = mds.find((x) => now < Date.parse(x.ends_at));
  if (!m) return { state: 'complete' };
  const t = (k) => Date.parse(m[k]);
  if (now >= t('starts_at')) return { state: 'active', m, ms: t('ends_at') - now };
  if (now >= t('transfer_deadline_at')) return { state: 'locked', m, ms: t('starts_at') - now };
  if (m.number === 1 && now < t('matchweek_start_at')) return { state: 'not_started', m, ms: t('starts_at') - now };
  return { state: 'open', m, ms: t('starts_at') - now, deadlineMs: t('transfer_deadline_at') - now };
}
export function fmt(ms) {
  const s = Math.max(0, Math.floor(ms / 1000)), d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60);
  return d ? `${d}d ${h}h` : h ? `${h}h ${m}m` : `${m}m ${s % 60}s`;
}
