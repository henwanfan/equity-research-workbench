import * as Popover from '@radix-ui/react-popover';
import { Info, X } from 'lucide-react';
import { dateLabel, dateTimeLabel } from '../lib/format';

export function DataSource({
  source,
  capturedAt,
  priceDate,
}: {
  source: 'snapshot' | 'api';
  capturedAt: string;
  priceDate?: string;
}) {
  return (
    <Popover.Root>
      <Popover.Trigger className="data-source-trigger">
        <Info size={12} />
        Data
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          className="data-source-content"
          aria-label="Market data details"
          sideOffset={8}
          align="start"
          collisionPadding={14}
        >
          <div className="source-popover-heading">
            <h3>Market data</h3>
            <Popover.Close className="icon-button" aria-label="Close data details">
              <X size={13} />
            </Popover.Close>
          </div>
          <dl>
            <div>
              <dt>Provider</dt>
              <dd>Massive</dd>
            </div>
            <div>
              <dt>Mode</dt>
              <dd>{source === 'snapshot' ? 'Saved snapshot' : 'API data'}</dd>
            </div>
            <div>
              <dt>Retrieved</dt>
              <dd>{dateTimeLabel(capturedAt)}</dd>
            </div>
            {priceDate && (
              <div>
                <dt>Closing prices</dt>
                <dd>{dateLabel(priceDate)}</dd>
              </div>
            )}
          </dl>
          <p>
            Split-adjusted daily bars through a completed session. Current-session prices are
            excluded.
          </p>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
