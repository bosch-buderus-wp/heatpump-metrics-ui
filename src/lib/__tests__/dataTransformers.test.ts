import { describe, expect, it } from "vitest";
import { flattenHeatingSystemsFields, flattenHeatingSystemsInArray } from "../dataTransformers";

describe("dataTransformers", () => {
  describe("flattenHeatingSystemsFields", () => {
    it("should flatten heating_systems object to top level", () => {
      const input = {
        id: "test-123",
        user_id: "user-456",
        heating_systems: {
          model_odu: "7IR-120",
          model_idu: "Indoor-Unit",
          heating_type: "Floor Heating",
          name: "Main System",
        },
      };

      const result = flattenHeatingSystemsFields(input);

      expect(result).toHaveProperty("id", "test-123");
      expect(result).toHaveProperty("user_id", "user-456");
      expect(result).toHaveProperty("heating_systems");
      expect(result).toHaveProperty("model_odu", "7IR-120");
      expect(result).toHaveProperty("model_idu", "Indoor-Unit");
      expect(result).toHaveProperty("heating_type", "Floor Heating");
      expect(result).toHaveProperty("name", "Main System");
    });

    it("should handle row without heating_systems", () => {
      const input = {
        id: "test-123",
        user_id: "user-456",
        month: 1,
        year: 2025,
      };

      const result = flattenHeatingSystemsFields(input);

      expect(result).toEqual(input);
      expect(result).not.toHaveProperty("model_odu");
    });

    it("should NOT overwrite parent fields with heating_systems fields", () => {
      // Simulates a measurement with its own created_at, user_id, etc.
      const input = {
        id: "measurement-123",
        created_at: "2024-01-15T12:00:00Z", // measurement timestamp
        user_id: "user-456",
        heating_id: "heating-789",
        electrical_energy_kwh: 100.5,
        heating_systems: {
          created_at: "2024-01-01T10:00:00Z", // heating system creation timestamp (older)
          user_id: "user-456",
          heating_id: "heating-789",
          name: "Main System",
          model_odu: "7IR-120",
          heating_type: "Floor Heating",
        },
      };

      const result = flattenHeatingSystemsFields(input);

      // Verify parent fields are NOT overwritten
      expect(result.created_at).toBe("2024-01-15T12:00:00Z"); // Should keep measurement timestamp
      expect(result.user_id).toBe("user-456"); // Should keep parent user_id
      expect(result.heating_id).toBe("heating-789"); // Should keep parent heating_id

      // Verify heating_systems fields ARE flattened (except excluded ones)
      expect(result.name).toBe("Main System");
      expect(result.model_odu).toBe("7IR-120");
      expect(result.heating_type).toBe("Floor Heating");

      // Verify original nested object is preserved
      expect(result).toHaveProperty("heating_systems");
      expect(result.heating_systems).toEqual(input.heating_systems);
    });

    it("should handle null heating_systems", () => {
      const input = {
        id: "test-123",
        heating_systems: null,
      };

      const result = flattenHeatingSystemsFields(input);

      expect(result).toEqual(input);
      expect(result.heating_systems).toBeNull();
    });

    it("should handle undefined heating_systems", () => {
      const input = {
        id: "test-123",
        heating_systems: undefined,
      };

      const result = flattenHeatingSystemsFields(input);

      expect(result).toEqual(input);
    });

    it("should not modify original object", () => {
      const input = {
        id: "test-123",
        heating_systems: {
          model_odu: "7IR-120",
        },
      };

      const result = flattenHeatingSystemsFields(input);

      expect(result).not.toBe(input);
      expect(result.heating_systems).toBe(input.heating_systems); // nested object reference preserved
    });

    it("should handle empty heating_systems object", () => {
      const input = {
        id: "test-123",
        heating_systems: {},
      };

      const result = flattenHeatingSystemsFields(input);

      expect(result).toHaveProperty("id", "test-123");
      expect(result).toHaveProperty("heating_systems");
    });

    it("should override top-level fields with heating_systems values", () => {
      const input = {
        id: "test-123",
        name: "Top Level Name",
        heating_systems: {
          name: "Heating System Name",
          model_odu: "7IR-120",
        },
      };

      const result = flattenHeatingSystemsFields(input);

      // heating_systems.name should override the top-level name
      expect(result.name).toBe("Heating System Name");
      expect(result.model_odu).toBe("7IR-120");
    });

    it("should preserve all field types", () => {
      const input = {
        id: "test-123",
        numeric_field: 42,
        boolean_field: true,
        null_field: null,
        heating_systems: {
          model_odu: "7IR-120",
          capacity: 12.5,
          active: false,
        },
      };

      const result = flattenHeatingSystemsFields(input);

      expect(result.numeric_field).toBe(42);
      expect(result.boolean_field).toBe(true);
      expect(result.null_field).toBeNull();
      expect(result.model_odu).toBe("7IR-120");
      expect(result.capacity).toBe(12.5);
      expect(result.active).toBe(false);
    });

    it("should handle nested arrays in heating_systems", () => {
      const input = {
        id: "test-123",
        heating_systems: {
          model_odu: "7IR-120",
          features: ["heating", "cooling", "dhw"],
        },
      };

      const result = flattenHeatingSystemsFields(input);

      expect(result.model_odu).toBe("7IR-120");
      expect(result.features).toEqual(["heating", "cooling", "dhw"]);
    });

    it("should handle special characters in field names", () => {
      const input = {
        id: "test-123",
        heating_systems: {
          "model-odu": "7IR-120",
          "heating.type": "Floor Heating",
        },
      };

      const result = flattenHeatingSystemsFields(input);

      expect(result["model-odu"]).toBe("7IR-120");
      expect(result["heating.type"]).toBe("Floor Heating");
    });
  });

  describe("flattenHeatingSystemsInArray", () => {
    it("should flatten heating_systems for all items in array", () => {
      const input = [
        {
          id: "1",
          heating_systems: { model_odu: "7IR-120", heating_type: "Floor" },
        },
        {
          id: "2",
          heating_systems: { model_odu: "9IR-240", heating_type: "Radiators" },
        },
        {
          id: "3",
          heating_systems: { model_odu: "5IR-80", heating_type: "Floor" },
        },
      ];

      const result = flattenHeatingSystemsInArray(input);

      expect(result).toHaveLength(3);
      expect(result[0]).toHaveProperty("model_odu", "7IR-120");
      expect(result[0]).toHaveProperty("heating_type", "Floor");
      expect(result[1]).toHaveProperty("model_odu", "9IR-240");
      expect(result[1]).toHaveProperty("heating_type", "Radiators");
      expect(result[2]).toHaveProperty("model_odu", "5IR-80");
      expect(result[2]).toHaveProperty("heating_type", "Floor");
    });

    it("should handle empty array", () => {
      const result = flattenHeatingSystemsInArray([]);

      expect(result).toEqual([]);
    });

    it("should handle array with mixed items (some with, some without heating_systems)", () => {
      const input = [
        {
          id: "1",
          heating_systems: { model_odu: "7IR-120" },
        },
        {
          id: "2",
          month: 1,
        },
        {
          id: "3",
          heating_systems: { model_odu: "9IR-240" },
        },
      ];

      const result = flattenHeatingSystemsInArray(input);

      expect(result).toHaveLength(3);
      expect(result[0]).toHaveProperty("model_odu", "7IR-120");
      expect(result[1]).not.toHaveProperty("model_odu");
      expect(result[1]).toHaveProperty("month", 1);
      expect(result[2]).toHaveProperty("model_odu", "9IR-240");
    });

    it("should not mutate original array", () => {
      const input = [
        {
          id: "1",
          heating_systems: { model_odu: "7IR-120" },
        },
      ];

      const originalLength = input.length;
      const originalId = input[0].id;

      const result = flattenHeatingSystemsInArray(input);

      expect(input.length).toBe(originalLength);
      expect(input[0].id).toBe(originalId);
      expect(input[0]).not.toHaveProperty("model_odu");
      expect(result[0]).toHaveProperty("model_odu");
    });

    it("should handle large arrays efficiently", () => {
      const largeArray = Array.from({ length: 1000 }, (_, i) => ({
        id: `id-${i}`,
        heating_systems: {
          model_odu: `model-${i}`,
          heating_type: i % 2 === 0 ? "Floor" : "Radiators",
        },
      }));

      const result = flattenHeatingSystemsInArray(largeArray);

      expect(result).toHaveLength(1000);
      expect(result[0]).toHaveProperty("model_odu", "model-0");
      expect(result[999]).toHaveProperty("model_odu", "model-999");
      expect(result[0]).toHaveProperty("heating_type", "Floor");
      expect(result[1]).toHaveProperty("heating_type", "Radiators");
    });

    it("should preserve order of items in array", () => {
      const input = [
        { id: "3", heating_systems: { model: "C" } },
        { id: "1", heating_systems: { model: "A" } },
        { id: "2", heating_systems: { model: "B" } },
      ];

      const result = flattenHeatingSystemsInArray(input);

      expect(result[0].id).toBe("3");
      expect(result[0].model).toBe("C");
      expect(result[1].id).toBe("1");
      expect(result[1].model).toBe("A");
      expect(result[2].id).toBe("2");
      expect(result[2].model).toBe("B");
    });
  });

  describe("Real-world use cases", () => {
    it("should handle Supabase query result from monthly_values", () => {
      const supabaseResult = [
        {
          id: "uuid-1",
          user_id: "user-1",
          heating_id: "heating-1",
          month: 1,
          year: 2025,
          electrical_energy_kwh: 100,
          thermal_energy_kwh: 350,
          heating_systems: {
            name: "Buderus WLW186i-7 AR E",
            model_odu: "7IR-120",
            model_idu: "Indoor-Unit",
            heating_type: "Floor Heating",
            sw_odu: "9.12.0",
            sw_idu: "9.7.0",
          },
        },
        {
          id: "uuid-2",
          user_id: "user-2",
          heating_id: "heating-2",
          month: 1,
          year: 2025,
          electrical_energy_kwh: 80,
          thermal_energy_kwh: 240,
          heating_systems: {
            name: "Daikin System",
            model_odu: "9IR-240",
            heating_type: "Radiators",
          },
        },
      ];

      const result = flattenHeatingSystemsInArray(supabaseResult);

      // All original fields should be preserved
      expect(result[0]).toHaveProperty("id", "uuid-1");
      expect(result[0]).toHaveProperty("month", 1);
      expect(result[0]).toHaveProperty("electrical_energy_kwh", 100);

      // Heating system fields should be flattened
      expect(result[0]).toHaveProperty("model_odu", "7IR-120");
      expect(result[0]).toHaveProperty("heating_type", "Floor Heating");
      expect(result[0]).toHaveProperty("name", "Buderus WLW186i-7 AR E");

      // Second item
      expect(result[1]).toHaveProperty("model_odu", "9IR-240");
      expect(result[1]).toHaveProperty("heating_type", "Radiators");
    });

    it("should work with computed AZ values from Yearly page", () => {
      const dataWithComputedAz = [
        {
          id: "uuid-1",
          month: 1,
          electrical_energy_kwh: 100,
          thermal_energy_kwh: 350,
          az: 3.5,
          az_heating: 3.2,
          heating_systems: {
            model_odu: "7IR-120",
            heating_type: "Floor Heating",
          },
        },
      ];

      const result = flattenHeatingSystemsInArray(dataWithComputedAz);

      expect(result[0]).toHaveProperty("az", 3.5);
      expect(result[0]).toHaveProperty("az_heating", 3.2);
      expect(result[0]).toHaveProperty("model_odu", "7IR-120");
      expect(result[0]).toHaveProperty("heating_type", "Floor Heating");
    });

    it("should work with Daily page measurements", () => {
      const measurements = [
        {
          id: "measurement-1",
          created_at: "2025-01-15T10:00:00Z",
          electrical_energy_kwh: 100,
          hour: "10",
          az: 3.5,
          heating_systems: {
            model_odu: "7IR-120",
            heating_type: "Floor Heating",
          },
        },
      ];

      const result = flattenHeatingSystemsInArray(measurements);

      expect(result[0]).toHaveProperty("hour", "10");
      expect(result[0]).toHaveProperty("az", 3.5);
      expect(result[0]).toHaveProperty("model_odu", "7IR-120");
    });
  });
});
