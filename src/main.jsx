import React from 'react';
import ReactDOM from 'react-dom/client';
import { ClerkProvider } from '@clerk/clerk-react';
import App from './App';
import './index.css';

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

// Fail fast with a visible error if the key is missing
if (!PUBLISHABLE_KEY) {
  document.getElementById('root').innerHTML = `
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#050B18;color:#ef4444;font-family:monospace;padding:2rem;text-align:center;">
      <div>
        <h2 style="font-size:1.25rem;margin-bottom:0.5rem;">⚠ VITE_CLERK_PUBLISHABLE_KEY is missing</h2>
        <p style="color:#9ca3af;font-size:0.75rem;">Add it to <code>.env.local</code> and restart the dev server (<code>npm run dev</code>).</p>
      </div>
    </div>
  `;
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY — check .env.local');
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      afterSignOutUrl="/"
    >
      <App />
    </ClerkProvider>
  </React.StrictMode>
);
