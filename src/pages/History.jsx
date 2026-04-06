import { useState, useEffect, useCallback } from 'react';
import api from '../api/client';
import { Clock, RefreshCw, Zap } from 'lucide-react';

export default function History({ setApiOffline }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [error, setError] = useState(null);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await api.get('/history');
      setRows(res.data);
      setApiOffline(false);
      setError(null);
    } catch {
      setApiOffline(true);
      setError('Failed to load history. API may be offline.');
    } finally {
      setLoading(false);
    }
  }, [setApiOffline]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => fetchHistory(), 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchHistory]);

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-xs text-red-400 font-mono">
        {error}
      </div>
    );
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="bg-navy-900 border border-blue-900/40 rounded-xl p-4 mb-4 flex items-center justify-between">
        <div className="flex items-center">
          <span className="text-xs font-mono text-blue-400/70 tracking-widest">ANALYSIS HISTORY</span>
          <span className="bg-blue-500/10 text-blue-400 text-xs font-mono px-2 py-0.5 rounded ml-2">
            {rows.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchHistory}
            className="bg-navy-800 border border-blue-900/40 text-xs font-mono text-gray-400 hover:text-white px-3 py-1.5 rounded transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className="w-3 h-3" />
            REFRESH
          </button>
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`text-xs font-mono px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 border ${
              autoRefresh
                ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                : 'bg-navy-800 border-blue-900/40 text-gray-400 hover:text-white'
            }`}
          >
            <Zap className="w-3 h-3" />
            AUTO
          </button>
        </div>
      </div>

      {loading ? (
        <div className="bg-navy-900 border border-blue-900/40 rounded-xl p-12 text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm font-mono">Loading history...</p>
        </div>
      ) : rows.length === 0 ? (
        /* Empty State */
        <div className="bg-navy-900 border border-blue-900/40 rounded-xl p-12 text-center">
          <Clock className="w-10 h-10 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-500 text-sm font-mono">No analyses yet</p>
          <p className="text-gray-600 text-xs mt-1">Run your first flow in the Analyzer tab</p>
        </div>
      ) : (
        /* Table */
        <div className="bg-navy-900 border border-blue-900/40 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-navy-800">
                <th className="text-xs font-mono text-blue-400/70 tracking-widest uppercase px-4 py-3 text-left">Time</th>
                <th className="text-xs font-mono text-blue-400/70 tracking-widest uppercase px-4 py-3 text-left">Verdict</th>
                <th className="text-xs font-mono text-blue-400/70 tracking-widest uppercase px-4 py-3 text-left">Probability</th>
                <th className="text-xs font-mono text-blue-400/70 tracking-widest uppercase px-4 py-3 text-left">Inference</th>
                <th className="text-xs font-mono text-blue-400/70 tracking-widest uppercase px-4 py-3 text-left">Source</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={row.id || i} className="border-t border-navy-700 hover:bg-navy-800/50 transition-colors">
                  <td className="px-4 py-3 text-xs font-mono text-gray-400">
                    {new Date(row.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    {row.prediction === 1 ? (
                      <span className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono px-2.5 py-1 rounded-full">
                        ATTACK
                      </span>
                    ) : (
                      <span className="bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-mono px-2.5 py-1 rounded-full">
                        BENIGN
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-white">
                    {(row.probability * 100).toFixed(3)}%
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-400">
                    {row.inference_ms}ms
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500 uppercase">
                    {row.source}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
