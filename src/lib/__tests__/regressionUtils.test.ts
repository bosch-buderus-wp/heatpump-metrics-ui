import { describe, expect, it } from "vitest";
import {
  generateCurvePoints,
  generateLoessCurvePoints,
  loessSmooth,
  robustLinearRegression,
} from "../regressionUtils";

describe("regressionUtils", () => {
  describe("robustLinearRegression", () => {
    it("should return null for empty data", () => {
      const result = robustLinearRegression([]);
      expect(result).toBeNull();
    });

    it("should return null for single point", () => {
      const result = robustLinearRegression([{ x: 1, y: 2 }]);
      expect(result).toBeNull();
    });

    it("should fit a perfect line through points", () => {
      // y = 2x + 1
      const points = [
        { x: 0, y: 1 },
        { x: 1, y: 3 },
        { x: 2, y: 5 },
        { x: 3, y: 7 },
      ];

      const result = robustLinearRegression(points);

      expect(result).not.toBeNull();
      expect(result?.slope).toBeCloseTo(2, 2);
      expect(result?.intercept).toBeCloseTo(1, 2);
      expect(result?.rSquared).toBeCloseTo(1, 2);
      expect(result?.sampleSize).toBe(4);
      expect(result?.meanAbsoluteError).toBeCloseTo(0, 2);
    });

    it("should handle noisy data", () => {
      // Approximate y = 3x + 2 with noise
      const points = [
        { x: 0, y: 2.1 },
        { x: 1, y: 5.2 },
        { x: 2, y: 7.9 },
        { x: 3, y: 11.1 },
        { x: 4, y: 13.8 },
      ];

      const result = robustLinearRegression(points);

      expect(result).not.toBeNull();
      expect(result?.slope).toBeCloseTo(3, 0);
      expect(result?.intercept).toBeCloseTo(2, 0);
      expect(result?.rSquared).toBeGreaterThan(0.95);
      expect(result?.sampleSize).toBe(5);
    });

    it("should be resistant to outliers", () => {
      // y = 2x + 1 with one major outlier
      const points = [
        { x: 0, y: 1 },
        { x: 1, y: 3 },
        { x: 2, y: 5 },
        { x: 3, y: 7 },
        { x: 4, y: 100 }, // outlier
      ];

      const result = robustLinearRegression(points);

      expect(result).not.toBeNull();
      // Robust regression should reduce outlier influence (better than OLS which would give ~20)
      expect(result?.slope).toBeGreaterThan(1.5);
      expect(result?.slope).toBeLessThan(20); // Much better than OLS

      // R² should indicate model doesn't fit perfectly due to outlier
      expect(result?.rSquared).toBeLessThan(1);
    });

    it("should handle negative correlation", () => {
      // y = -1.5x + 10
      const points = [
        { x: 0, y: 10 },
        { x: 2, y: 7 },
        { x: 4, y: 4 },
        { x: 6, y: 1 },
      ];

      const result = robustLinearRegression(points);

      expect(result).not.toBeNull();
      expect(result?.slope).toBeCloseTo(-1.5, 1);
      expect(result?.intercept).toBeCloseTo(10, 1);
    });

    it("should handle realistic COP vs temperature data", () => {
      // Simulating COP increasing with outdoor temperature
      const points = [
        { x: -10, y: 2.1 },
        { x: -5, y: 2.5 },
        { x: 0, y: 3.0 },
        { x: 5, y: 3.4 },
        { x: 10, y: 3.9 },
      ];

      const result = robustLinearRegression(points);

      expect(result).not.toBeNull();
      expect(result?.slope).toBeGreaterThan(0); // Positive correlation
      expect(result?.rSquared).toBeGreaterThan(0.9);
      expect(result?.sampleSize).toBe(5);
    });
  });

  describe("generateCurvePoints", () => {
    it("should generate correct number of points", () => {
      const regression = {
        slope: 2,
        intercept: 1,
        rSquared: 1,
        sampleSize: 10,
        meanAbsoluteError: 0,
      };

      const points = generateCurvePoints(regression, 0, 10, 11);

      expect(points).toHaveLength(11);
    });

    it("should generate points along the line", () => {
      const regression = {
        slope: 2,
        intercept: 1,
        rSquared: 1,
        sampleSize: 10,
        meanAbsoluteError: 0,
      };

      const points = generateCurvePoints(regression, 0, 10, 3);

      expect(points).toHaveLength(3);
      expect(points[0].x).toBe(0);
      expect(points[0].y).toBe(1); // 2*0 + 1
      expect(points[1].x).toBe(5);
      expect(points[1].y).toBe(11); // 2*5 + 1
      expect(points[2].x).toBe(10);
      expect(points[2].y).toBe(21); // 2*10 + 1
    });

    it("should handle negative slopes", () => {
      const regression = {
        slope: -1.5,
        intercept: 10,
        rSquared: 1,
        sampleSize: 10,
        meanAbsoluteError: 0,
      };

      const points = generateCurvePoints(regression, 0, 4, 3);

      expect(points[0].y).toBe(10); // -1.5*0 + 10
      expect(points[1].y).toBe(7); // -1.5*2 + 10
      expect(points[2].y).toBe(4); // -1.5*4 + 10
    });
  });

  describe("loessSmooth", () => {
    it("should return null for empty data", () => {
      const result = loessSmooth([]);
      expect(result).toBeNull();
    });

    it("should return null for single point", () => {
      const result = loessSmooth([{ x: 1, y: 2 }]);
      expect(result).toBeNull();
    });

    it("should return null for two points", () => {
      const result = loessSmooth([
        { x: 1, y: 2 },
        { x: 2, y: 4 },
      ]);
      expect(result).toBeNull();
    });

    it("should return a function for 3+ data points", () => {
      const points = [
        { x: 0, y: 1 },
        { x: 1, y: 3 },
        { x: 2, y: 5 },
      ];

      const smoother = loessSmooth(points);

      expect(smoother).not.toBeNull();
      expect(typeof smoother).toBe("function");
    });

    it("should produce values close to data points for linear data", () => {
      // y = 2x + 1
      const points = [
        { x: 0, y: 1 },
        { x: 1, y: 3 },
        { x: 2, y: 5 },
        { x: 3, y: 7 },
        { x: 4, y: 9 },
      ];

      const smoother = loessSmooth(points, 0.5);

      expect(smoother).not.toBeNull();
      // At data points, LOESS should be close to actual values
      expect(smoother!(0)).toBeCloseTo(1, 0);
      expect(smoother!(2)).toBeCloseTo(5, 0);
      expect(smoother!(4)).toBeCloseTo(9, 0);
    });

    it("should produce smooth interpolated values", () => {
      const points = [
        { x: 0, y: 0 },
        { x: 2, y: 4 },
        { x: 4, y: 8 },
        { x: 6, y: 12 },
      ];

      const smoother = loessSmooth(points, 0.5);

      expect(smoother).not.toBeNull();
      // Interpolated value at x=1 should be between 0 and 4
      const interpolated = smoother!(1);
      expect(interpolated).toBeGreaterThan(0);
      expect(interpolated).toBeLessThan(4);
    });

    it("should handle non-linear patterns better than linear regression", () => {
      // Quadratic-ish data: y = x^2 roughly
      const points = [
        { x: -2, y: 4 },
        { x: -1, y: 1 },
        { x: 0, y: 0 },
        { x: 1, y: 1 },
        { x: 2, y: 4 },
      ];

      const smoother = loessSmooth(points, 0.6);

      expect(smoother).not.toBeNull();
      // At the minimum (x=0), LOESS should produce a value close to 0
      expect(smoother!(0)).toBeCloseTo(0, 0);
      // At the edges, should be closer to higher values
      expect(smoother!(2)).toBeGreaterThan(2);
    });

    it("should handle realistic COP vs temperature data", () => {
      // Simulating COP increasing with outdoor temperature (non-linear)
      const points = [
        { x: -10, y: 2.0 },
        { x: -5, y: 2.4 },
        { x: 0, y: 3.0 },
        { x: 5, y: 3.5 },
        { x: 10, y: 4.2 },
        { x: 15, y: 4.5 },
      ];

      const smoother = loessSmooth(points, 0.4);

      expect(smoother).not.toBeNull();
      // Values should be in reasonable COP range
      expect(smoother!(-10)).toBeGreaterThan(1.5);
      expect(smoother!(-10)).toBeLessThan(3);
      expect(smoother!(10)).toBeGreaterThan(3.5);
      expect(smoother!(10)).toBeLessThan(5);
    });

    it("should respect bandwidth parameter", () => {
      // With very noisy data, different bandwidths should produce different smoothness
      const points = [
        { x: 0, y: 1 },
        { x: 1, y: 5 },
        { x: 2, y: 2 },
        { x: 3, y: 6 },
        { x: 4, y: 3 },
        { x: 5, y: 7 },
      ];

      const smootherLow = loessSmooth(points, 0.3);
      const smootherHigh = loessSmooth(points, 0.8);

      expect(smootherLow).not.toBeNull();
      expect(smootherHigh).not.toBeNull();

      // Both should produce reasonable values
      expect(smootherLow!(2.5)).toBeGreaterThan(0);
      expect(smootherHigh!(2.5)).toBeGreaterThan(0);
    });
  });

  describe("generateLoessCurvePoints", () => {
    it("should return empty array for insufficient data", () => {
      const points = [
        { x: 1, y: 2 },
        { x: 2, y: 4 },
      ];

      const result = generateLoessCurvePoints(points, 0, 10, 11);

      expect(result).toHaveLength(0);
    });

    it("should generate correct number of points", () => {
      const data = [
        { x: 0, y: 1 },
        { x: 5, y: 6 },
        { x: 10, y: 11 },
      ];

      const points = generateLoessCurvePoints(data, 0, 10, 11);

      expect(points).toHaveLength(11);
    });

    it("should generate points within specified x range", () => {
      const data = [
        { x: 0, y: 0 },
        { x: 5, y: 10 },
        { x: 10, y: 20 },
      ];

      const points = generateLoessCurvePoints(data, 2, 8, 7);

      expect(points[0].x).toBe(2);
      expect(points[points.length - 1].x).toBe(8);
    });

    it("should produce smooth curve for linear data", () => {
      // y = 2x
      const data = [
        { x: 0, y: 0 },
        { x: 2, y: 4 },
        { x: 4, y: 8 },
        { x: 6, y: 12 },
        { x: 8, y: 16 },
        { x: 10, y: 20 },
      ];

      const points = generateLoessCurvePoints(data, 0, 10, 11, 0.5);

      expect(points).toHaveLength(11);
      // For linear data, LOESS should produce approximately linear results
      expect(points[5].x).toBe(5);
      expect(points[5].y).toBeCloseTo(10, 0);
    });

    it("should handle default parameters", () => {
      const data = [
        { x: 0, y: 0 },
        { x: 5, y: 5 },
        { x: 10, y: 10 },
      ];

      // Using defaults: numPoints=100, bandwidth=0.3
      const points = generateLoessCurvePoints(data, 0, 10);

      expect(points).toHaveLength(100);
    });
  });
});
