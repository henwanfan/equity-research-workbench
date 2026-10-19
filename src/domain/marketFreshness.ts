const newYorkClock = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/New_York',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

// Policy buffer, not a provider-finalization guarantee. Missing sessions are handled upstream.
export function completedDailyDate(now = new Date()) {
  const parts = Object.fromEntries(
    newYorkClock.formatToParts(now).map(({ type, value }) => [type, value]),
  );
  const today = `${parts.year}-${parts.month}-${parts.day}`;
  if (Number(parts.hour) * 60 + Number(parts.minute) >= 20 * 60 + 15) return today;
  const day = new Date(`${today}T12:00:00Z`);
  day.setUTCDate(day.getUTCDate() - 1);
  return day.toISOString().slice(0, 10);
}

export function expectedClosingDate(now = new Date()) {
  const day = new Date(`${completedDailyDate(now)}T12:00:00Z`);
  while ([0, 6].includes(day.getUTCDay())) {
    day.setUTCDate(day.getUTCDate() - 1);
  }
  return day.toISOString().slice(0, 10);
}
