import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Add cache-busting version parameter to force refresh
const appVersion = Date.now().toString();
if (window.location.search === '') {
  window.history.replaceState(
    {},
    document.title,
    window.location.pathname + `?v=${appVersion}`
  );
} else if (!window.location.search.includes('v=')) {
  window.history.replaceState(
    {},
    document.title,
    window.location.pathname + window.location.search + `&v=${appVersion}`
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
