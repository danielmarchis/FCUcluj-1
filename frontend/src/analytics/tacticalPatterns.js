// Tactical Pattern Detection via KMeans Clustering

function euclidean(a, b) {
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += (a[i] - b[i]) ** 2;
  return Math.sqrt(sum);
}

function kmeans(data, k, maxIter = 50) {
  if (data.length === 0) return { labels: [], centroids: [] };
  const dim = data[0].length;
  
  // Init centroids with k-means++ style
  const centroids = [data[Math.floor(Math.random() * data.length)].slice()];
  while (centroids.length < k) {
    const dists = data.map(d => Math.min(...centroids.map(c => euclidean(d, c))));
    const totalDist = dists.reduce((a, b) => a + b, 0);
    let r = Math.random() * totalDist;
    for (let i = 0; i < data.length; i++) {
      r -= dists[i];
      if (r <= 0) { centroids.push(data[i].slice()); break; }
    }
  }

  let labels = new Array(data.length).fill(0);
  
  for (let iter = 0; iter < maxIter; iter++) {
    // Assign
    const newLabels = data.map(d => {
      let best = 0, bestDist = Infinity;
      for (let c = 0; c < k; c++) {
        const dist = euclidean(d, centroids[c]);
        if (dist < bestDist) { bestDist = dist; best = c; }
      }
      return best;
    });

    // Check convergence
    if (newLabels.every((l, i) => l === labels[i])) break;
    labels = newLabels;

    // Update centroids
    for (let c = 0; c < k; c++) {
      const members = data.filter((_, i) => labels[i] === c);
      if (members.length === 0) continue;
      for (let d = 0; d < dim; d++) {
        centroids[c][d] = members.reduce((s, m) => s + m[d], 0) / members.length;
      }
    }
  }
  
  return { labels, centroids };
}

const PATTERN_NAMES = ['Build-Up Play', 'Counter-Attack', 'Direct Play', 'Wing-Focused'];
const PATTERN_COLORS = ['#00d4ff', '#ff4757', '#ffb800', '#00ff88'];

export function detectPatterns(matches) {
  if (matches.length < 4) return { clusters: [], matchAssignments: [] };
  
  // Extract feature vectors per match
  const features = matches.map(m => {
    let totalPasses = 0, forwardPasses = 0, longPasses = 0, crosses = 0;
    let progressiveRuns = 0, throughPasses = 0, smartPasses = 0;
    let shots = 0, touchInBox = 0, progressivePasses = 0;
    let recoveries = 0, counterpress = 0, lateralPasses = 0;

    for (const p of m.p) {
      totalPasses += p.t.passes || 0;
      forwardPasses += p.t.forwardPasses || 0;
      longPasses += p.t.longPasses || 0;
      crosses += p.t.crosses || 0;
      progressiveRuns += p.t.progressiveRun || 0;
      throughPasses += p.t.throughPasses || 0;
      smartPasses += p.t.smartPasses || 0;
      shots += p.t.shots || 0;
      touchInBox += p.t.touchInBox || 0;
      progressivePasses += p.t.progressivePasses || 0;
      recoveries += p.t.recoveries || 0;
      counterpress += p.t.counterpressingRecoveries || 0;
      lateralPasses += p.t.lateralPasses || 0;
    }

    const safe = v => (isFinite(v) ? v : 0);
    return [
      safe(forwardPasses / (totalPasses || 1)),     // Directness
      safe(longPasses / (totalPasses || 1)),         // Long ball ratio
      safe(crosses / (totalPasses || 1)),            // Crossing frequency
      safe(progressiveRuns / (shots || 1)),          // Counter-attack indicator
      safe(throughPasses / (totalPasses || 1)),      // Through ball ratio
      safe(touchInBox / (shots || 1)),               // Box presence
      safe(counterpress / (recoveries || 1)),        // Pressing intensity
      safe(lateralPasses / (totalPasses || 1)),      // Build-up indicator
    ];
  });

  // Normalize features
  const dim = features[0].length;
  const mins = Array(dim).fill(Infinity);
  const maxs = Array(dim).fill(-Infinity);
  for (const f of features) {
    for (let d = 0; d < dim; d++) {
      mins[d] = Math.min(mins[d], f[d]);
      maxs[d] = Math.max(maxs[d], f[d]);
    }
  }
  const normalized = features.map(f =>
    f.map((v, d) => (maxs[d] - mins[d] > 0 ? (v - mins[d]) / (maxs[d] - mins[d]) : 0))
  );

  const k = Math.min(4, matches.length);
  const { labels, centroids } = kmeans(normalized, k);

  // Classify clusters by their centroid characteristics
  const clusterInfo = centroids.map((c, idx) => {
    // Determine pattern type based on centroid values
    const directness = c[0];
    const longBall = c[1];
    const crossing = c[2];
    const counterIndicator = c[3];
    const buildUp = c[7];

    let patternType;
    if (counterIndicator > 0.6) patternType = 'Counter-Attack';
    else if (buildUp > 0.5 && directness < 0.4) patternType = 'Build-Up Play';
    else if (crossing > 0.5) patternType = 'Wing-Focused';
    else patternType = 'Direct Play';

    const matchCount = labels.filter(l => l === idx).length;

    return {
      id: idx,
      name: patternType,
      color: PATTERN_COLORS[PATTERN_NAMES.indexOf(patternType)] || PATTERN_COLORS[idx],
      matchCount,
      centroid: c,
    };
  });

  const matchAssignments = matches.map((m, i) => ({
    matchIdx: m.idx,
    label: m.label,
    score: m.scoreLabel,
    result: m.result,
    cluster: labels[i],
    patternName: clusterInfo[labels[i]]?.name || 'Unknown',
    patternColor: clusterInfo[labels[i]]?.color || '#888',
  }));

  return { clusters: clusterInfo, matchAssignments };
}
