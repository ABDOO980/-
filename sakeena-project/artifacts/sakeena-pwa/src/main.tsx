import { createRoot } from 'react-dom/client';

import App from './App';
import { ErrorBoundary } from '@/components/error-boundary';

import './index.css';
import { applyTextScale, getTextScale } from '@/lib/text-size';

applyTextScale(getTextScale());

// A page file that no longer exists (after an update) -> reload once to get the new version.
window.addEventListener('vite:preloadError', () => {
  if (!sessionStorage.getItem('sakeena.reloaded')) {
    sessionStorage.setItem('sakeena.reloaded', '1');
    window.location.reload();
  }
});

createRoot(document.getElementById('root')!, {
  // Keeps caught errors off reportError(), which would raise the dev overlay.
  onCaughtError: (error, errorInfo) => {
    console.error(error, errorInfo.componentStack);
  },
}).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>,
);
