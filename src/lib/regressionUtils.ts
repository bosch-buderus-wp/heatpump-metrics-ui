/**
 * Robust linear regression utilities for temperature-performance curve fitting.
 * Uses iteratively reweighted least squares (IRLS) for outlier resistance.
 */

export interface RegressionResult {
  slope: number;
  intercept: number;
  rSquared: number;
  sampleSize: number;
  meanAbsoluteError: number;
}

export interface DataPoint {
  x: number;
  y: number;
}

/**
 * Computes a robust linear regression using Huber loss (IRLS method).
 * More resistant to outliers than ordinary least squares.
 *
 * @param points - Array of {x, y} data points
 * @param maxIterations - Maximum IRLS iterations
 * @param tolerance - Convergence tolerance for coefficient changes
 * @returns Regression coefficients and quality metrics
 */
export function robustLinearRegression(
  points: DataPoint[],
  maxIterations = 10,
  tolerance = 1e-4,
): RegressionResult | null {
  if (!points || points.length < 2) {
    return null;
  }

  const n = points.length;

  // Start with ordinary least squares as initial estimate
  let { slope, intercept } = ordinaryLeastSquares(points);

  // Iteratively reweighted least squares (Huber-like)
  for (let iter = 0; iter < maxIterations; iter++) {
    const residuals = points.map((p) => p.y - (slope * p.x + intercept));
    const absResiduals = residuals.map(Math.abs);
    const medianAbsResidual = median(absResiduals);

    // Huber threshold: 1.5 * MAD (median absolute deviation)
    const threshold = 1.5 * medianAbsResidual;

    // Compute weights: full weight for small residuals, downweight large ones
    const weights = absResiduals.map((absRes) => (absRes <= threshold ? 1.0 : threshold / absRes));

    // Weighted least squares update
    const prevSlope = slope;
    const prevIntercept = intercept;
    const result = weightedLeastSquares(points, weights);
    slope = result.slope;
    intercept = result.intercept;

    // Check convergence
    const change = Math.abs(slope - prevSlope) + Math.abs(intercept - prevIntercept);
    if (change < tolerance) {
      break;
    }
  }

  // Compute quality metrics
  const predictions = points.map((p) => slope * p.x + intercept);
  const residuals = points.map((p, i) => p.y - predictions[i]);
  const meanY = points.reduce((sum, p) => sum + p.y, 0) / n;
  const ssRes = residuals.reduce((sum, r) => sum + r * r, 0);
  const ssTot = points.reduce((sum, p) => sum + (p.y - meanY) ** 2, 0);
  const rSquared = ssTot > 0 ? 1 - ssRes / ssTot : 0;
  const meanAbsoluteError = residuals.reduce((sum, r) => sum + Math.abs(r), 0) / n;

  return {
    slope,
    intercept,
    rSquared,
    sampleSize: n,
    meanAbsoluteError,
  };
}

/**
 * Ordinary least squares (OLS) linear regression.
 */
function ordinaryLeastSquares(points: DataPoint[]): { slope: number; intercept: number } {
  const n = points.length;
  const sumX = points.reduce((sum, p) => sum + p.x, 0);
  const sumY = points.reduce((sum, p) => sum + p.y, 0);
  const sumXY = points.reduce((sum, p) => sum + p.x * p.y, 0);
  const sumXX = points.reduce((sum, p) => sum + p.x * p.x, 0);

  const meanX = sumX / n;
  const meanY = sumY / n;

  const numerator = sumXY - n * meanX * meanY;
  const denominator = sumXX - n * meanX * meanX;

  const slope = denominator !== 0 ? numerator / denominator : 0;
  const intercept = meanY - slope * meanX;

  return { slope, intercept };
}

/**
 * Weighted least squares.
 */
function weightedLeastSquares(
  points: DataPoint[],
  weights: number[],
): { slope: number; intercept: number } {
  const sumW = weights.reduce((sum, w) => sum + w, 0);
  const sumWX = points.reduce((sum, p, i) => sum + weights[i] * p.x, 0);
  const sumWY = points.reduce((sum, p, i) => sum + weights[i] * p.y, 0);
  const sumWXY = points.reduce((sum, p, i) => sum + weights[i] * p.x * p.y, 0);
  const sumWXX = points.reduce((sum, p, i) => sum + weights[i] * p.x * p.x, 0);

  const meanWX = sumWX / sumW;
  const meanWY = sumWY / sumW;

  const numerator = sumWXY - meanWX * sumWY;
  const denominator = sumWXX - meanWX * sumWX;

  const slope = denominator !== 0 ? numerator / denominator : 0;
  const intercept = meanWY - slope * meanWX;

  return { slope, intercept };
}

/**
 * Compute median of an array.
 */
function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

/**
 * Generate curve points for visualization.
 *
 * @param regression - Regression result
 * @param xMin - Minimum x value
 * @param xMax - Maximum x value
 * @param numPoints - Number of points to generate
 * @returns Array of {x, y} points along the fitted line
 */
export function generateCurvePoints(
  regression: RegressionResult,
  xMin: number,
  xMax: number,
  numPoints = 100,
): DataPoint[] {
  const points: DataPoint[] = [];
  const step = (xMax - xMin) / (numPoints - 1);

  for (let i = 0; i < numPoints; i++) {
    const x = xMin + i * step;
    const y = regression.slope * x + regression.intercept;
    points.push({ x, y });
  }

  return points;
}

/**
 * Tricube weight function for LOESS.
 * Returns (1 - |d|^3)^3 for |d| < 1, 0 otherwise.
 */
function tricubeWeight(distance: number, maxDistance: number): number {
  if (maxDistance === 0) return 1;
  const u = distance / maxDistance;
  if (u >= 1) return 0;
  const t = 1 - u * u * u;
  return t * t * t;
}

/**
 * Compute LOESS (Locally Estimated Scatterplot Smoothing) curve.
 * Uses local weighted linear regression at each evaluation point.
 *
 * @param data - Array of {x, y} data points
 * @param bandwidth - Fraction of data to use for each local fit (0.2 to 0.8 typical)
 * @returns Function that computes smoothed y value for any x
 */
export function loessSmooth(data: DataPoint[], bandwidth = 0.3): ((x: number) => number) | null {
  if (!data || data.length < 3) {
    return null;
  }

  // Sort data by x for efficient neighbor finding
  const sortedData = [...data].sort((a, b) => a.x - b.x);
  const n = sortedData.length;
  const k = Math.max(3, Math.floor(bandwidth * n)); // Number of neighbors to use

  return (x: number): number => {
    // Find k nearest neighbors by x distance
    const distances = sortedData.map((p, i) => ({
      index: i,
      distance: Math.abs(p.x - x),
    }));
    distances.sort((a, b) => a.distance - b.distance);

    const neighbors = distances.slice(0, k);
    const maxDist = neighbors[k - 1].distance;

    // Compute tricube weights
    const weights = neighbors.map((n) => tricubeWeight(n.distance, maxDist));

    // Weighted linear regression on neighbors
    const neighborPoints = neighbors.map((n) => sortedData[n.index]);

    const sumW = weights.reduce((s, w) => s + w, 0);
    if (sumW === 0) return sortedData[0].y; // Fallback

    const sumWX = neighborPoints.reduce((s, p, i) => s + weights[i] * p.x, 0);
    const sumWY = neighborPoints.reduce((s, p, i) => s + weights[i] * p.y, 0);
    const sumWXX = neighborPoints.reduce((s, p, i) => s + weights[i] * p.x * p.x, 0);
    const sumWXY = neighborPoints.reduce((s, p, i) => s + weights[i] * p.x * p.y, 0);

    const meanWX = sumWX / sumW;
    const meanWY = sumWY / sumW;

    const denominator = sumWXX - meanWX * sumWX;
    if (Math.abs(denominator) < 1e-10) {
      return meanWY; // Flat line fallback
    }

    const slope = (sumWXY - meanWX * sumWY) / denominator;
    const intercept = meanWY - slope * meanWX;

    return slope * x + intercept;
  };
}

/**
 * Generate LOESS curve points for visualization.
 *
 * @param data - Original data points
 * @param xMin - Minimum x value
 * @param xMax - Maximum x value
 * @param numPoints - Number of points to generate
 * @param bandwidth - LOESS bandwidth parameter (0.2 to 0.8)
 * @returns Array of {x, y} points along the LOESS curve
 */
export function generateLoessCurvePoints(
  data: DataPoint[],
  xMin: number,
  xMax: number,
  numPoints = 100,
  bandwidth = 0.3,
): DataPoint[] {
  const smoother = loessSmooth(data, bandwidth);
  if (!smoother) return [];

  const points: DataPoint[] = [];
  const step = (xMax - xMin) / (numPoints - 1);

  for (let i = 0; i < numPoints; i++) {
    const x = xMin + i * step;
    const y = smoother(x);
    points.push({ x, y });
  }

  return points;
}
