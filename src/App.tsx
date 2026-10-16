import { lazy, Suspense, useEffect, useState } from 'react';
import { Link, NavLink, Route, Routes, useLocation } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, ChartNoAxesCombined, House, PanelsTopLeft } from 'lucide-react';
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
          <span className="wordmark-divider" />
          <span className="wordmark-caption">Research workbench</span>
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
        <a
          className="header-source"
          href="https://massive.com/docs/rest/stocks/overview"
          target="_blank"
          rel="noreferrer"
        >
          Data by Massive
          <ArrowUpRight size={12} />
        </a>
      </header>
      <Suspense
        fallback={
          <main className="research-page" role="status">
            Loading research workspace…
          </main>
        }
      >
        <Routes>
          <Route path="/research" element={<ResearchPage />} />
          <Route
            path="*"
            element={
              <main className="starter-page">
                <h1>A workspace for company research.</h1>
                <p>Explore equities, understand the data, and keep your research together.</p>
                <Link className="primary-button" to={lastResearchUrl}>
                  Open research workbench
                  <ArrowRight size={16} />
                </Link>
                <small>
                  The research view is ready to explore. The full product introduction and portfolio
                  are coming in the next milestones.
                </small>
              </main>
            }
          />
        </Routes>
      </Suspense>
    </>
  );
}
