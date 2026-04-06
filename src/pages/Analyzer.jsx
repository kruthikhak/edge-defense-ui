import { useState, useEffect } from 'react';
import api from '../api/client';
import { Activity, AlertTriangle, CheckCircle } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Cell
} from 'recharts';

export default function Analyzer({ setApiOffline }) {
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
      .catch(err => {
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
    } catch (err) {
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left Panel — Flow Selector */}
      <div className="bg-navy-900 border border-blue-900/40 rounded-xl p-6">
        <h2 className="text-xs font-mono font-medium text-blue-400 tracking-widest mb-4">
          NETWORK FLOW ANALYZER
        </h2>

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

        <button
          onClick={analyze}
          disabled={loading || flowsLoading}
          className="w-full mt-4 bg-blue-600 hover:bg-blue-500 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all py-2.5 rounded-lg font-mono text-sm font-medium tracking-wider text-white flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ANALYZING...
            </>
          ) : (
            <>
              <Activity className="w-4 h-4" />
              ANALYZE FLOW
            </>
          )}
        </button>

        <p className="text-xs text-gray-600 font-mono mt-2 text-center">
          Threshold: 0.6587 · Model: XGBoost Edge · Dataset: CIC-IDS2017
        </p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mt-3 text-xs text-red-400 font-mono">
            {error}
          </div>
        )}
      </div>

      {/* Right Panel — Results */}
      {result && (
        <div className="bg-navy-900 border border-blue-900/40 rounded-xl p-6">
          {/* Verdict Banner */}
          {result.prediction === 1 ? (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse flex-shrink-0" />
              <div className="flex items-center gap-2 flex-1">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                <span className="text-red-400 font-mono font-bold text-lg">⚠ ATTACK DETECTED</span>
              </div>
              <span className="text-red-400 font-mono text-sm">{(result.probability * 100).toFixed(2)}%</span>
            </div>
          ) : (
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse flex-shrink-0" />
              <div className="flex items-center gap-2 flex-1">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="text-green-400 font-mono font-bold text-lg">✓ BENIGN TRAFFIC</span>
              </div>
              <span className="text-green-400 font-mono text-sm">{(result.probability * 100).toFixed(2)}%</span>
            </div>
          )}

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="bg-navy-800 rounded-lg px-4 py-3 text-center">
              <div className="font-mono text-sm text-white">{(result.probability * 100).toFixed(3)}%</div>
              <div className="text-xs text-gray-500 mt-1">Probability</div>
            </div>
            <div className="bg-navy-800 rounded-lg px-4 py-3 text-center">
              <div className="font-mono text-sm text-white">{result.inference_ms}ms</div>
              <div className="text-xs text-gray-500 mt-1">Inference</div>
            </div>
            <div className="bg-navy-800 rounded-lg px-4 py-3 text-center">
              <div className="font-mono text-sm text-white">0.6587</div>
              <div className="text-xs text-gray-500 mt-1">Threshold</div>
            </div>
          </div>

          {/* SHAP Chart */}
          <h3 className="text-xs font-mono text-blue-400/70 tracking-widest mt-6 mb-3">
            FEATURE ATTRIBUTION (SHAP VALUES)
          </h3>
          <ResponsiveContainer width="100%" height={480}>
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
    </div>
  );
}
