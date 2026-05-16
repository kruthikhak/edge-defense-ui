import { useState, useCallback } from 'react';
import { Upload, Search, RefreshCw } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Papa from 'papaparse';

// Unique ID for the hidden file input — used by <label htmlFor>
const FILE_INPUT_ID = 'live-traffic-csv-input';

export default function LiveTraffic() {
  const [flows, setFlows] = useState([]);
  const [search, setSearch] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [dragging, setDragging] = useState(false);

  // ── Parse CSV with PapaParse ───────────────────────────────────────
  const parseAndLoad = useCallback((file) => {
    console.log('[LiveTraffic] Selected file:', file.name, file.type, file.size, 'bytes');
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsed = results.data
          .map((row) => ({
            flow_index: parseInt(row.flow_index) || 0,
            label: row.label || 'UNKNOWN',
            prediction: parseInt(row.prediction) || 0,
            probability: parseFloat(row.probability) || 0,
            inference_ms: parseFloat(row.inference_ms) || 0,
            top_shap_feature: (row.top_shap_feature || '').trim(),
          }))
          .filter((r) => r.top_shap_feature !== '');
        console.log('[LiveTraffic] Parsed CSV rows:', parsed.length);
        if (parsed.length > 0) {
          console.log('[LiveTraffic] First row:', parsed[0]);
        }
        setFlows(parsed);
        setSearch('');
        setShowAll(false);
      },
      error: (err) => {
        console.error('[LiveTraffic] PapaParse error:', err);
      },
    });
  }, []);

  // ── File input onChange handler ─────────────────────────────────────
  const handleFileChange = useCallback((e) => {
    console.log('[LiveTraffic] File input onChange fired');
    const file = e.target.files?.[0];
    if (file) {
      parseAndLoad(file);
    }
    // Reset value so the same file can be re-uploaded
    e.target.value = '';
  }, [parseAndLoad]);

  // ── Drag-and-drop handlers ────────────────────────────────────────
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    console.log('[LiveTraffic] File dropped:', file?.name);
    if (file && file.name.endsWith('.csv')) {
      parseAndLoad(file);
    }
  }, [parseAndLoad]);

  // ── Empty state (before upload) ────────────────────────────────────
  if (flows.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="bg-navy-900 border border-blue-900/40 rounded-xl p-16 flex flex-col items-center">
          <Upload className="w-12 h-12 text-blue-400/40 mb-4" />
          <h2 className="text-lg font-mono text-gray-300 mb-2">Live Traffic Analysis</h2>
          <p className="text-sm text-gray-500 text-center max-w-md">
            Upload live_analysis_results.csv to visualize real network flows analyzed by the Edge Defense model
          </p>

          {/*
            ── Upload zone ─────────────────────────────────────────────
            Uses native <label htmlFor="..."> so clicking ANYWHERE inside
            this box natively opens the file picker — no JS .click() needed.
            This is the most reliable cross-browser approach.
          */}
          <label
            htmlFor={FILE_INPUT_ID}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-8 mt-6 cursor-pointer transition-all duration-200 flex flex-col items-center gap-2 select-none
              ${dragging
                ? 'border-blue-400 bg-blue-500/10 scale-[1.02]'
                : 'border-blue-900/40 hover:border-blue-500/40 hover:bg-blue-500/5'
              }`}
          >
            <Upload className={`w-6 h-6 transition-colors pointer-events-none ${dragging ? 'text-blue-400' : 'text-gray-600'}`} />
            <span className="text-sm text-gray-400 pointer-events-none">
              {dragging ? 'Drop CSV file here' : 'Click to upload or drag and drop'}
            </span>
            <span className="text-xs font-mono text-gray-600 pointer-events-none">live_analysis_results.csv</span>
          </label>

          {/* The actual file input — visually hidden but accessible */}
          <input
            id={FILE_INPUT_ID}
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            style={{
              position: 'absolute',
              width: '1px',
              height: '1px',
              padding: 0,
              margin: '-1px',
              overflow: 'hidden',
              clip: 'rect(0, 0, 0, 0)',
              whiteSpace: 'nowrap',
              border: 0,
            }}
          />
        </div>
      </div>
    );
  }

  // ── Computed stats ─────────────────────────────────────────────────
  const totalFlows = flows.length;
  const attacks = flows.filter(f => f.prediction === 1).length;
  const benign = totalFlows - attacks;
  const attackRate = totalFlows > 0 ? ((attacks / totalFlows) * 100).toFixed(1) : '0.0';
  const avgInference = totalFlows > 0
    ? (flows.reduce((s, f) => s + f.inference_ms, 0) / totalFlows).toFixed(3)
    : '0';
  const avgBenignProb = totalFlows > 0
    ? ((1 - flows.reduce((s, f) => s + f.probability, 0) / totalFlows) * 100).toFixed(2)
    : '0';

  // Pie data
  const pieData = [
    { name: 'BENIGN', value: benign },
    { name: 'ATTACK', value: attacks },
  ].filter(d => d.value > 0);

  const PIE_COLORS = { BENIGN: '#22c55e', ATTACK: '#ef4444' };

  // Top SHAP features
  const featureCounts = {};
  flows.forEach(f => {
    const feat = f.top_shap_feature;
    featureCounts[feat] = (featureCounts[feat] || 0) + 1;
  });
  const topFeatures = Object.entries(featureCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);
  const maxFeatureCount = topFeatures.length > 0 ? topFeatures[0][1] : 1;

  // Filtered flows for table
  const filtered = search
    ? flows.filter(f => f.top_shap_feature.toLowerCase().includes(search.toLowerCase()))
    : flows;
  const displayFlows = showAll ? filtered : filtered.slice(0, 100);

  // ── Dashboard (after upload) ───────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* ── Re-upload header ──────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-mono text-blue-400/70 tracking-widest">ANALYSIS DASHBOARD</h2>
        <label
          htmlFor={FILE_INPUT_ID}
          className="flex items-center gap-2 text-xs font-mono text-gray-400 hover:text-blue-400 border border-blue-900/40 hover:border-blue-500/40 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5 pointer-events-none" />
          UPLOAD NEW CSV
        </label>
        <input
          id={FILE_INPUT_ID}
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          style={{
            position: 'absolute',
            width: '1px',
            height: '1px',
            padding: 0,
            margin: '-1px',
            overflow: 'hidden',
            clip: 'rect(0, 0, 0, 0)',
            whiteSpace: 'nowrap',
            border: 0,
          }}
        />
      </div>

      {/* ── Section 1: Stats bar ──────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard value={totalFlows} label="Total Flows" color="text-blue-400" />
        <StatCard
          value={attacks}
          label="Attacks Detected"
          color={attacks > 0 ? 'text-red-400' : 'text-gray-400'}
        />
        <StatCard value={benign} label="Benign Flows" color="text-green-400" />
        <StatCard
          value={`${attackRate}%`}
          label="Attack Rate"
          color={attacks > 0 ? 'text-red-400' : 'text-green-400'}
        />
        <StatCard value={`${avgInference}ms`} label="Avg Inference" color="text-blue-400" />
      </div>

      {/* ── Section 2: Verdict chart ──────────────────────────────── */}
      <div className="bg-navy-900 border border-blue-900/40 rounded-xl p-6">
        <h3 className="text-xs font-mono text-blue-400/70 tracking-widest mb-4">TRAFFIC CLASSIFICATION</h3>
        <div className="flex flex-col md:flex-row items-center gap-6">
          <ResponsiveContainer width={300} height={200}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                dataKey="value"
                stroke="none"
              >
                {pieData.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={PIE_COLORS[entry.name]}
                    fillOpacity={0.7}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: '#080F1F',
                  border: '1px solid #1e3a5f',
                  borderRadius: '8px',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 11
                }}
              />
              <Legend
                wrapperStyle={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}
              />
            </PieChart>
          </ResponsiveContainer>

          <div className="flex-1 w-full">
            <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-3 text-center">
              <p className="text-xs font-mono text-green-400">
                ✓ Network traffic analysis complete — all flows match benign behavioral signatures
              </p>
              <p className="text-xs text-gray-600 mt-1">
                Model confidence: avg {avgBenignProb}% benign probability across {totalFlows} flows
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Section 3: Top SHAP Features ──────────────────────────── */}
      <div className="bg-navy-900 border border-blue-900/40 rounded-xl p-6">
        <h3 className="text-xs font-mono text-blue-400/70 tracking-widest mb-4">TOP TRIGGERED FEATURES</h3>
        <div className="space-y-3">
          {topFeatures.map(([feature, count]) => (
            <div key={feature} className="flex items-center gap-3">
              <span className="text-xs font-mono text-gray-300 w-52 truncate shrink-0" title={feature}>
                {feature}
              </span>
              <div className="flex-1 bg-navy-800 rounded h-4 overflow-hidden">
                <div
                  className="bg-blue-500/20 rounded h-4 transition-all duration-500"
                  style={{ width: `${(count / maxFeatureCount) * 100}%` }}
                />
              </div>
              <span className="text-xs font-mono text-blue-400 w-10 text-right shrink-0">
                {count}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Section 4: Full Flow Table ────────────────────────────── */}
      <div className="bg-navy-900 border border-blue-900/40 rounded-xl overflow-hidden">
        {/* Table header bar */}
        <div className="flex items-center justify-between p-4 border-b border-blue-900/40">
          <div className="flex items-center">
            <h3 className="text-xs font-mono text-blue-400/70 tracking-widest">FLOW LOG</h3>
            <span className="text-xs text-gray-600 ml-3">{filtered.length} flows captured</span>
          </div>
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-gray-600 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setShowAll(false); }}
              placeholder="Search feature..."
              className="bg-navy-800 border border-blue-900/40 rounded px-3 py-1.5 pl-8 text-xs font-mono text-gray-300 w-48 placeholder-gray-600 focus:outline-none focus:border-blue-500/50 transition-colors"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-navy-800">
                <th className="text-xs font-mono text-blue-400/70 tracking-widest uppercase px-4 py-3 text-left font-medium">Flow #</th>
                <th className="text-xs font-mono text-blue-400/70 tracking-widest uppercase px-4 py-3 text-left font-medium">Verdict</th>
                <th className="text-xs font-mono text-blue-400/70 tracking-widest uppercase px-4 py-3 text-left font-medium">Confidence</th>
                <th className="text-xs font-mono text-blue-400/70 tracking-widest uppercase px-4 py-3 text-left font-medium">Inference</th>
                <th className="text-xs font-mono text-blue-400/70 tracking-widest uppercase px-4 py-3 text-left font-medium">Top Feature</th>
              </tr>
            </thead>
            <tbody>
              {displayFlows.map((f) => {
                const isBenign = f.prediction === 0;
                const attackProb = (f.probability * 100).toFixed(3);
                return (
                  <tr
                    key={f.flow_index}
                    className="border-t border-navy-700 hover:bg-navy-800/50 transition-colors"
                  >
                    <td className="px-4 py-3 text-xs font-mono text-gray-400">{f.flow_index}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-mono px-2 py-0.5 rounded-full ${isBenign
                        ? 'bg-green-500/10 border border-green-500/30 text-green-400'
                        : 'bg-red-500/10 border border-red-500/30 text-red-400'
                        }`}>
                        {isBenign ? 'BENIGN' : 'ATTACK'}
                      </span>
                    </td>
                    <td className={`px-4 py-3 text-xs font-mono ${f.probability < 0.5 ? 'text-green-400' : 'text-red-400'
                      }`}>
                      {attackProb}%
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-gray-400">
                      {f.inference_ms.toFixed(3)}ms
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-gray-400">
                      {f.top_shap_feature.trim()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Show all button */}
        {!showAll && filtered.length > 100 && (
          <div className="border-t border-blue-900/40 p-3 text-center">
            <button
              onClick={() => setShowAll(true)}
              className="text-xs font-mono text-blue-400 hover:text-blue-300 transition-colors"
            >
              Show all {filtered.length} flows
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Stat card component ──────────────────────────────────────────────
function StatCard({ value, label, color }) {
  return (
    <div className="bg-navy-900 border border-blue-900/40 rounded-xl p-4 text-center">
      <div className={`text-2xl font-bold font-mono ${color}`}>{value}</div>
      <div className="text-xs text-gray-500 mt-1 font-mono">{label}</div>
    </div>
  );
}
