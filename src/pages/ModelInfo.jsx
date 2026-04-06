export default function ModelInfo() {
  const metrics = [
    { value: '99.57%', label: 'Accuracy' },
    { value: '0.9998', label: 'ROC-AUC' },
    { value: '0.9933', label: 'Macro F1' },
    { value: '98.05%', label: 'Attack Precision' },
    { value: '99.83%', label: 'Attack Recall' },
    { value: '0.522ms', label: 'Edge Latency' },
    { value: '0.9993', label: 'AP Score' },
    { value: '0.6587', label: 'Optimal Threshold' },
    { value: '99.51%', label: 'Benign Accuracy' },
  ];

  const goldenFeatures = [
    'Packet Length Variance', 'Bwd Packet Length Max', 'Max Packet Length',
    'Total Length of Fwd Packets', 'Packet Length Mean', 'Fwd Packet Length Mean',
    'Fwd IAT Std', 'Fwd Packet Length Max', 'Bwd Header Length', 'Fwd Header Length',
    'PSH Flag Count', 'Flow IAT Std', 'Init_Win_bytes_backward', 'Flow IAT Mean',
    'Bwd Packet Length Min', 'Flow IAT Max', 'min_seg_size_forward', 'Min Packet Length',
    'Init_Win_bytes_forward', 'act_data_pkt_fwd',
  ];

  const attackData = [
    { type: 'Heartbleed', flows: 2, rate: 100.00 },
    { type: 'PortScan', flows: 31954, rate: 99.99 },
    { type: 'DDoS', flows: 25599, rate: 99.93 },
    { type: 'DoS Hulk', flows: 46075, rate: 99.90 },
    { type: 'FTP-Patator', flows: 1593, rate: 99.87 },
    { type: 'DoS slowloris', flows: 1146, rate: 99.65 },
    { type: 'SSH-Patator', flows: 1189, rate: 99.50 },
    { type: 'DoS Slowhttptest', flows: 1081, rate: 98.98 },
    { type: 'DoS GoldenEye', flows: 2069, rate: 98.84 },
    { type: 'Web Attack Brute Force', flows: 319, rate: 96.24 },
    { type: 'Web Attack XSS', flows: 129, rate: 94.57 },
    { type: 'Bot', flows: 362, rate: 86.46 },
    { type: 'SQL Injection', flows: 3, rate: 66.67 },
    { type: 'Infiltration', flows: 8, rate: 12.50 },
  ];

  const rateColor = (rate) => {
    if (rate >= 99) return 'text-green-400';
    if (rate >= 95) return 'text-amber-400';
    return 'text-red-400';
  };

  return (
    <div>
      {/* Section 1: Model Performance */}
      <div className="bg-navy-900 border border-blue-900/40 rounded-xl p-6 mb-6">
        <h2 className="text-xs font-mono text-blue-400/70 tracking-widest mb-4">MODEL PERFORMANCE</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {metrics.map((m, i) => (
            <div key={i} className="bg-navy-800 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold font-mono text-blue-400">{m.value}</div>
              <div className="text-xs text-gray-500 mt-1">{m.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 2: 20 Golden Features */}
      <div className="bg-navy-900 border border-blue-900/40 rounded-xl p-6 mb-6">
        <h2 className="text-xs font-mono text-blue-400/70 tracking-widest mb-4">20 GOLDEN FEATURES</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {goldenFeatures.map((feat, i) => (
            <div key={i} className="bg-navy-800 rounded-lg px-3 py-2 flex items-center gap-3">
              <span className="w-6 h-6 rounded bg-blue-500/10 text-blue-400 text-xs flex items-center justify-center flex-shrink-0 font-mono">
                {i + 1}
              </span>
              <span className="text-xs font-mono text-gray-300">{feat}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Section 3: Methodology */}
      <div className="bg-navy-900 border border-blue-900/40 rounded-xl p-6 mb-6">
        <h2 className="text-xs font-mono text-blue-400/70 tracking-widest mb-4">METHODOLOGY</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-navy-800 rounded-lg p-4 border-l-2 border-blue-500">
            <h3 className="text-sm font-mono text-blue-400 mb-2">Payload-Agnostic Defense</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              By dropping Destination Port and relying on 20 statistical flow features like Packet Length
              Variance and Flow IAT Max, the model classifies AES-256 encrypted traffic purely from
              behavioral math — no payload inspection required.
            </p>
          </div>
          <div className="bg-navy-800 rounded-lg p-4 border-l-2 border-amber-500">
            <h3 className="text-sm font-mono text-amber-400 mb-2">Leakage Correction</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              SHAP analysis revealed Destination Port as the #2 most influential feature — the model was
              memorizing port→label shortcuts. Dropping it before the train/test split caused F1 to drop
              from 0.9946 to 0.9938, proving the model now learns genuine encrypted traffic signatures.
            </p>
          </div>
        </div>
      </div>

      {/* Section 4: Dataset */}
      <div className="bg-navy-900 border border-blue-900/40 rounded-xl p-6 mb-6">
        <h2 className="text-xs font-mono text-blue-400/70 tracking-widest mb-4">DATASET — CIC-IDS2017</h2>

        {/* Dataset Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          {[
            { value: '2.83M', label: 'Flows' },
            { value: '15', label: 'Attack Types' },
            { value: '80/20', label: 'Train-Test Split' },
            { value: '7', label: 'Capture Days' },
          ].map((s, i) => (
            <div key={i} className="bg-navy-800 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold font-mono text-blue-400">{s.value}</div>
              <div className="text-xs text-gray-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Per-Attack Detection Table */}
        <div className="bg-navy-800 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-navy-700/50">
                <th className="text-xs font-mono text-blue-400/70 tracking-widest px-4 py-3 text-left">Attack Type</th>
                <th className="text-xs font-mono text-blue-400/70 tracking-widest px-4 py-3 text-right">Flows Tested</th>
                <th className="text-xs font-mono text-blue-400/70 tracking-widest px-4 py-3 text-right">Detection Rate</th>
              </tr>
            </thead>
            <tbody>
              {attackData.map((row, i) => (
                <tr key={i} className="border-t border-navy-700 hover:bg-navy-700/30 transition-colors">
                  <td className="px-4 py-2.5 text-xs font-mono text-gray-300">{row.type}</td>
                  <td className="px-4 py-2.5 text-xs font-mono text-gray-400 text-right">
                    {row.flows.toLocaleString()}
                  </td>
                  <td className={`px-4 py-2.5 text-xs font-mono text-right font-medium ${rateColor(row.rate)}`}>
                    {row.rate.toFixed(2)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-gray-600 font-mono mt-2">
          ⚠ Infiltration (12.50%) and Bot (86.46%) reflect class imbalance — only 36 and 1966 training samples respectively.
        </p>
      </div>
    </div>
  );
}
