import { dateLabel } from '../lib/format';
import { useMarketData } from '../state/MarketDataProvider';

export function PriceDate({ date, source }: { date: string; source: 'api' | 'snapshot' }) {
  const { referenceDate } = useMarketData();
  const older = date < referenceDate;
  return (
    <span className={older ? 'older-price' : undefined}>
      {older ? 'Older close' : source === 'snapshot' ? 'Saved close' : 'Close'} · {dateLabel(date)}
    </span>
  );
}
