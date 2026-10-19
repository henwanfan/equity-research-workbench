export function expectedClosingDate(now = new Date()) {
  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
  const day = new Date(`${today}T12:00:00Z`);
  do {
    day.setUTCDate(day.getUTCDate() - 1);
  } while ([0, 6].includes(day.getUTCDay()));
  return day.toISOString().slice(0, 10);
}
