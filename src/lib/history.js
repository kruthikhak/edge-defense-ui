/**
 * Local history store — persists analysis results in localStorage.
 *
 * Provides a reliable history feature even when the Supabase backend
 * is unavailable.  Each entry is keyed with a UUID and timestamped.
 */

const STORAGE_KEY = 'edge_defense_history';
const MAX_ENTRIES = 200;

/** Generate a simple unique ID */
const uid = () =>
  Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);

/**
 * Read all history entries (most-recent first).
 * @returns {Array<Object>}
 */
export function getHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const entries = JSON.parse(raw);
    // Ensure sorted newest-first
    return entries.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  } catch {
    return [];
  }
}

/**
 * Save an analysis result to history.
 *
 * @param {Object} result — the raw API response from /sample-analyze or /analyze
 * @param {string} source — "sample" | "api" | "manual"
 * @returns {Object} the saved entry
 */
export function saveToHistory(result, source = 'sample') {
  try {
    const entries = getHistory();

    // Determine top SHAP feature
    let topShapFeature = '';
    if (result.shap_values && result.feature_names) {
      const absVals = result.shap_values.map(Math.abs);
      const maxIdx = absVals.indexOf(Math.max(...absVals));
      topShapFeature = result.feature_names[maxIdx] || '';
    }

    const entry = {
      id: uid(),
      created_at: new Date().toISOString(),
      prediction: result.prediction,
      label: result.label,
      probability: result.probability,
      inference_ms: result.inference_ms,
      top_shap_feature: topShapFeature,
      source,
    };

    // Prepend (newest first) and cap size
    entries.unshift(entry);
    if (entries.length > MAX_ENTRIES) entries.length = MAX_ENTRIES;

    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    console.log('[History] Saved entry:', entry.id, entry.label, entry.probability);
    return entry;
  } catch (e) {
    console.error('[History] Failed to save:', e);
    return null;
  }
}

/**
 * Clear all local history.
 */
export function clearHistory() {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Get count of history entries.
 * @returns {number}
 */
export function getHistoryCount() {
  return getHistory().length;
}
