import { describe, expect, it } from "vitest";
import { generateCurvePoints, robustLinearRegression } from "../regressionUtils";

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
});
