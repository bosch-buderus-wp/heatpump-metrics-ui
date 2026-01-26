import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { HeatingSystemWithLocation } from "../../../../types/database.types";
import { SystemsGeoMap } from "../SystemsGeoMap";

// Mock react-i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: any) => {
      const translations: Record<string, string> = {
        "charts.noData": "No data available",
        "systems.unnamedSystem": "Unnamed System",
        "systems.systemsAtLocation": `${options?.count || ""} systems at this location`,
        "systems.systemDetails": "System Details",
        "systemForm.buildingType": "Building Type",
        "systemForm.buildingConstructionYear": "Construction Year",
        "tableHeaders.postalCode": "Postal Code",
        "tableHeaders.heatedArea": "Heated Area",
        "tableHeaders.modelIdu": "Model",
        "common.zoomIn": "Zoom In",
        "common.zoomOut": "Zoom Out",
      };
      return translations[key] || key;
    },
  }),
}));

// Mock MUI icons
vi.mock("@mui/icons-material/Add", () => ({ default: () => <div data-testid="add-icon" /> }));
vi.mock("@mui/icons-material/Remove", () => ({ default: () => <div data-testid="remove-icon" /> }));
vi.mock("@mui/icons-material/LocationOn", () => ({
  default: () => <div data-testid="location-icon" />,
}));
vi.mock("@mui/icons-material/Home", () => ({ default: () => <div data-testid="home-icon" /> }));
vi.mock("@mui/icons-material/CalendarToday", () => ({
  default: () => <div data-testid="calendar-icon" />,
}));
vi.mock("@mui/icons-material/SquareFoot", () => ({
  default: () => <div data-testid="square-foot-icon" />,
}));
vi.mock("@mui/icons-material/HeatPump", () => ({
  default: () => <div data-testid="heatpump-icon" />,
}));

const MOCK_WIDTH = 800;
const MOCK_HEIGHT = 600;

const mockProjection = vi.fn((coords: [number, number]) => [coords[0] * 10, coords[1] * 10]);

const mockMercator = Object.assign((coords: [number, number]) => mockProjection(coords), {
  scale: vi.fn().mockReturnThis(),
  rotate: vi.fn().mockReturnThis(),
  translate: vi.fn().mockReturnThis(),
});

vi.mock("@nivo/geo", () => ({
  ResponsiveGeoMap: ({ layers, width = MOCK_WIDTH, height = MOCK_HEIGHT }: any) => {
    return (
      <svg data-testid="geo-map" width={width} height={height}>
        <title>German Systems Map</title>
        {layers.map((Layer: any, index: number) => {
          if (typeof Layer === "function") {
            const key = Layer.name || `layer-${index}`;
            return <g key={key}>{Layer({ width, height })}</g>;
          }
          return null;
        })}
      </svg>
    );
  },
  projectionById: {
    mercator: () => mockMercator,
  },
}));

describe("SystemsGeoMap", () => {
  const createMockSystem = (
    id: string,
    name: string,
    latitude: number,
    longitude: number,
    details: Partial<HeatingSystemWithLocation> = {},
  ): HeatingSystemWithLocation => ({
    heating_id: id,
    name,
    latitude_deg: latitude,
    longitude_deg: longitude,
    user_id: "user-1",
    created_at: "2024-01-01",
    country: "DE",
    postal_code: "12345",
    heating_type: "mixed",
    model_idu: "CS6800i_M",
    model_odu: "7",
    sw_idu: "9.7.0",
    sw_odu: "9.12.0",
    heated_area_m2: 150,
    heating_load_kw: 7,
    building_construction_year: 2020,
    building_type: "single_family_detached",
    building_energy_standard: "kfw_55",
    design_outdoor_temp_c: -10,
    thermometer_offset_k: null,
    used_for_heating: true,
    used_for_dhw: true,
    used_for_cooling: false,
    notes: null,
    ...details,
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render no data message when systems array is empty", () => {
    render(<SystemsGeoMap systems={[]} />);
    expect(screen.getByText(/no data/i)).toBeInTheDocument();
  });

  it("should render the map and markers when systems are provided", () => {
    const systems = [
      createMockSystem("1", "System 1", 52.52, 13.405),
      createMockSystem("2", "System 2", 48.137, 11.576),
    ];

    const { container } = render(<SystemsGeoMap systems={systems} />);
    expect(screen.getByTestId("geo-map")).toBeInTheDocument();

    // Check if markers are rendered
    const markerGroup = container.querySelector(".markers");
    expect(markerGroup).not.toBeNull();
  });

  it("should cluster systems at the same location", () => {
    const systems = [
      createMockSystem("1", "System 1", 50.0, 10.0),
      createMockSystem("2", "System 2", 50.0, 10.0),
    ];

    render(<SystemsGeoMap systems={systems} />);

    // Check for the cluster count text
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("should open popover with system details when a marker is clicked", async () => {
    const user = userEvent.setup();
    const system = createMockSystem("1", "Super Heatpump", 52.0, 13.0, {
      postal_code: "12345",
      building_construction_year: 1995,
      heated_area_m2: 120,
    });

    const { container } = render(<SystemsGeoMap systems={[system]} />);

    // Click any marker in the markers group
    const marker = container.querySelector(".markers g[role='button']");
    expect(marker).not.toBeNull();
    await user.click(marker!);

    // Check popover content
    expect(screen.getByText("Super Heatpump")).toBeInTheDocument();
    expect(screen.getByText("1995")).toBeInTheDocument();
  });

  it("should handle zoom buttons", async () => {
    const user = userEvent.setup();
    const systems = [createMockSystem("1", "System 1", 52.0, 13.0)];

    render(<SystemsGeoMap systems={systems} />);

    const zoomInBtn = screen.getByLabelText("Zoom In");
    expect(zoomInBtn).toBeInTheDocument();

    await user.click(zoomInBtn);
  });
});
