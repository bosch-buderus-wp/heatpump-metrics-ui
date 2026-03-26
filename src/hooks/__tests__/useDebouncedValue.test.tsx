import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useDebouncedValue } from "../useDebouncedValue";

describe("useDebouncedValue", () => {
  it("delays updates until the debounce interval has passed", () => {
    vi.useFakeTimers();

    const { result, rerender } = renderHook(
      ({ value, delayMs }) => useDebouncedValue(value, delayMs),
      {
        initialProps: {
          value: "initial",
          delayMs: 300,
        },
      },
    );

    expect(result.current).toBe("initial");

    rerender({ value: "updated", delayMs: 300 });

    expect(result.current).toBe("initial");

    act(() => {
      vi.advanceTimersByTime(299);
    });

    expect(result.current).toBe("initial");

    act(() => {
      vi.advanceTimersByTime(1);
    });

    expect(result.current).toBe("updated");

    vi.useRealTimers();
  });

  it("cancels the previous timeout when the value changes again", () => {
    vi.useFakeTimers();

    const { result, rerender } = renderHook(
      ({ value, delayMs }) => useDebouncedValue(value, delayMs),
      {
        initialProps: {
          value: "first",
          delayMs: 300,
        },
      },
    );

    rerender({ value: "second", delayMs: 300 });

    act(() => {
      vi.advanceTimersByTime(200);
    });

    rerender({ value: "third", delayMs: 300 });

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(result.current).toBe("first");

    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(result.current).toBe("third");

    vi.useRealTimers();
  });
});
