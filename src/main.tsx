import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

// Production mode configuration
if (import.meta.env.PROD) {
  // Disable console logs in production
  console.log = () => {};
  console.warn = () => {};
  console.error = () => {};
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);