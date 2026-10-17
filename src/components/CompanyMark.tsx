import { useState } from 'react';
import { Check } from 'lucide-react';
import { companyLogos } from '../data/company-logos';

export function CompanyMark({
  ticker,
  selected = false,
  large = false,
  logoUrl,
}: {
  ticker: string;
  selected?: boolean;
  large?: boolean;
  logoUrl?: string | null;
}) {
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const logo = companyLogos[ticker] ?? logoUrl;
  return (
    <span
      className={`company-mark ${large ? 'large-mark' : ''} mark-${ticker.toLowerCase()}`}
      aria-hidden="true"
    >
      {logo && failedSource !== logo ? (
        <img
          src={logo}
          alt=""
          width={large ? 28 : 22}
          height={large ? 28 : 22}
          loading={large ? 'eager' : 'lazy'}
          onError={() => setFailedSource(logo)}
        />
      ) : (
        ticker[0]
      )}
      {selected && (
        <span className="selection-check">
          <Check size={9} strokeWidth={3} />
        </span>
      )}
    </span>
  );
}
