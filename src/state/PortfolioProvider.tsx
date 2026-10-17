import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import {
  parsePortfolio,
  PORTFOLIO_STORAGE_KEY,
  serializePortfolio,
  togglePortfolioTicker,
} from '../domain/portfolio';

interface PortfolioState {
  tickers: string[];
  persistenceError: string | null;
  toggle: (ticker: string) => void;
  remove: (ticker: string) => void;
}
const PortfolioContext = createContext<PortfolioState | null>(null);
function readSavedPortfolio() {
  try {
    return {
      tickers: parsePortfolio(window.localStorage.getItem(PORTFOLIO_STORAGE_KEY)),
      error: null,
    };
  } catch {
    return {
      tickers: [] as string[],
      error: 'Your saved portfolio could not be read. You can start a new list here.',
    };
  }
}

export function PortfolioProvider({ children }: { children: ReactNode }) {
  const [initial] = useState(readSavedPortfolio);
  const [tickers, setTickers] = useState(initial.tickers);
  const [persistenceError, setPersistenceError] = useState<string | null>(initial.error);
  const [message, setMessage] = useState('');
  const lastPersisted = useRef(serializePortfolio(initial.tickers));
  useEffect(() => {
    const serialized = serializePortfolio(tickers);
    if (serialized === lastPersisted.current) return;
    try {
      window.localStorage.setItem(PORTFOLIO_STORAGE_KEY, serialized);
      lastPersisted.current = serialized;
    } catch {
      setPersistenceError(
        'Changes are available in this tab, but this browser could not save them. They may be lost on reload.',
      );
    }
  }, [tickers]);
  useEffect(() => {
    const sync = (event: StorageEvent) => {
      if (event.key !== PORTFOLIO_STORAGE_KEY && event.key !== null) return;
      try {
        if (event.storageArea !== window.localStorage) return;
        const next = parsePortfolio(event.newValue);
        lastPersisted.current = serializePortfolio(next);
        setTickers((current) =>
          serializePortfolio(current) === serializePortfolio(next) ? current : next,
        );
        setPersistenceError(null);
      } catch {
        setPersistenceError(
          'A saved update from another tab could not be read. Your current list is unchanged.',
        );
      }
    };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);
  const toggle = (ticker: string) => {
    setMessage(
      tickers.includes(ticker)
        ? `${ticker} removed from portfolio.`
        : `${ticker} added to portfolio.`,
    );
    setPersistenceError(null);
    setTickers((current) => togglePortfolioTicker(current, ticker));
  };
  const remove = (ticker: string) => {
    setMessage(`${ticker} removed from portfolio.`);
    setPersistenceError(null);
    setTickers((current) => current.filter((saved) => saved !== ticker));
  };
  return (
    <PortfolioContext.Provider value={{ tickers, persistenceError, toggle, remove }}>
      {children}
      <p className="sr-only" role="status" aria-live="polite">
        {message}
      </p>
    </PortfolioContext.Provider>
  );
}
export function usePortfolio() {
  const value = useContext(PortfolioContext);
  if (!value) throw new Error('PortfolioProvider is missing');
  return value;
}
