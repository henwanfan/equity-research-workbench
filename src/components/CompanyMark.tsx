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
  const [failed, setFailed] = useState(false);
  const logo = companyLogos[ticker] ?? logoUrl;
  return (
    <span
      className={`company-mark ${large ? 'large-mark' : ''} mark-${ticker.toLowerCase()}`}
      aria-hidden="true"
    >
      {logo && !failed ? (
        <img
          src={logo}
          alt=""
          width={large ? 28 : 22}
          height={large ? 28 : 22}
          onError={() => setFailed(true)}
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
