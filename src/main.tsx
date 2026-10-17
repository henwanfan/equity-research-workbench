import { PortfolioProvider } from './state/PortfolioProvider';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@radix-ui/react-tooltip';
import '@fontsource-variable/manrope/wght.css';
import { App } from './App';
import './styles.css';

const root = document.getElementById('root');

if (!root) throw new Error('Missing application root');
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 5 * 60 * 1000, retry: false, refetchOnWindowFocus: false },
    mutations: { retry: false },
  },
});

createRoot(root).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <TooltipProvider delayDuration={180}>
          <PortfolioProvider>
            <App />
          </PortfolioProvider>
        </TooltipProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
