import { describe, expect, it } from "vitest";
import { buildDistributedSampleRanges, fetchSampledRanges } from "../querySampling";

describe("querySampling", () => {
  it("returns a single full range when the total fits within the limit", () => {
    expect(buildDistributedSampleRanges(800, 1000)).toEqual([{ from: 0, to: 799 }]);
  });

  it("creates distributed ranges that stay within the overall row limit", () => {
    const ranges = buildDistributedSampleRanges(6000, 1000);
    const sampledRows = ranges.reduce((sum, range) => sum + (range.to - range.from + 1), 0);

    expect(ranges.length).toBeGreaterThan(1);
    expect(ranges.length).toBeLessThanOrEqual(10);
    expect(sampledRows).toBeLessThanOrEqual(1000);
    expect(ranges[0]?.from).toBeGreaterThanOrEqual(0);
    expect(ranges[ranges.length - 1]?.to).toBeLessThan(6000);
  });

  it("spreads sample ranges across the full source interval", () => {
    const ranges = buildDistributedSampleRanges(6000, 1000);

    expect(ranges[0]?.from).toBeLessThan(500);
    expect(ranges[Math.floor(ranges.length / 2)]?.from).toBeGreaterThan(2500);
    expect(ranges[ranges.length - 1]?.to).toBeGreaterThan(5600);
  });

  it("fetches sample windows in parallel batches and preserves range order", async () => {
    const ranges = [
      { from: 0, to: 1 },
      { from: 10, to: 11 },
      { from: 20, to: 21 },
      { from: 30, to: 31 },
    ];
    const fetched = await fetchSampledRanges(ranges, async (range) => [range.from, range.to], 2);

    expect(fetched).toEqual([0, 1, 10, 11, 20, 21, 30, 31]);
  });
});
