import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  ReferenceLine,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { DailyBar } from '../domain/equity';
import { dateLabel, money, percent } from '../lib/format';

export function PriceChart({
  bars,
  currency,
  emptyMessage,
}: {
  bars: DailyBar[];
  currency: string;
  emptyMessage?: string;
}) {
  if (bars.length < 2)
    return (
      <div className="chart-empty">
        {emptyMessage ?? 'At least two trading sessions are needed to show a price history.'}
      </div>
    );
  return (
    <div
      className="chart"
      role="group"
      aria-label={`Daily closing prices from ${dateLabel(bars[0]!.date)} to ${dateLabel(bars.at(-1)!.date)}. First close ${money(bars[0]!.close, currency)}, latest close ${money(bars.at(-1)!.close, currency)}.`}
    >
      <div className="chart-reference">
        <span className="chart-reference-swatch" aria-hidden="true" />
        <span>
          Start <strong>{money(bars[0]!.close, currency)}</strong>
        </span>
      </div>
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <AreaChart
          data={bars}
          margin={{ top: 24, right: 8, bottom: 8, left: 4 }}
          accessibilityLayer
        >
          <CartesianGrid vertical={false} stroke="#e9edf3" strokeDasharray="3 5" />
          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            minTickGap={48}
            tickMargin={16}
            tick={{ fill: '#667085', fontSize: 11 }}
            tickFormatter={(value) => dateLabel(String(value), true)}
          />
          <YAxis
            orientation="right"
            axisLine={false}
            tickLine={false}
            tickMargin={12}
            width={65}
            tick={{ fill: '#667085', fontSize: 11 }}
            domain={['auto', 'auto']}
            tickFormatter={(value) => `$${Number(value).toFixed(0)}`}
          />
          <ReferenceLine y={bars[0]!.close} stroke="#b4bfd2" strokeDasharray="5 5" />
          <Tooltip
            cursor={{ stroke: '#96a8d0', strokeDasharray: '4 4' }}
            content={({ active, payload }) => {
              const bar = payload?.[0]?.payload as DailyBar | undefined;
              const change =
                bar && bars[0]!.close > 0 ? (bar.close / bars[0]!.close - 1) * 100 : null;
              return active && bar ? (
                <div className="chart-tooltip">
                  <span>{dateLabel(bar.date)}</span>
                  <strong>{money(bar.close, currency)}</strong>
                  <small>Closing price</small>
                  {change !== null && (
                    <small className={change >= 0 ? 'positive' : 'negative'}>
                      {percent(change)} from period start
                    </small>
                  )}
                </div>
              ) : null;
            }}
          />
          <Area
            type="linear"
            dataKey="close"
            stroke="#365ee7"
            strokeWidth={2.25}
            fill="#edf2ff"
            fillOpacity={0.85}
            isAnimationActive={false}
            activeDot={{ r: 5, fill: '#365ee7', stroke: '#fff', strokeWidth: 3 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
