import { useAuth, useUser, useClerk, SignOutButton } from '@clerk/clerk-react';
import { useEffect, useState } from 'react';
import { setAuthToken } from './api/client';
import { Shield, Activity, Clock, Info, Wifi, WifiOff, LogIn, UserPlus } from 'lucide-react';
import Analyzer from './pages/Analyzer';
import SHAPViewer from './pages/SHAPViewer';
import History from './pages/History';
import ModelInfo from './pages/ModelInfo';

export default function App() {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const { user } = useUser();
  const clerk = useClerk();
  const [tab, setTab] = useState('analyzer');
  const [apiOffline, setApiOffline] = useState(false);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  // Detect if Clerk SDK takes too long to initialize
  useEffect(() => {
    if (!isLoaded) {
      const timer = setTimeout(() => setLoadingTimeout(true), 8000);
      return () => clearTimeout(timer);
    }
  }, [isLoaded]);

  // Set auth token for API calls once signed in
  useEffect(() => {
    if (isSignedIn) {
      getToken().then(token => setAuthToken(token));
    }
  }, [isSignedIn, getToken]);

  // ── Loading state ──────────────────────────────────────────────────
  if (!isLoaded) return (
    <div className="min-h-screen bg-navy-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-blue-400 text-sm font-mono tracking-widest">INITIALIZING...</span>
        {loadingTimeout && (
          <div className="mt-4 text-center max-w-sm px-4">
            <p className="text-amber-400 text-xs font-mono mb-2">Taking longer than expected…</p>
            <p className="text-gray-500 text-xs leading-relaxed">
              Try clearing cookies &amp; cache for this site, or disable ad-blockers.
            </p>
          </div>
        )}
      </div>
    </div>
  );

  // ── Auth screen — redirect to Clerk hosted pages ───────────────────
  if (!isSignedIn) return (
    <div className="min-h-screen bg-navy-950 flex items-center justify-center relative overflow-hidden">
      {/* Grid background */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: 'linear-gradient(#3B82F6 1px, transparent 1px), linear-gradient(90deg, #3B82F6 1px, transparent 1px)',
        backgroundSize: '40px 40px'
      }} />

      <div className="w-full max-w-md z-10 px-4">
        {/* Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-500/10 border border-blue-500/30 mb-4">
            <Shield className="w-8 h-8 text-blue-400" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Edge Defense</h1>
          <p className="text-blue-400/70 mt-2 text-sm font-mono">AI-POWERED NETWORK INTRUSION DETECTION</p>
          <div className="flex items-center justify-center gap-2 mt-3">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-gray-500 font-mono">XGBoost · SHAP · CIC-IDS2017 · 99.57% Accuracy</span>
          </div>
        </div>

        {/* Auth card */}
        <div className="bg-navy-900 border border-blue-900/40 rounded-xl p-8">
          <h2 className="text-white text-lg font-semibold text-center mb-2">Welcome back</h2>
          <p className="text-gray-500 text-sm text-center mb-6">Sign in to access the dashboard</p>

          <button
            onClick={() => {
              setRedirecting(true);
              clerk.redirectToSignIn({ redirectUrl: window.location.origin });
            }}
            disabled={redirecting}
            className="w-full bg-blue-600 hover:bg-blue-500 active:scale-[0.98] disabled:opacity-60 transition-all py-3 rounded-lg font-mono text-sm font-medium tracking-wider text-white flex items-center justify-center gap-2.5 mb-3"
          >
            {redirecting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <LogIn className="w-4 h-4" />
            )}
            SIGN IN
          </button>

          <button
            onClick={() => {
              setRedirecting(true);
              clerk.redirectToSignUp({ redirectUrl: window.location.origin });
            }}
            disabled={redirecting}
            className="w-full border border-blue-500/30 hover:border-blue-500/60 hover:bg-blue-500/5 active:scale-[0.98] disabled:opacity-60 transition-all py-3 rounded-lg font-mono text-sm font-medium tracking-wider text-blue-400 flex items-center justify-center gap-2.5"
          >
            {redirecting ? (
              <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <UserPlus className="w-4 h-4" />
            )}
            CREATE ACCOUNT
          </button>

          <div className="mt-6 pt-4 border-t border-blue-900/40">
            <p className="text-xs text-gray-600 font-mono text-center">
              Secured by Clerk · Development Mode
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  // ── Authenticated dashboard ────────────────────────────────────────
  const tabs = [
    { id: 'analyzer', label: 'Analyzer', icon: Activity },
    { id: 'shap', label: 'SHAP Viewer', icon: Shield },
    { id: 'history', label: 'History', icon: Clock },
    { id: 'model', label: 'Model Info', icon: Info },
  ];

  return (
    <div className="min-h-screen bg-navy-950 text-gray-100">
      {apiOffline && (
        <div className="bg-amber-500/10 border-b border-amber-500/30 px-6 py-2 flex items-center gap-2">
          <WifiOff className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span className="text-xs text-amber-400 font-mono">API OFFLINE — Railway may be cold-starting. First request can take 30s.</span>
        </div>
      )}
      <header className="bg-navy-900 border-b border-blue-900/40 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded bg-blue-500/10 border border-blue-500/30">
            <Shield className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <span className="font-bold text-white text-sm tracking-tight">EDGE DEFENSE</span>
            <span className="ml-2 text-xs font-mono text-blue-400/60">v1.0</span>
          </div>
          <div className="flex items-center gap-1 ml-4">
            <Wifi className="w-3 h-3 text-green-400" />
            <span className="text-xs text-green-400 font-mono">LIVE</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500 font-mono hidden sm:block">{user?.emailAddresses[0]?.emailAddress}</span>
          <SignOutButton>
            <button className="text-xs text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 px-3 py-1.5 rounded font-mono transition-colors">
              SIGN OUT
            </button>
          </SignOutButton>
        </div>
      </header>
      <nav className="bg-navy-900 border-b border-blue-900/40 px-6 flex gap-0">
        {tabs.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-5 py-3.5 text-xs font-mono font-medium border-b-2 transition-all ${
                tab === t.id
                  ? 'border-blue-500 text-blue-400 bg-blue-500/5'
                  : 'border-transparent text-gray-500 hover:text-gray-300 hover:bg-white/5'
              }`}>
              <Icon className="w-3.5 h-3.5" />
              {t.label.toUpperCase()}
            </button>
          );
        })}
      </nav>
      <main className="p-6 max-w-7xl mx-auto">
        {tab === 'analyzer' && <Analyzer setApiOffline={setApiOffline} />}
        {tab === 'shap' && <SHAPViewer setApiOffline={setApiOffline} />}
        {tab === 'history' && <History setApiOffline={setApiOffline} />}
        {tab === 'model' && <ModelInfo />}
      </main>
    </div>
  );
}
