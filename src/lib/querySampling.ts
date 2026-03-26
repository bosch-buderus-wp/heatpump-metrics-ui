export interface SampleRange {
  from: number;
  to: number;
}

const DEFAULT_MAX_WINDOWS = 10;
const DEFAULT_QUERY_CONCURRENCY = 4;

function getDeterministicOffset(windowIndex: number, maxOffset: number) {
  if (maxOffset <= 0) {
    return 0;
  }

  const seeded = Math.sin((windowIndex + 1) * 12.9898) * 43758.5453;
  const ratio = seeded - Math.floor(seeded);
  return Math.round(ratio * maxOffset);
}

export function buildDistributedSampleRanges(
  totalRows: number,
  maxRows: number,
  maxWindows = DEFAULT_MAX_WINDOWS,
) {
  if (totalRows <= 0 || maxRows <= 0) {
    return [] satisfies SampleRange[];
  }

  if (totalRows <= maxRows) {
    return [{ from: 0, to: totalRows - 1 }] satisfies SampleRange[];
  }

  const windowCount = Math.min(maxWindows, maxRows, totalRows);
  const rowsPerWindow = Math.max(1, Math.floor(maxRows / windowCount));
  const ranges: SampleRange[] = [];
  const usedRows = new Set<number>();

  for (let windowIndex = 0; windowIndex < windowCount; windowIndex += 1) {
    const windowStart = Math.floor((windowIndex * totalRows) / windowCount);
    const windowEnd = Math.floor(((windowIndex + 1) * totalRows) / windowCount) - 1;
    const windowSize = Math.max(1, windowEnd - windowStart + 1);
    const actualRows = Math.min(rowsPerWindow, windowSize);
    const maxOffset = windowSize - actualRows;
    const offset = getDeterministicOffset(windowIndex, maxOffset);
    let from = windowStart + offset;
    let to = from + actualRows - 1;

    while (from <= to && usedRows.has(from)) {
      from += 1;
    }

    while (to >= from && usedRows.has(to)) {
      to -= 1;
    }

    if (from > to) {
      continue;
    }

    for (let index = from; index <= to; index += 1) {
      usedRows.add(index);
    }

    ranges.push({ from, to });
  }

  return ranges;
}

export async function fetchSampledRanges<T>(
  ranges: SampleRange[],
  fetchRange: (range: SampleRange) => Promise<T[]>,
  concurrency = DEFAULT_QUERY_CONCURRENCY,
) {
  if (ranges.length === 0) {
    return [] as T[];
  }

  const result: T[] = [];

  for (let index = 0; index < ranges.length; index += concurrency) {
    const batch = ranges.slice(index, index + concurrency);
    const batchResults = await Promise.all(batch.map((range) => fetchRange(range)));
    result.push(...batchResults.flat());
  }

  return result;
}
