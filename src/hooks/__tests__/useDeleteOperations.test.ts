import { beforeEach, describe, expect, it, vi } from "vitest";
import * as supabaseClient from "../../lib/supabaseClient";
import { getDeleteAccountCounts, getDeleteSystemCounts } from "../useDeleteOperations";

// Mock the supabase client module
vi.mock("../../lib/supabaseClient", () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe("useDeleteOperations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getDeleteSystemCounts", () => {
    it("returns counts for monthly values and measurements", async () => {
      const mockHeatingId = "heating-123";

      // Mock the supabase from method to return different counts based on table
      vi.mocked(supabaseClient.supabase.from).mockImplementation((table: string) => {
        if (table === "monthly_values") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ count: 12, error: null }),
          } as any;
        }
        if (table === "measurements") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ count: 500, error: null }),
          } as any;
        }
        return {} as any;
      });

      const result = await getDeleteSystemCounts(mockHeatingId);

      expect(result).toEqual({
        monthlyCount: 12,
        measurementCount: 500,
      });

      // Verify correct tables were queried
      expect(supabaseClient.supabase.from).toHaveBeenCalledWith("monthly_values");
      expect(supabaseClient.supabase.from).toHaveBeenCalledWith("measurements");
    });

    it("returns zero counts when tables are empty", async () => {
      const mockHeatingId = "heating-empty";

      vi.mocked(supabaseClient.supabase.from).mockImplementation(
        () =>
          ({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ count: 0, error: null }),
          }) as any,
      );

      const result = await getDeleteSystemCounts(mockHeatingId);

      expect(result).toEqual({
        monthlyCount: 0,
        measurementCount: 0,
      });
    });

    it("handles null counts from database", async () => {
      const mockHeatingId = "heating-null";

      vi.mocked(supabaseClient.supabase.from).mockImplementation(
        () =>
          ({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ count: null, error: null }),
          }) as any,
      );

      const result = await getDeleteSystemCounts(mockHeatingId);

      // Should default to 0 when count is null
      expect(result).toEqual({
        monthlyCount: 0,
        measurementCount: 0,
      });
    });
  });

  describe("getDeleteAccountCounts", () => {
    it("returns counts for user systems and related data", async () => {
      const mockUserId = "user-123";

      vi.mocked(supabaseClient.supabase.from).mockImplementation((table: string) => {
        if (table === "heating_systems") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({
              data: [{ heating_id: "h1" }, { heating_id: "h2" }],
              error: null,
            }),
          } as any;
        }
        if (table === "monthly_values") {
          return {
            select: vi.fn().mockReturnThis(),
            in: vi.fn().mockResolvedValue({ count: 24, error: null }),
          } as any;
        }
        if (table === "measurements") {
          return {
            select: vi.fn().mockReturnThis(),
            in: vi.fn().mockResolvedValue({ count: 1000, error: null }),
          } as any;
        }
        return {} as any;
      });

      const result = await getDeleteAccountCounts(mockUserId);

      expect(result).toEqual({
        systemCount: 2,
        monthlyCount: 24,
        measurementCount: 1000,
      });

      // Verify correct tables were queried
      expect(supabaseClient.supabase.from).toHaveBeenCalledWith("heating_systems");
      expect(supabaseClient.supabase.from).toHaveBeenCalledWith("monthly_values");
      expect(supabaseClient.supabase.from).toHaveBeenCalledWith("measurements");
    });

    it("returns zero counts for new user with no systems", async () => {
      const mockUserId = "user-new";

      vi.mocked(supabaseClient.supabase.from).mockImplementation(
        () =>
          ({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ data: [], error: null }),
          }) as any,
      );

      const result = await getDeleteAccountCounts(mockUserId);

      expect(result).toEqual({
        systemCount: 0,
        monthlyCount: 0,
        measurementCount: 0,
      });
    });

    it("returns zero counts when systems data is null", async () => {
      const mockUserId = "user-null";

      vi.mocked(supabaseClient.supabase.from).mockImplementation(
        () =>
          ({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ data: null, error: null }),
          }) as any,
      );

      const result = await getDeleteAccountCounts(mockUserId);

      expect(result).toEqual({
        systemCount: 0,
        monthlyCount: 0,
        measurementCount: 0,
      });
    });

    it("handles multiple systems correctly", async () => {
      const mockUserId = "user-multi";

      vi.mocked(supabaseClient.supabase.from).mockImplementation((table: string) => {
        if (table === "heating_systems") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({
              data: [
                { heating_id: "h1" },
                { heating_id: "h2" },
                { heating_id: "h3" },
                { heating_id: "h4" },
                { heating_id: "h5" },
              ],
              error: null,
            }),
          } as any;
        }
        if (table === "monthly_values") {
          return {
            select: vi.fn().mockReturnThis(),
            in: vi.fn().mockResolvedValue({ count: 60, error: null }),
          } as any;
        }
        if (table === "measurements") {
          return {
            select: vi.fn().mockReturnThis(),
            in: vi.fn().mockResolvedValue({ count: 5000, error: null }),
          } as any;
        }
        return {} as any;
      });

      const result = await getDeleteAccountCounts(mockUserId);

      expect(result.systemCount).toBe(5);
      expect(result.monthlyCount).toBe(60);
      expect(result.measurementCount).toBe(5000);
    });
  });
});
