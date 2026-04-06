import { useState, useEffect } from 'react';
import api from '../api/client';
import { Activity } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Cell
} from 'recharts';

export default function SHAPViewer({ setApiOffline }) {
  const [flows, setFlows] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [flowsLoading, setFlowsLoading] = useState(true);

  useEffect(() => {
    setFlowsLoading(true);
    api.get('/sample-flows')
      .then(res => {
        setFlows(res.data);
        setApiOffline(false);
        setFlowsLoading(false);
      })
      .catch(() => {
        setApiOffline(true);
        setError('Failed to load sample flows. API may be cold-starting — try again in 30s.');
        setFlowsLoading(false);
      });
  }, []);

  const analyze = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/sample-analyze/${selectedIndex}`);
      setResult(res.data);
      setApiOffline(false);
    } catch {
      setApiOffline(true);
      setError('Analysis failed. API may be offline or cold-starting.');
    } finally {
      setLoading(false);
    }
  };

  const shapData = result
    ? result.feature_names.map((name, i) => ({
        name: name.trim(),
        value: parseFloat(result.shap_values[i].toFixed(4))
      })).sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
    : [];

  const sorted = [...shapData].sort((a, b) => b.value - a.value);
  const top3Pos = sorted.slice(0, 3);
  const top2Neg = [...shapData].sort((a, b) => a.value - b.value).slice(0, 2);

  return (
    <div>
      {/* Controls */}
      <div className="bg-navy-900 border border-blue-900/40 rounded-xl p-6 mb-6">
        <h2 className="text-xs font-mono font-medium text-blue-400 tracking-widest mb-4">
          SHAP EXPLAINABILITY VIEWER
        </h2>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="text-xs text-gray-500 font-mono mb-1.5 block">SELECT FLOW</label>
            <select
              value={selectedIndex}
              onChange={e => setSelectedIndex(Number(e.target.value))}
              disabled={flowsLoading}
              className="w-full bg-navy-800 border border-blue-900/40 rounded-lg px-3 py-2.5 text-gray-300 font-mono text-sm focus:border-blue-500 outline-none appearance-none"
            >
              {flowsLoading ? (
                <option>Loading flows...</option>
              ) : (
                Array.from({ length: flows.length || 200 }, (_, i) => (
                  <option key={i} value={i}>Flow #{i}</option>
                ))
              )}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={analyze}
              disabled={loading || flowsLoading}
              className="bg-blue-600 hover:bg-blue-500 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all px-6 py-2.5 rounded-lg font-mono text-sm font-medium tracking-wider text-white flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ANALYZING...
                </>
              ) : (
                <>
                  <Activity className="w-4 h-4" />
                  ANALYZE & EXPLAIN
                </>
              )}
            </button>
          </div>
        </div>
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mt-3 text-xs text-red-400 font-mono">
            {error}
          </div>
        )}
      </div>

      {/* SHAP Chart */}
      {result && (
        <div className="bg-navy-900 border border-blue-900/40 rounded-xl p-6 mb-6">
          <h3 className="text-xs font-mono text-blue-400/70 tracking-widest mb-4">
            FEATURE ATTRIBUTION (SHAP VALUES)
          </h3>
          <ResponsiveContainer width="100%" height={600}>
            <BarChart layout="vertical" data={shapData} margin={{ left: 10, right: 30, top: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#111D33" horizontal={false} />
              <XAxis
                type="number"
                tick={{ fill: '#6b7280', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                axisLine={{ stroke: '#1e3a5f' }}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={195}
                tick={{ fill: '#9ca3af', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: '#080F1F',
                  border: '1px solid #1e3a5f',
                  borderRadius: '8px',
                  fontFamily: 'JetBrains Mono',
                  fontSize: 11,
                  color: '#e5e7eb'
                }}
              />
              <ReferenceLine x={0} stroke="#374151" strokeDasharray="3 3" />
              <Bar dataKey="value" radius={[0, 3, 3, 0]}>
                {shapData.map((entry, i) => (
                  <Cell key={i} fill={entry.value > 0 ? '#ef4444' : '#3b82f6'} fillOpacity={0.85} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Explainability Report */}
      {result && shapData.length > 0 && (
        <div className="bg-navy-900 border border-blue-900/40 rounded-xl p-6 mt-6">
          <h3 className="text-xs font-mono text-blue-400/70 tracking-widest mb-4">
            EXPLAINABILITY REPORT
          </h3>
          <p className="text-sm text-gray-300 leading-relaxed">
            This flow was classified as{' '}
            <strong className="text-white">{result.label}</strong> with{' '}
            <strong className="text-white">{(result.probability * 100).toFixed(2)}%</strong> confidence.
            {top3Pos.length >= 2 && (
              <>
                {' '}The strongest attack indicators were{' '}
                <strong className="text-white">{top3Pos[0].name}</strong> (+{top3Pos[0].value.toFixed(4)}) and{' '}
                <strong className="text-white">{top3Pos[1].name}</strong> (+{top3Pos[1].value.toFixed(4)}),
                pushing the score {result.prediction === 1 ? 'above' : 'toward'} the decision threshold of 0.6587.
              </>
            )}
            {top2Neg.length >= 1 && top2Neg[0].value < 0 && (
              <>
                {' '}<strong className="text-white">{top2Neg[0].name}</strong>{' '}
                ({top2Neg[0].value.toFixed(4)}) was the strongest factor suggesting benign behavior.
              </>
            )}
          </p>

          {/* Feature Chips */}
          <div className="flex flex-wrap gap-2 mt-4">
            {shapData.map((feat, i) => (
              <span
                key={i}
                className={
                  feat.value > 0
                    ? 'bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono px-2.5 py-1 rounded-full'
                    : 'bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-mono px-2.5 py-1 rounded-full'
                }
              >
                {feat.name}: {feat.value > 0 ? '+' : ''}{feat.value.toFixed(4)}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
