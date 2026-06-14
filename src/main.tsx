import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { GlobalProvider } from './logic/context/GlobalContext';
import { config } from './logic/utils/config';

// Validate required environment variables at startup
config.validate();

// Register Service Worker for PWA
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('SW registered: ', registration);
      })
      .catch(registrationError => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

import { ErrorBoundary } from './ui/components/common/ErrorBoundary';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <GlobalProvider>
        <App />
      </GlobalProvider>
    </ErrorBoundary>
  </StrictMode>,
);
