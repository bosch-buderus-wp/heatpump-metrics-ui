export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5";
  };
  public: {
    Tables: {
      heating_systems: {
        Row: {
          building_construction_year: number | null;
          building_energy_standard: Database["public"]["Enums"]["building_energy_standard"] | null;
          building_type: Database["public"]["Enums"]["building_type"] | null;
          country: string | null;
          created_at: string;
          design_outdoor_temp_c: number | null;
          heated_area_m2: number | null;
          heating_id: string;
          heating_load_kw: number | null;
          heating_type: Database["public"]["Enums"]["heating_type"] | null;
          model_idu: Database["public"]["Enums"]["model_idu"] | null;
          model_odu: Database["public"]["Enums"]["model_odu"] | null;
          name: string | null;
          notes: string | null;
          postal_code: string | null;
          sw_idu: Database["public"]["Enums"]["sw_idu"] | null;
          sw_odu: Database["public"]["Enums"]["sw_odu"] | null;
          used_for_cooling: boolean | null;
          used_for_dhw: boolean | null;
          used_for_heating: boolean | null;
          user_id: string;
        };
        Insert: {
          building_construction_year?: number | null;
          building_energy_standard?: Database["public"]["Enums"]["building_energy_standard"] | null;
          building_type?: Database["public"]["Enums"]["building_type"] | null;
          country?: string | null;
          created_at?: string;
          design_outdoor_temp_c?: number | null;
          heated_area_m2?: number | null;
          heating_id?: string;
          heating_load_kw?: number | null;
          heating_type?: Database["public"]["Enums"]["heating_type"] | null;
          model_idu?: Database["public"]["Enums"]["model_idu"] | null;
          model_odu?: Database["public"]["Enums"]["model_odu"] | null;
          name?: string | null;
          notes?: string | null;
          postal_code?: string | null;
          sw_idu?: Database["public"]["Enums"]["sw_idu"] | null;
          sw_odu?: Database["public"]["Enums"]["sw_odu"] | null;
          used_for_cooling?: boolean | null;
          used_for_dhw?: boolean | null;
          used_for_heating?: boolean | null;
          user_id?: string;
        };
        Update: {
          building_construction_year?: number | null;
          building_energy_standard?: Database["public"]["Enums"]["building_energy_standard"] | null;
          building_type?: Database["public"]["Enums"]["building_type"] | null;
          country?: string | null;
          created_at?: string;
          design_outdoor_temp_c?: number | null;
          heated_area_m2?: number | null;
          heating_id?: string;
          heating_load_kw?: number | null;
          heating_type?: Database["public"]["Enums"]["heating_type"] | null;
          model_idu?: Database["public"]["Enums"]["model_idu"] | null;
          model_odu?: Database["public"]["Enums"]["model_odu"] | null;
          name?: string | null;
          notes?: string | null;
          postal_code?: string | null;
          sw_idu?: Database["public"]["Enums"]["sw_idu"] | null;
          sw_odu?: Database["public"]["Enums"]["sw_odu"] | null;
          used_for_cooling?: boolean | null;
          used_for_dhw?: boolean | null;
          used_for_heating?: boolean | null;
          user_id?: string;
        };
        Relationships: [];
      };
      measurements: {
        Row: {
          created_at: string;
          electrical_energy_heating_kwh: number | null;
          electrical_energy_kwh: number | null;
          flow_temperature_c: number | null;
          heating_id: string;
          id: string;
          outdoor_temperature_c: number | null;
          thermal_energy_heating_kwh: number | null;
          thermal_energy_kwh: number | null;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          electrical_energy_heating_kwh?: number | null;
          electrical_energy_kwh?: number | null;
          flow_temperature_c?: number | null;
          heating_id: string;
          id?: string;
          outdoor_temperature_c?: number | null;
          thermal_energy_heating_kwh?: number | null;
          thermal_energy_kwh?: number | null;
          user_id?: string;
        };
        Update: {
          created_at?: string;
          electrical_energy_heating_kwh?: number | null;
          electrical_energy_kwh?: number | null;
          flow_temperature_c?: number | null;
          heating_id?: string;
          id?: string;
          outdoor_temperature_c?: number | null;
          thermal_energy_heating_kwh?: number | null;
          thermal_energy_kwh?: number | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "measurements_heating_id_fkey";
            columns: ["heating_id"];
            isOneToOne: false;
            referencedRelation: "heating_systems";
            referencedColumns: ["heating_id"];
          },
        ];
      };
      monthly_values: {
        Row: {
          created_at: string;
          electrical_energy_heating_kwh: number | null;
          electrical_energy_kwh: number | null;
          flow_temperature_c: number | null;
          heating_id: string;
          id: string;
          is_manual_override: boolean | null;
          last_auto_calculated_at: string | null;
          month: number;
          outdoor_temperature_c: number | null;
          outdoor_temperature_max_c: number | null;
          outdoor_temperature_min_c: number | null;
          thermal_energy_heating_kwh: number | null;
          thermal_energy_kwh: number | null;
          user_id: string;
          year: number;
        };
        Insert: {
          created_at?: string;
          electrical_energy_heating_kwh?: number | null;
          electrical_energy_kwh?: number | null;
          flow_temperature_c?: number | null;
          heating_id: string;
          id?: string;
          is_manual_override?: boolean | null;
          last_auto_calculated_at?: string | null;
          month: number;
          outdoor_temperature_c?: number | null;
          outdoor_temperature_max_c?: number | null;
          outdoor_temperature_min_c?: number | null;
          thermal_energy_heating_kwh?: number | null;
          thermal_energy_kwh?: number | null;
          user_id?: string;
          year: number;
        };
        Update: {
          created_at?: string;
          electrical_energy_heating_kwh?: number | null;
          electrical_energy_kwh?: number | null;
          flow_temperature_c?: number | null;
          heating_id?: string;
          id?: string;
          is_manual_override?: boolean | null;
          last_auto_calculated_at?: string | null;
          month?: number;
          outdoor_temperature_c?: number | null;
          outdoor_temperature_max_c?: number | null;
          outdoor_temperature_min_c?: number | null;
          thermal_energy_heating_kwh?: number | null;
          thermal_energy_kwh?: number | null;
          user_id?: string;
          year?: number;
        };
        Relationships: [
          {
            foreignKeyName: "monthly_values_heating_id_fkey";
            columns: ["heating_id"];
            isOneToOne: false;
            referencedRelation: "heating_systems";
            referencedColumns: ["heating_id"];
          },
        ];
      };
      users: {
        Row: {
          api_key: string;
          created_at: string;
          name: string | null;
          user_id: string;
        };
        Insert: {
          api_key?: string;
          created_at?: string;
          name?: string | null;
          user_id: string;
        };
        Update: {
          api_key?: string;
          created_at?: string;
          name?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      daily_values: {
        Row: {
          az: number | null;
          az_heating: number | null;
          building_construction_year: number | null;
          building_energy_standard: Database["public"]["Enums"]["building_energy_standard"] | null;
          building_type: Database["public"]["Enums"]["building_type"] | null;
          country: string | null;
          date: string | null;
          design_outdoor_temp_c: number | null;
          electrical_energy_heating_kwh: number | null;
          electrical_energy_kwh: number | null;
          flow_temperature_c: number | null;
          heated_area_m2: number | null;
          heating_id: string | null;
          heating_load_kw: number | null;
          heating_type: Database["public"]["Enums"]["heating_type"] | null;
          model_idu: Database["public"]["Enums"]["model_idu"] | null;
          model_odu: Database["public"]["Enums"]["model_odu"] | null;
          name: string | null;
          outdoor_temperature_c: number | null;
          postal_code: string | null;
          sw_idu: Database["public"]["Enums"]["sw_idu"] | null;
          sw_odu: Database["public"]["Enums"]["sw_odu"] | null;
          thermal_energy_heating_kwh: number | null;
          thermal_energy_kwh: number | null;
          used_for_cooling: boolean | null;
          used_for_dhw: boolean | null;
          used_for_heating: boolean | null;
          user_id: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "measurements_heating_id_fkey";
            columns: ["heating_id"];
            isOneToOne: false;
            referencedRelation: "heating_systems";
            referencedColumns: ["heating_id"];
          },
        ];
      };
    };
    Functions: {
      calculate_monthly_value_for_month: {
        Args: {
          p_heating_id: string;
          p_is_current_month?: boolean;
          p_month: number;
          p_user_id: string;
          p_year: number;
        };
        Returns: undefined;
      };
      calculate_monthly_values: { Args: never; Returns: undefined };
      upload_measurement: {
        Args: {
          api_key: string;
          electrical_energy_heating_kwh?: number;
          electrical_energy_kwh?: number;
          flow_temperature_c?: number;
          heating_id: string;
          outdoor_temperature_c?: number;
          thermal_energy_heating_kwh?: number;
          thermal_energy_kwh?: number;
        };
        Returns: Json;
      };
    };
    Enums: {
      building_energy_standard:
        | "unknown"
        | "passive_house"
        | "kfw_40_plus"
        | "kfw_40"
        | "kfw_55"
        | "kfw_70"
        | "kfw_85"
        | "kfw_100"
        | "kfw_115"
        | "kfw_denkmalschutz"
        | "old_building_unrenovated"
        | "energetically_renovated"
        | "nearly_zero_energy_building"
        | "minergie";
      building_type:
        | "single_family_detached"
        | "semi_detached"
        | "terraced_mid"
        | "terraced_end"
        | "multi_family_small"
        | "multi_family_large"
        | "apartment"
        | "commercial"
        | "other";
      heating_type: "underfloorheating" | "radiators" | "mixed";
      model_idu:
        | "CS5800i_E"
        | "CS5800i_MB"
        | "CS5800i_M"
        | "CS6800i_E"
        | "CS6800i_MB"
        | "CS6800i_M"
        | "WLW176i_E"
        | "WLW176i_TP70"
        | "WLW176i_T180"
        | "WLW186i_E"
        | "WLW186i_TP70"
        | "WLW186i_T180";
      model_odu: "4" | "5" | "7" | "10" | "12";
      sw_idu: "5.27" | "5.35" | "7.10.0" | "9.6.1" | "9.7.0" | "12.11.1";
      sw_odu: "5.27" | "5.35" | "7.10.0" | "9.6.0" | "9.10.0" | "9.15.0";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      building_energy_standard: [
        "unknown",
        "passive_house",
        "kfw_40_plus",
        "kfw_40",
        "kfw_55",
        "kfw_70",
        "kfw_85",
        "kfw_100",
        "kfw_115",
        "kfw_denkmalschutz",
        "old_building_unrenovated",
        "energetically_renovated",
        "nearly_zero_energy_building",
        "minergie",
      ],
      building_type: [
        "single_family_detached",
        "semi_detached",
        "terraced_mid",
        "terraced_end",
        "multi_family_small",
        "multi_family_large",
        "apartment",
        "commercial",
        "other",
      ],
      heating_type: ["underfloorheating", "radiators", "mixed"],
      model_idu: [
        "CS5800i_E",
        "CS5800i_MB",
        "CS5800i_M",
        "CS6800i_E",
        "CS6800i_MB",
        "CS6800i_M",
        "WLW176i_E",
        "WLW176i_TP70",
        "WLW176i_T180",
        "WLW186i_E",
        "WLW186i_TP70",
        "WLW186i_T180",
      ],
      model_odu: ["4", "5", "7", "10", "12"],
      sw_idu: ["5.27", "5.35", "7.10.0", "9.6.1", "9.7.0", "12.11.1"],
      sw_odu: ["5.27", "5.35", "7.10.0", "9.6.0", "9.10.0", "9.15.0"],
    },
  },
} as const;
