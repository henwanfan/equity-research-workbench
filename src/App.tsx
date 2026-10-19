import { lazy, Suspense, useEffect, useState } from 'react';
import { Link, NavLink, Route, Routes, useLocation } from 'react-router-dom';
import { ChartNoAxesCombined, House, PanelsTopLeft } from 'lucide-react';
const LandingPage = lazy(() =>
  import('./pages/LandingPage').then((module) => ({ default: module.LandingPage })),
);
const ResearchPage = lazy(() =>
  import('./pages/ResearchPage').then((module) => ({ default: module.ResearchPage })),
);

export function App() {
  const location = useLocation();
  const [lastResearchUrl, setLastResearchUrl] = useState('/research');
  useEffect(() => {
    if (location.pathname === '/research')
      setLastResearchUrl(`${location.pathname}${location.search}`);
  }, [location.pathname, location.search]);
  return (
    <>
      <header className="app-header">
        <Link className="wordmark" to="/" aria-label="Equity Research home">
          <span className="brand-symbol">
            <ChartNoAxesCombined size={19} />
          </span>
          Equity
        </Link>
        <nav aria-label="Main navigation">
          <NavLink to="/" end>
            <House size={14} />
            Overview
          </NavLink>
          <NavLink to={lastResearchUrl}>
            <PanelsTopLeft size={14} />
            Workbench
          </NavLink>
        </nav>
      </header>
      <Suspense
        fallback={
          <main className="route-loading" role="status">
            <span className="sr-only">Loading workspace…</span>
            <div className="route-loading-indicator" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
          </main>
        }
      >
        <Routes>
          <Route path="/research" element={<ResearchPage />} />
          <Route path="*" element={<LandingPage researchUrl={lastResearchUrl} />} />
        </Routes>
      </Suspense>
    </>
  );
}
