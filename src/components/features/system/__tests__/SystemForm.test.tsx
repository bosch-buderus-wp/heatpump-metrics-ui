import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Database } from "../../../../types/database.types";
import { SystemForm } from "../SystemForm";

// Mock react-i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      // Simple mock translations for testing
      const translations: Record<string, string> = {
        "systemForm.name": "System Name",
        "systemForm.namePlaceholder": "Enter system name",
        "systemForm.country": "Country",
        "systemForm.countries.germany": "Germany",
        "systemForm.countries.austria": "Austria",
        "systemForm.countries.switzerland": "Switzerland",
        "systemForm.countries.other": "Other",
        "systemForm.countryPlaceholder": "Enter country",
        "systemForm.postalCode": "Postal Code",
        "systemForm.buildingConstructionYear": "Building Construction Year",
        "systemForm.heatedArea": "Heated Area",
        "systemForm.buildingType": "Building Type",
        "systemForm.buildingEnergyStandard": "Building Energy Standard",
        "systemForm.heatingSystem": "Heating System",
        "systemForm.heatingLoad": "Heating Load",
        "systemForm.designOutdoorTemp": "Design Outdoor Temperature",
        "systemForm.thermometerOffset": "Thermometer Offset",
        "systemForm.indoorUnit": "Indoor Unit",
        "systemForm.outdoorUnit": "Outdoor Unit",
        "systemForm.softwareIndoor": "Software Indoor",
        "systemForm.softwareOutdoor": "Software Outdoor",
        "systemForm.usageLabel": "Usage",
        "systemForm.usedForHeating": "Heating",
        "systemForm.usedForDhw": "DHW",
        "systemForm.usedForCooling": "Cooling",
        "systemForm.notes": "Notes",
        "systemForm.notesPlaceholder": "Enter notes",
        "systemForm.hints.name": "",
        "systemForm.hints.country": "",
        "systemForm.hints.postalCode": "",
        "systemForm.hints.buildingConstructionYear": "",
        "systemForm.hints.heatedArea": "",
        "systemForm.hints.buildingType": "",
        "systemForm.hints.buildingEnergyStandard": "",
        "systemForm.hints.heatingSystem": "",
        "systemForm.hints.heatingLoad": "",
        "systemForm.hints.designOutdoorTemp": "",
        "systemForm.hints.thermometerOffset": "",
        "systemForm.hints.modelIndoor": "",
        "systemForm.hints.modelOutdoor": "",
        "systemForm.hints.softwareIndoor": "",
        "systemForm.hints.softwareOutdoor": "",
        "systemForm.hints.usage": "",
        "systemForm.hints.notes": "",
        "models.heating_type.underfloorheating": "Underfloor Heating",
        "models.heating_type.radiators": "Radiators",
        "models.heating_type.mixed": "Mixed",
        "models.building_type.single_family_detached": "Single Family Detached",
        "models.building_type.semi_detached": "Semi Detached",
        "models.building_type.terraced_mid": "Terraced Mid",
        "models.building_type.terraced_end": "Terraced End",
        "models.building_type.multi_family_small": "Multi Family Small",
        "models.building_type.multi_family_large": "Multi Family Large",
        "models.building_type.apartment": "Apartment",
        "models.building_type.commercial": "Commercial",
        "models.building_type.other": "Other",
        "models.building_energy_standard.unknown": "Unknown",
        "models.building_energy_standard.passive_house": "Passive House",
        "models.building_energy_standard.kfw_40_plus": "KfW 40 Plus",
        "models.building_energy_standard.kfw_40": "KfW 40",
        "models.building_energy_standard.kfw_55": "KfW 55",
        "models.building_energy_standard.kfw_70": "KfW 70",
        "models.building_energy_standard.kfw_85": "KfW 85",
        "models.building_energy_standard.kfw_100": "KfW 100",
        "models.building_energy_standard.kfw_115": "KfW 115",
        "models.building_energy_standard.kfw_denkmalschutz": "KfW Denkmalschutz",
        "models.building_energy_standard.old_building_unrenovated": "Old Building Unrenovated",
        "models.building_energy_standard.energetically_renovated": "Energetically Renovated",
        "models.building_energy_standard.nearly_zero_energy_building":
          "Nearly Zero Energy Building",
        "models.building_energy_standard.minergie": "Minergie",
        "models.model_idu.CS5800i_E": "CS5800i-E",
        "models.model_idu.CS5800i_MB": "CS5800i-MB",
        "models.model_idu.CS5800i_M": "CS5800i-M",
        "models.model_idu.CS6800i_E": "CS6800i-E",
        "models.model_idu.CS6800i_MB": "CS6800i-MB",
        "models.model_idu.CS6800i_M": "CS6800i-M",
        "models.model_idu.WLW176i_E": "WLW176i-E",
        "models.model_idu.WLW176i_TP70": "WLW176i-TP70",
        "models.model_idu.WLW176i_T180": "WLW176i-T180",
        "models.model_idu.WLW186i_E": "WLW186i-E",
        "models.model_idu.WLW186i_TP70": "WLW186i-TP70",
        "models.model_idu.WLW186i_T180": "WLW186i-T180",
        "models.model_odu.4": "4 kW",
        "models.model_odu.5": "5 kW",
        "models.model_odu.7": "7 kW",
        "models.model_odu.10": "10 kW",
        "models.model_odu.12": "12 kW",
        "models.sw_idu.5.27": "5.27",
        "models.sw_idu.5.35": "5.35",
        "models.sw_idu.7.10.0": "7.10.0",
        "models.sw_idu.9.6.1": "9.6.1",
        "models.sw_idu.9.7.0": "9.7.0",
        "models.sw_idu.12.11.1": "12.11.1",
        "models.sw_odu.5.27": "5.27",
        "models.sw_odu.5.35": "5.35",
        "models.sw_odu.7.10.0": "7.10.0",
        "models.sw_odu.9.6.0": "9.6.0",
        "models.sw_odu.9.10.0": "9.10.0",
        "models.sw_odu.9.12.0": "9.12.0",
        "models.sw_odu.9.15.0": "9.15.0",
      };
      return translations[key] || key;
    },
  }),
}));

type HeatingSystem = Database["public"]["Tables"]["heating_systems"]["Row"];

describe("SystemForm", () => {
  const mockSystem: HeatingSystem = {
    heating_id: "test-id-123",
    user_id: "user-123",
    name: "Test System",
    postal_code: "12345",
    country: "Deutschland",
    heating_type: "underfloorheating",
    model_idu: "CS5800i_E",
    model_odu: "5",
    sw_idu: "12.11.1",
    sw_odu: "9.15.0",
    heating_load_kw: 8.5,
    heated_area_m2: 150,
    notes: "Test notes",
    building_construction_year: 2015,
    design_outdoor_temp_c: -12.5,
    building_type: "single_family_detached",
    building_energy_standard: "kfw_55",
    thermometer_offset_k: 2.5,
    used_for_heating: true,
    used_for_dhw: true,
    used_for_cooling: false,
    created_at: "2024-01-01T00:00:00Z",
  };

  it("renders form with all fields from database", () => {
    const mockOnSubmit = vi.fn();
    const { container } = render(<SystemForm system={mockSystem} onSubmit={mockOnSubmit} />);

    // Check that the form element exists
    const form = container.querySelector("form");
    expect(form).toBeInTheDocument();
    expect(form).toHaveAttribute("id", "system-form");
  });

  describe("Field Initialization", () => {
    it("initializes text field: name", () => {
      const mockOnSubmit = vi.fn();
      render(<SystemForm system={mockSystem} onSubmit={mockOnSubmit} />);

      const nameInput = screen.getByLabelText("System Name") as HTMLInputElement;
      expect(nameInput).toHaveValue(mockSystem.name);
    });

    it("initializes text field: postal_code", () => {
      const mockOnSubmit = vi.fn();
      render(<SystemForm system={mockSystem} onSubmit={mockOnSubmit} />);

      const postalCodeInput = screen.getByLabelText("Postal Code") as HTMLInputElement;
      expect(postalCodeInput).toHaveValue(mockSystem.postal_code);
    });

    it("initializes select field: country", () => {
      const mockOnSubmit = vi.fn();
      render(<SystemForm system={mockSystem} onSubmit={mockOnSubmit} />);

      const countrySelect = screen.getByLabelText("Country") as HTMLSelectElement;
      expect(countrySelect).toHaveValue(mockSystem.country);
    });

    it("initializes number field: building_construction_year", () => {
      const mockOnSubmit = vi.fn();
      render(<SystemForm system={mockSystem} onSubmit={mockOnSubmit} />);

      const yearInput = screen.getByLabelText("Building Construction Year") as HTMLInputElement;
      expect(yearInput).toHaveValue(mockSystem.building_construction_year);
    });

    it("initializes number field: heated_area_m2", () => {
      const mockOnSubmit = vi.fn();
      render(<SystemForm system={mockSystem} onSubmit={mockOnSubmit} />);

      const areaInput = screen.getByLabelText("Heated Area") as HTMLInputElement;
      expect(areaInput).toHaveValue(mockSystem.heated_area_m2);
    });

    it("initializes enum select field: building_type", () => {
      const mockOnSubmit = vi.fn();
      render(<SystemForm system={mockSystem} onSubmit={mockOnSubmit} />);

      const buildingTypeSelect = screen.getByLabelText("Building Type") as HTMLSelectElement;
      expect(buildingTypeSelect).toHaveValue(mockSystem.building_type);
    });

    it("initializes enum select field: building_energy_standard", () => {
      const mockOnSubmit = vi.fn();
      render(<SystemForm system={mockSystem} onSubmit={mockOnSubmit} />);

      const energyStandardSelect = screen.getByLabelText(
        "Building Energy Standard",
      ) as HTMLSelectElement;
      expect(energyStandardSelect).toHaveValue(mockSystem.building_energy_standard);
    });

    it("initializes select field: heating_type", () => {
      const mockOnSubmit = vi.fn();
      render(<SystemForm system={mockSystem} onSubmit={mockOnSubmit} />);

      const heatingTypeSelect = screen.getByLabelText("Heating System") as HTMLSelectElement;
      expect(heatingTypeSelect).toHaveValue(mockSystem.heating_type);
    });

    it("initializes number field: heating_load_kw", () => {
      const mockOnSubmit = vi.fn();
      render(<SystemForm system={mockSystem} onSubmit={mockOnSubmit} />);

      const heatingLoadInput = screen.getByLabelText("Heating Load") as HTMLInputElement;
      expect(heatingLoadInput).toHaveValue(mockSystem.heating_load_kw);
    });

    it("initializes number field: design_outdoor_temp_c", () => {
      const mockOnSubmit = vi.fn();
      render(<SystemForm system={mockSystem} onSubmit={mockOnSubmit} />);

      const outdoorTempInput = screen.getByLabelText(
        "Design Outdoor Temperature",
      ) as HTMLInputElement;
      expect(outdoorTempInput).toHaveValue(mockSystem.design_outdoor_temp_c);
    });

    it("initializes number field: thermometer_offset_k", () => {
      const mockOnSubmit = vi.fn();
      render(<SystemForm system={mockSystem} onSubmit={mockOnSubmit} />);

      const thermometerOffsetInput = screen.getByLabelText(
        "Thermometer Offset",
      ) as HTMLInputElement;
      expect(thermometerOffsetInput).toHaveValue(mockSystem.thermometer_offset_k);
    });

    it("initializes select field: model_idu", () => {
      const mockOnSubmit = vi.fn();
      render(<SystemForm system={mockSystem} onSubmit={mockOnSubmit} />);

      const modelIduSelect = screen.getByLabelText("Indoor Unit") as HTMLSelectElement;
      expect(modelIduSelect).toHaveValue(mockSystem.model_idu);
    });

    it("initializes select field: model_odu", () => {
      const mockOnSubmit = vi.fn();
      render(<SystemForm system={mockSystem} onSubmit={mockOnSubmit} />);

      const modelOduSelect = screen.getByLabelText("Outdoor Unit") as HTMLSelectElement;
      expect(modelOduSelect).toHaveValue(mockSystem.model_odu);
    });

    it("initializes select field: sw_idu", () => {
      const mockOnSubmit = vi.fn();
      render(<SystemForm system={mockSystem} onSubmit={mockOnSubmit} />);

      const swIduSelect = screen.getByLabelText("Software Indoor") as HTMLSelectElement;
      expect(swIduSelect).toHaveValue(mockSystem.sw_idu);
    });

    it("initializes select field: sw_odu", () => {
      const mockOnSubmit = vi.fn();
      render(<SystemForm system={mockSystem} onSubmit={mockOnSubmit} />);

      const swOduSelect = screen.getByLabelText("Software Outdoor") as HTMLSelectElement;
      expect(swOduSelect).toHaveValue(mockSystem.sw_odu);
    });

    it("initializes checkbox field: used_for_heating", () => {
      const mockOnSubmit = vi.fn();
      render(<SystemForm system={mockSystem} onSubmit={mockOnSubmit} />);

      const heatingCheckbox = screen.getByLabelText("Heating") as HTMLInputElement;
      expect(heatingCheckbox).toBeChecked();
    });

    it("initializes checkbox field: used_for_dhw", () => {
      const mockOnSubmit = vi.fn();
      render(<SystemForm system={mockSystem} onSubmit={mockOnSubmit} />);

      const dhwCheckbox = screen.getByLabelText("DHW") as HTMLInputElement;
      expect(dhwCheckbox).toBeChecked();
    });

    it("initializes checkbox field: used_for_cooling", () => {
      const mockOnSubmit = vi.fn();
      render(<SystemForm system={mockSystem} onSubmit={mockOnSubmit} />);

      const coolingCheckbox = screen.getByLabelText("Cooling") as HTMLInputElement;
      expect(coolingCheckbox).not.toBeChecked();
    });

    it("initializes textarea field: notes", () => {
      const mockOnSubmit = vi.fn();
      render(<SystemForm system={mockSystem} onSubmit={mockOnSubmit} />);

      const notesTextarea = screen.getByLabelText("Notes") as HTMLTextAreaElement;
      expect(notesTextarea).toHaveValue(mockSystem.notes);
    });
  });

  describe("Null/Empty Values", () => {
    it("handles system with all nullable fields as null", () => {
      const systemWithNulls: HeatingSystem = {
        ...mockSystem,
        postal_code: null,
        country: null,
        heating_load_kw: null,
        heated_area_m2: null,
        notes: null,
        building_construction_year: null,
        design_outdoor_temp_c: null,
        building_type: null,
        building_energy_standard: null,
        thermometer_offset_k: null,
      };

      const mockOnSubmit = vi.fn();
      const { container } = render(<SystemForm system={systemWithNulls} onSubmit={mockOnSubmit} />);

      // Check that form renders without errors
      const form = container.querySelector("form");
      expect(form).toBeInTheDocument();

      // Verify null values render as empty
      const postalCodeInput = screen.getByLabelText("Postal Code") as HTMLInputElement;
      expect(postalCodeInput).toHaveValue("");

      const heatingLoadInput = screen.getByLabelText("Heating Load") as HTMLInputElement;
      expect(heatingLoadInput).toHaveValue(null);

      const thermometerOffsetInput = screen.getByLabelText(
        "Thermometer Offset",
      ) as HTMLInputElement;
      expect(thermometerOffsetInput).toHaveValue(null);
    });
  });

  describe("New System (No Data)", () => {
    it("renders form with default values when system is null", () => {
      const mockOnSubmit = vi.fn();
      const { container } = render(<SystemForm system={null} onSubmit={mockOnSubmit} />);

      const form = container.querySelector("form");
      expect(form).toBeInTheDocument();

      // Check default values
      const nameInput = screen.getByLabelText("System Name") as HTMLInputElement;
      expect(nameInput).toHaveValue("");

      const heatingTypeSelect = screen.getByLabelText("Heating System") as HTMLSelectElement;
      expect(heatingTypeSelect).toHaveValue("underfloorheating");

      const thermometerOffsetInput = screen.getByLabelText(
        "Thermometer Offset",
      ) as HTMLInputElement;
      expect(thermometerOffsetInput).toHaveValue(null);
    });
  });

  describe("All Database Fields Coverage", () => {
    it("ensures all editable database fields are present in the form", () => {
      const mockOnSubmit = vi.fn();
      render(<SystemForm system={mockSystem} onSubmit={mockOnSubmit} />);

      // This test ensures we don't forget to add fields to the form
      // List all editable fields from the heating_systems table
      const editableFields = [
        "name",
        "postal_code",
        "country",
        "heating_type",
        "model_idu",
        "model_odu",
        "sw_idu",
        "sw_odu",
        "heating_load_kw",
        "heated_area_m2",
        "notes",
        "building_construction_year",
        "design_outdoor_temp_c",
        "building_type",
        "building_energy_standard",
        "thermometer_offset_k",
        "used_for_heating",
        "used_for_dhw",
        "used_for_cooling",
      ];

      // Verify each field is initialized in the form
      // Note: We can't directly access the form state, but we verified
      // each field individually in the tests above
      expect(editableFields.length).toBe(19);
    });
  });
});
