import * as Tooltip from '@radix-ui/react-tooltip';
import { CircleHelp } from 'lucide-react';

export function MetricLabel({ label, explanation }: { label: string; explanation: string }) {
  return (
    <span className="metric-label">
      {label}
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <button className="metric-help" aria-label={`Explain ${label.toLowerCase()}`}>
            <CircleHelp size={12} />
          </button>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content className="metric-tooltip" sideOffset={7} collisionPadding={16}>
            {explanation}
            <Tooltip.Arrow className="tooltip-arrow" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </span>
  );
}
