import type { TFunction } from "i18next";
import { describe, expect, it, vi } from "vitest";
import {
  getBuildingTypeLabel,
  getEnumOptions,
  getHeatingTypeLabel,
  getLabel,
  getModelIduLabel,
  getModelOduLabel,
} from "../enumCatalog";

describe("enumCatalog", () => {
  describe("getLabel", () => {
    it("returns translated label when translation exists", () => {
      const mockT = vi.fn((key: string) => {
        if (key === "models.heating_type.radiators") return "Radiators";
        return key;
      }) as unknown as TFunction;

      const result = getLabel(mockT, "models.heating_type", "radiators");
      expect(result).toBe("Radiators");
      expect(mockT).toHaveBeenCalledWith("models.heating_type.radiators");
    });

    it("returns raw code when translation does not exist", () => {
      const mockT = vi.fn((key: string) => key) as unknown as TFunction; // Returns key as-is (no translation)

      const result = getLabel(mockT, "models.heating_type", "unknown_code");
      expect(result).toBe("unknown_code");
    });

    it("returns empty string for null code", () => {
      const mockT = vi.fn() as unknown as TFunction;

      const result = getLabel(mockT, "models.heating_type", null);
      expect(result).toBe("");
      expect(mockT).not.toHaveBeenCalled();
    });

    it("returns empty string for undefined code", () => {
      const mockT = vi.fn() as unknown as TFunction;

      const result = getLabel(mockT, "models.heating_type", undefined);
      expect(result).toBe("");
      expect(mockT).not.toHaveBeenCalled();
    });

    it("returns empty string for empty string code", () => {
      const mockT = vi.fn() as unknown as TFunction;

      const result = getLabel(mockT, "models.heating_type", "");
      expect(result).toBe("");
      expect(mockT).not.toHaveBeenCalled();
    });

    it("handles numeric codes", () => {
      const mockT = vi.fn((key: string) => {
        if (key === "models.model_odu.5") return "Model 5";
        return key;
      }) as unknown as TFunction;

      const result = getLabel(mockT, "models.model_odu", 5);
      expect(result).toBe("Model 5");
      expect(mockT).toHaveBeenCalledWith("models.model_odu.5");
    });
  });

  describe("getEnumOptions", () => {
    it("generates options array with translated labels", () => {
      const mockT = vi.fn((key: string) => {
        const translations: Record<string, string> = {
          "models.heating_type.radiators": "Radiators",
          "models.heating_type.underfloorheating": "Underfloor Heating",
          "models.heating_type.mixed": "Mixed",
        };
        return translations[key] || key;
      }) as unknown as TFunction;

      const values = ["radiators", "underfloorheating", "mixed"];
      const result = getEnumOptions(mockT, "models.heating_type", values);

      expect(result).toEqual([
        { value: "radiators", label: "Radiators" },
        { value: "underfloorheating", label: "Underfloor Heating" },
        { value: "mixed", label: "Mixed" },
      ]);
    });

    it("handles empty values array", () => {
      const mockT = vi.fn() as unknown as TFunction;

      const result = getEnumOptions(mockT, "models.heating_type", []);
      expect(result).toEqual([]);
    });
  });

  describe("specific label helpers", () => {
    it("getHeatingTypeLabel calls getLabel with correct namespace", () => {
      const mockT = vi.fn((key: string) => key) as unknown as TFunction;

      getHeatingTypeLabel(mockT, "radiators");
      expect(mockT).toHaveBeenCalledWith("models.heating_type.radiators");
    });

    it("getModelIduLabel calls getLabel with correct namespace", () => {
      const mockT = vi.fn((key: string) => key) as unknown as TFunction;

      getModelIduLabel(mockT, "CS5800i_E");
      expect(mockT).toHaveBeenCalledWith("models.model_idu.CS5800i_E");
    });

    it("getModelOduLabel calls getLabel with correct namespace", () => {
      const mockT = vi.fn((key: string) => key) as unknown as TFunction;

      getModelOduLabel(mockT, "5");
      expect(mockT).toHaveBeenCalledWith("models.model_odu.5");
    });

    it("getBuildingTypeLabel calls getLabel with correct namespace", () => {
      const mockT = vi.fn((key: string) => key) as unknown as TFunction;

      getBuildingTypeLabel(mockT, "single_family_detached");
      expect(mockT).toHaveBeenCalledWith("models.building_type.single_family_detached");
    });
  });
});
