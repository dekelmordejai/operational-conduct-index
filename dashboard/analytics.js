/* Static aggregation of Python-resolved canonical events. Tested against ico.engine. */
(function (root) {
  'use strict';
  const components = ['R', 'H', 'I'];
  function select(data, filters) {
    const matches = row => row.date >= filters.start && row.date <= filters.end &&
      (!filters.company || row.company === filters.company) && (!filters.line || row.line === filters.line);
    return {events: data.events.filter(matches), exposure: data.exposure.filter(matches)};
  }
  function aggregate(data, events, exposure, start, end) {
    const config = data.methodology;
    const points = Object.fromEntries(components.map(c => [c, events.reduce((sum, e) => sum + (e.component === c ? e.points : 0), 0)]));
    const issues = [];
    if (Object.values(data.source_complete).some(value => !value)) issues.push('incomplete_source');
    if (!(data.coverage.complete === true && data.coverage.start <= start && end <= data.coverage.end)) issues.push('incomplete_exposure_coverage');
    if (!exposure.length || exposure.some(e => e.km === null)) issues.push('missing_exposure');
    const cells = new Set(exposure.map(e => [e.date, e.company, e.line].join('|')));
    if (events.some(e => !cells.has([e.date, e.company, e.line].join('|')))) issues.push('event_without_exposure');
    const km = exposure.reduce((sum, e) => sum + (e.km || 0), 0);
    if (km === 0) issues.push('zero_exposure');
    const rates = issues.length ? null : Object.fromEntries(components.map(c => [c, config.rate_base * points[c] / km]));
    const scaled = rates ? Object.fromEntries(components.map(c => [c, Math.min(1, rates[c] / config.reference_caps[c])])) : null;
    const risk = scaled ? components.reduce((sum, c) => sum + config.weights[c] * scaled[c], 0) : null;
    const input = events.reduce((sum, e) => sum + e.input_count, 0);
    const latest = events.reduce((sum, e) => sum + e.evidence.length, 0);
    return {points, km, rates_per_100k_km: rates, scaled, ico_risk: risk, quality_issues: issues,
      reference_exceeded: components.filter(c => rates && rates[c] > config.reference_caps[c]),
      eligible: events.filter(e => e.component).length, observed: events.length,
      input, latest, consolidated: input - events.length, retries: input - latest,
      linked: latest - events.length,
      counts: Object.fromEntries(components.map(c => [c, events.filter(e => e.component === c).length]))};
  }
  function summarize(data, filters) {
    if (filters.start > filters.end) throw new Error('La fecha inicial debe ser anterior a la final.');
    const selection = select(data, filters);
    return {...selection, summary: aggregate(data, selection.events, selection.exposure, filters.start, filters.end)};
  }
  function groups(data, selection, field, start, end) {
    const entities = [...new Set([...selection.events, ...selection.exposure].map(e => e[field]))].sort();
    return entities.map(entity => ({entity, ...aggregate(data, selection.events.filter(e => e[field] === entity),
      selection.exposure.filter(e => e[field] === entity), start, end)}));
  }
  function isoDay(value) { return value.toISOString().slice(0, 10); }
  function timeBuckets(data, selection, start, end, mode) {
    const buckets = [];
    let cursor = new Date(start + 'T00:00:00Z');
    while (isoDay(cursor) <= end) {
      const bucketStart = isoDay(cursor);
      const next = new Date(cursor);
      if (mode === 'week') {
        const daysUntilMonday = (8 - cursor.getUTCDay()) % 7 || 7;
        next.setUTCDate(next.getUTCDate() + daysUntilMonday);
      } else { next.setUTCMonth(next.getUTCMonth() + 1, 1); }
      const last = new Date(next); last.setUTCDate(last.getUTCDate() - 1);
      const bucketEnd = isoDay(last) < end ? isoDay(last) : end;
      const events = selection.events.filter(e => e.date >= bucketStart && e.date <= bucketEnd);
      const exposure = selection.exposure.filter(e => e.date >= bucketStart && e.date <= bucketEnd);
      buckets.push({start: bucketStart, end: bucketEnd, ...aggregate(data, events, exposure, bucketStart, bucketEnd)});
      cursor = next;
    }
    return buckets;
  }
  function previousPeriod(data, filters) {
    const start = new Date(filters.start + 'T00:00:00Z');
    const end = new Date(filters.end + 'T00:00:00Z');
    const duration = Math.round((end - start) / 86400000) + 1;
    const previousEnd = new Date(start); previousEnd.setUTCDate(previousEnd.getUTCDate() - 1);
    const previousStart = new Date(start); previousStart.setUTCDate(previousStart.getUTCDate() - duration);
    if (isoDay(previousStart) < data.coverage.start) return null;
    return summarize(data, {...filters, start: isoDay(previousStart), end: isoDay(previousEnd)}).summary;
  }
  const api = {components, select, aggregate, summarize, groups, timeBuckets, previousPeriod};
  root.ICOAnalytics = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(globalThis);
