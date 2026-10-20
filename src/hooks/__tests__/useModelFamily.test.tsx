import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, useLocation, useNavigate } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ModelFamilyProvider, useModelFamily } from "../useModelFamily";

const storageKey = "heatpump-metrics.modelFamily";

function Probe() {
  const { family, setFamily } = useModelFamily();
  const location = useLocation();
  const navigate = useNavigate();
  return (
    <>
      <output data-testid="family">{family}</output>
      <output data-testid="location">{location.pathname + location.search}</output>
      <button type="button" onClick={() => setFamily("cs8800")}>
        Choose CS8800
      </button>
      <button type="button" onClick={() => navigate("/monthly?year=2026")}>
        Next chart
      </button>
      <button type="button" onClick={() => navigate(-1)}>
        Back
      </button>
    </>
  );
}

function mount(entries = ["/yearly"]) {
  return render(
    <MemoryRouter initialEntries={entries}>
      <ModelFamilyProvider>
        <Probe />
      </ModelFamilyProvider>
    </MemoryRouter>,
  );
}

beforeEach(() => window.localStorage.removeItem(storageKey));
afterEach(() => {
  vi.restoreAllMocks();
  window.localStorage.removeItem(storageKey);
});

describe("model family persistence", () => {
  it("restores the saved family and preserves other URL parameters", () => {
    window.localStorage.setItem(storageKey, "cs7400");
    mount(["/yearly?year=2026"]);
    expect(screen.getByTestId("family")).toHaveTextContent("cs7400");
    expect(screen.getByTestId("location")).toHaveTextContent("/yearly?year=2026&family=cs7400");
  });

  it("gives a valid deep link priority and remembers its family", () => {
    window.localStorage.setItem(storageKey, "cs3800");
    mount(["/yearly?family=cs7001"]);
    expect(screen.getByTestId("family")).toHaveTextContent("cs7001");
    expect(window.localStorage.getItem(storageKey)).toBe("cs7001");
  });

  it("retains a changed selection when navigating to a chart without a family parameter", () => {
    mount();
    fireEvent.click(screen.getByText("Choose CS8800"));
    expect(window.localStorage.getItem(storageKey)).toBe("cs8800");
    fireEvent.click(screen.getByText("Next chart"));
    expect(screen.getByTestId("family")).toHaveTextContent("cs8800");
    expect(screen.getByTestId("location")).toHaveTextContent("/monthly?year=2026&family=cs8800");
  });

  it("restores the last selection after remounting", () => {
    const view = mount();
    fireEvent.click(screen.getByText("Choose CS8800"));
    view.unmount();
    mount(["/daily"]);
    expect(screen.getByTestId("family")).toHaveTextContent("cs8800");
    expect(screen.getByTestId("location")).toHaveTextContent("/daily?family=cs8800");
  });

  it("uses the remembered family when a link contains an unknown family", () => {
    window.localStorage.setItem(storageKey, "cs7400");
    mount(["/yearly?family=unknown"]);
    expect(screen.getByTestId("family")).toHaveTextContent("cs7400");
    expect(screen.getByTestId("location")).toHaveTextContent("/yearly?family=cs7400");
  });

  it("falls back to the default when neither stored nor linked family is valid", () => {
    window.localStorage.setItem(storageKey, "removed-family");
    mount(["/yearly?family=unknown"]);
    expect(screen.getByTestId("family")).toHaveTextContent("cs5800_6800");
    expect(window.localStorage.getItem(storageKey)).toBe("cs5800_6800");
  });

  it("preserves the selection in memory if browser storage is unavailable", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("Blocked");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("Blocked");
    });
    mount();
    fireEvent.click(screen.getByText("Choose CS8800"));
    fireEvent.click(screen.getByText("Next chart"));
    expect(screen.getByTestId("family")).toHaveTextContent("cs8800");
  });

  it("normalizes URLs without adding history entries and respects browser back", () => {
    mount(["/systems?family=cs3800"]);
    fireEvent.click(screen.getByText("Next chart"));
    expect(screen.getByTestId("location")).toHaveTextContent("/monthly?year=2026&family=cs3800");
    fireEvent.click(screen.getByText("Choose CS8800"));
    fireEvent.click(screen.getByText("Back"));
    expect(screen.getByTestId("family")).toHaveTextContent("cs3800");
    fireEvent.click(screen.getByText("Back"));
    expect(screen.getByTestId("location")).toHaveTextContent("/systems?family=cs3800");
  });
});
