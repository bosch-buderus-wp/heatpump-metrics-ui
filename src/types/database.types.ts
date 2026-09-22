export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
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
          model_family_id: string;
          model_idu: Database["public"]["Enums"]["model_idu"] | null;
          model_odu: Database["public"]["Enums"]["model_odu"] | null;
          name: string | null;
          notes: string | null;
          postal_code: string | null;
          sw_idu: Database["public"]["Enums"]["sw_idu"] | null;
          sw_odu: Database["public"]["Enums"]["sw_odu"] | null;
          thermometer_offset_k: number | null;
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
          model_family_id?: string;
          model_idu?: Database["public"]["Enums"]["model_idu"] | null;
          model_odu?: Database["public"]["Enums"]["model_odu"] | null;
          name?: string | null;
          notes?: string | null;
          postal_code?: string | null;
          sw_idu?: Database["public"]["Enums"]["sw_idu"] | null;
          sw_odu?: Database["public"]["Enums"]["sw_odu"] | null;
          thermometer_offset_k?: number | null;
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
          model_family_id?: string;
          model_idu?: Database["public"]["Enums"]["model_idu"] | null;
          model_odu?: Database["public"]["Enums"]["model_odu"] | null;
          name?: string | null;
          notes?: string | null;
          postal_code?: string | null;
          sw_idu?: Database["public"]["Enums"]["sw_idu"] | null;
          sw_odu?: Database["public"]["Enums"]["sw_odu"] | null;
          thermometer_offset_k?: number | null;
          used_for_cooling?: boolean | null;
          used_for_dhw?: boolean | null;
          used_for_heating?: boolean | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "heating_systems_model_combination_fkey";
            columns: ["model_family_id", "model_idu", "model_odu"];
            isOneToOne: false;
            referencedRelation: "model_combinations";
            referencedColumns: ["model_family_id", "model_idu", "model_odu"];
          },
          {
            foreignKeyName: "heating_systems_model_family_id_fkey";
            columns: ["model_family_id"];
            isOneToOne: false;
            referencedRelation: "model_families";
            referencedColumns: ["id"];
          },
        ];
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
          {
            foreignKeyName: "measurements_heating_id_fkey";
            columns: ["heating_id"];
            isOneToOne: false;
            referencedRelation: "heating_systems_with_location_view";
            referencedColumns: ["heating_id"];
          },
        ];
      };
      model_combinations: {
        Row: {
          idu_label: string;
          model_family_id: string;
          model_idu: Database["public"]["Enums"]["model_idu"];
          model_odu: Database["public"]["Enums"]["model_odu"];
        };
        Insert: {
          idu_label: string;
          model_family_id: string;
          model_idu: Database["public"]["Enums"]["model_idu"];
          model_odu: Database["public"]["Enums"]["model_odu"];
        };
        Update: {
          idu_label?: string;
          model_family_id?: string;
          model_idu?: Database["public"]["Enums"]["model_idu"];
          model_odu?: Database["public"]["Enums"]["model_odu"];
        };
        Relationships: [
          {
            foreignKeyName: "model_combinations_model_family_id_fkey";
            columns: ["model_family_id"];
            isOneToOne: false;
            referencedRelation: "model_families";
            referencedColumns: ["id"];
          },
        ];
      };
      model_families: {
        Row: {
          id: string;
          label: string;
          sort_order: number;
        };
        Insert: {
          id: string;
          label: string;
          sort_order: number;
        };
        Update: {
          id?: string;
          label?: string;
          sort_order?: number;
        };
        Relationships: [];
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
          {
            foreignKeyName: "monthly_values_heating_id_fkey";
            columns: ["heating_id"];
            isOneToOne: false;
            referencedRelation: "heating_systems_with_location_view";
            referencedColumns: ["heating_id"];
          },
        ];
      };
      postal_codes: {
        Row: {
          country: string;
          latitude_deg: number;
          longitude_deg: number;
          postal_code: string;
        };
        Insert: {
          country: string;
          latitude_deg: number;
          longitude_deg: number;
          postal_code: string;
        };
        Update: {
          country?: string;
          latitude_deg?: number;
          longitude_deg?: number;
          postal_code?: string;
        };
        Relationships: [];
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
          model_family_id: string | null;
          model_idu: Database["public"]["Enums"]["model_idu"] | null;
          model_odu: Database["public"]["Enums"]["model_odu"] | null;
          name: string | null;
          outdoor_temperature_c: number | null;
          postal_code: string | null;
          sw_idu: Database["public"]["Enums"]["sw_idu"] | null;
          sw_odu: Database["public"]["Enums"]["sw_odu"] | null;
          thermal_energy_heating_kwh: number | null;
          thermal_energy_kwh: number | null;
          thermometer_offset_k: number | null;
          used_for_cooling: boolean | null;
          used_for_dhw: boolean | null;
          used_for_heating: boolean | null;
          user_id: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "heating_systems_model_combination_fkey";
            columns: ["model_family_id", "model_idu", "model_odu"];
            isOneToOne: false;
            referencedRelation: "model_combinations";
            referencedColumns: ["model_family_id", "model_idu", "model_odu"];
          },
          {
            foreignKeyName: "heating_systems_model_family_id_fkey";
            columns: ["model_family_id"];
            isOneToOne: false;
            referencedRelation: "model_families";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "measurements_heating_id_fkey";
            columns: ["heating_id"];
            isOneToOne: false;
            referencedRelation: "heating_systems";
            referencedColumns: ["heating_id"];
          },
          {
            foreignKeyName: "measurements_heating_id_fkey";
            columns: ["heating_id"];
            isOneToOne: false;
            referencedRelation: "heating_systems_with_location_view";
            referencedColumns: ["heating_id"];
          },
        ];
      };
      daily_values_view: {
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
          model_family_id: string | null;
          model_idu: Database["public"]["Enums"]["model_idu"] | null;
          model_odu: Database["public"]["Enums"]["model_odu"] | null;
          name: string | null;
          outdoor_temperature_c: number | null;
          postal_code: string | null;
          sw_idu: Database["public"]["Enums"]["sw_idu"] | null;
          sw_odu: Database["public"]["Enums"]["sw_odu"] | null;
          thermal_energy_heating_kwh: number | null;
          thermal_energy_kwh: number | null;
          thermometer_offset_k: number | null;
          used_for_cooling: boolean | null;
          used_for_dhw: boolean | null;
          used_for_heating: boolean | null;
          user_id: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "heating_systems_model_combination_fkey";
            columns: ["model_family_id", "model_idu", "model_odu"];
            isOneToOne: false;
            referencedRelation: "model_combinations";
            referencedColumns: ["model_family_id", "model_idu", "model_odu"];
          },
          {
            foreignKeyName: "heating_systems_model_family_id_fkey";
            columns: ["model_family_id"];
            isOneToOne: false;
            referencedRelation: "model_families";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "measurements_heating_id_fkey";
            columns: ["heating_id"];
            isOneToOne: false;
            referencedRelation: "heating_systems";
            referencedColumns: ["heating_id"];
          },
          {
            foreignKeyName: "measurements_heating_id_fkey";
            columns: ["heating_id"];
            isOneToOne: false;
            referencedRelation: "heating_systems_with_location_view";
            referencedColumns: ["heating_id"];
          },
        ];
      };
      heating_systems_with_location_view: {
        Row: {
          building_construction_year: number | null;
          building_energy_standard: Database["public"]["Enums"]["building_energy_standard"] | null;
          building_type: Database["public"]["Enums"]["building_type"] | null;
          country: string | null;
          created_at: string | null;
          design_outdoor_temp_c: number | null;
          heated_area_m2: number | null;
          heating_id: string | null;
          heating_load_kw: number | null;
          heating_type: Database["public"]["Enums"]["heating_type"] | null;
          latitude_deg: number | null;
          longitude_deg: number | null;
          model_family_id: string | null;
          model_idu: Database["public"]["Enums"]["model_idu"] | null;
          model_odu: Database["public"]["Enums"]["model_odu"] | null;
          name: string | null;
          notes: string | null;
          postal_code: string | null;
          sw_idu: Database["public"]["Enums"]["sw_idu"] | null;
          sw_odu: Database["public"]["Enums"]["sw_odu"] | null;
          thermometer_offset_k: number | null;
          used_for_cooling: boolean | null;
          used_for_dhw: boolean | null;
          used_for_heating: boolean | null;
          user_id: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "heating_systems_model_combination_fkey";
            columns: ["model_family_id", "model_idu", "model_odu"];
            isOneToOne: false;
            referencedRelation: "model_combinations";
            referencedColumns: ["model_family_id", "model_idu", "model_odu"];
          },
          {
            foreignKeyName: "heating_systems_model_family_id_fkey";
            columns: ["model_family_id"];
            isOneToOne: false;
            referencedRelation: "model_families";
            referencedColumns: ["id"];
          },
        ];
      };
      measurement_deltas_view: {
        Row: {
          az: number | null;
          az_heating: number | null;
          building_construction_year: number | null;
          building_energy_standard: Database["public"]["Enums"]["building_energy_standard"] | null;
          building_type: Database["public"]["Enums"]["building_type"] | null;
          country: string | null;
          created_at: string | null;
          design_outdoor_temp_c: number | null;
          electrical_energy_heating_kwh: number | null;
          electrical_energy_kwh: number | null;
          flow_temperature_c: number | null;
          heated_area_m2: number | null;
          heating_id: string | null;
          heating_load_kw: number | null;
          heating_type: Database["public"]["Enums"]["heating_type"] | null;
          id: string | null;
          model_family_id: string | null;
          model_idu: Database["public"]["Enums"]["model_idu"] | null;
          model_odu: Database["public"]["Enums"]["model_odu"] | null;
          name: string | null;
          outdoor_temperature_c: number | null;
          postal_code: string | null;
          sw_idu: Database["public"]["Enums"]["sw_idu"] | null;
          sw_odu: Database["public"]["Enums"]["sw_odu"] | null;
          thermal_energy_heating_kwh: number | null;
          thermal_energy_kwh: number | null;
          thermometer_offset_k: number | null;
          used_for_cooling: boolean | null;
          used_for_dhw: boolean | null;
          used_for_heating: boolean | null;
          user_id: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "heating_systems_model_combination_fkey";
            columns: ["model_family_id", "model_idu", "model_odu"];
            isOneToOne: false;
            referencedRelation: "model_combinations";
            referencedColumns: ["model_family_id", "model_idu", "model_odu"];
          },
          {
            foreignKeyName: "heating_systems_model_family_id_fkey";
            columns: ["model_family_id"];
            isOneToOne: false;
            referencedRelation: "model_families";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "measurements_heating_id_fkey";
            columns: ["heating_id"];
            isOneToOne: false;
            referencedRelation: "heating_systems";
            referencedColumns: ["heating_id"];
          },
          {
            foreignKeyName: "measurements_heating_id_fkey";
            columns: ["heating_id"];
            isOneToOne: false;
            referencedRelation: "heating_systems_with_location_view";
            referencedColumns: ["heating_id"];
          },
        ];
      };
      monthly_values_view: {
        Row: {
          az: number | null;
          az_heating: number | null;
          building_construction_year: number | null;
          building_energy_standard: Database["public"]["Enums"]["building_energy_standard"] | null;
          building_type: Database["public"]["Enums"]["building_type"] | null;
          country: string | null;
          created_at: string | null;
          design_outdoor_temp_c: number | null;
          electrical_energy_heating_kwh: number | null;
          electrical_energy_kwh: number | null;
          flow_temperature_c: number | null;
          heated_area_m2: number | null;
          heating_id: string | null;
          heating_load_kw: number | null;
          heating_type: Database["public"]["Enums"]["heating_type"] | null;
          id: string | null;
          is_manual_override: boolean | null;
          last_auto_calculated_at: string | null;
          model_family_id: string | null;
          model_idu: Database["public"]["Enums"]["model_idu"] | null;
          model_odu: Database["public"]["Enums"]["model_odu"] | null;
          month: number | null;
          name: string | null;
          outdoor_temperature_c: number | null;
          outdoor_temperature_max_c: number | null;
          outdoor_temperature_min_c: number | null;
          postal_code: string | null;
          sw_idu: Database["public"]["Enums"]["sw_idu"] | null;
          sw_odu: Database["public"]["Enums"]["sw_odu"] | null;
          thermal_energy_heating_kwh: number | null;
          thermal_energy_kwh: number | null;
          thermometer_offset_k: number | null;
          used_for_cooling: boolean | null;
          used_for_dhw: boolean | null;
          used_for_heating: boolean | null;
          user_id: string | null;
          year: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "heating_systems_model_combination_fkey";
            columns: ["model_family_id", "model_idu", "model_odu"];
            isOneToOne: false;
            referencedRelation: "model_combinations";
            referencedColumns: ["model_family_id", "model_idu", "model_odu"];
          },
          {
            foreignKeyName: "heating_systems_model_family_id_fkey";
            columns: ["model_family_id"];
            isOneToOne: false;
            referencedRelation: "model_families";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "monthly_values_heating_id_fkey";
            columns: ["heating_id"];
            isOneToOne: false;
            referencedRelation: "heating_systems";
            referencedColumns: ["heating_id"];
          },
          {
            foreignKeyName: "monthly_values_heating_id_fkey";
            columns: ["heating_id"];
            isOneToOne: false;
            referencedRelation: "heating_systems_with_location_view";
            referencedColumns: ["heating_id"];
          },
        ];
      };
    };
    Functions: {
      build_daily_values_view_filter_clause: {
        Args: { filter_model: Json };
        Returns: string;
      };
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
      find_postal_code_coordinates: {
        Args: { p_country: string; p_postal_code: string };
        Returns: {
          latitude_deg: number;
          longitude_deg: number;
          postal_code: string;
        }[];
      };
      sample_daily_values_view_by_outdoor_temperature: {
        Args: {
          current_user_id?: string;
          filter_model?: Json;
          max_rows?: number;
          model_family?: string;
          outdoor_temperature_bin_width_k?: number;
        };
        Returns: {
          az: number;
          az_heating: number;
          building_construction_year: number;
          building_energy_standard: Database["public"]["Enums"]["building_energy_standard"];
          building_type: Database["public"]["Enums"]["building_type"];
          country: string;
          date: string;
          design_outdoor_temp_c: number;
          electrical_energy_heating_kwh: number;
          electrical_energy_kwh: number;
          flow_temperature_c: number;
          heated_area_m2: number;
          heating_id: string;
          heating_load_kw: number;
          heating_type: Database["public"]["Enums"]["heating_type"];
          model_idu: Database["public"]["Enums"]["model_idu"];
          model_odu: Database["public"]["Enums"]["model_odu"];
          name: string;
          outdoor_temperature_c: number;
          postal_code: string;
          sw_idu: Database["public"]["Enums"]["sw_idu"];
          sw_odu: Database["public"]["Enums"]["sw_odu"];
          thermal_energy_heating_kwh: number;
          thermal_energy_kwh: number;
          thermometer_offset_k: number;
          used_for_cooling: boolean;
          used_for_dhw: boolean;
          used_for_heating: boolean;
          user_id: string;
        }[];
      };
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
        | "minergie"
        | "old_building_partially_renovated";
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
        | "WLW186i_T180"
        | "CS3800i_AWEi"
        | "CS3800i_AWMHi"
        | "CS3800i_AWMi"
        | "CS7001i_AWB"
        | "CS7001i_AWE"
        | "CS7001i_AWM"
        | "CS7001i_AWMB"
        | "CS7001i_AWMS"
        | "CS7400i_AWB"
        | "CS7400i_AWE"
        | "CS7400i_AWM"
        | "CS7400i_AWMB"
        | "CS7400i_AWMS"
        | "CS8800i_AWEi_D"
        | "CS8800i_AWMBi_D"
        | "WLW166i_MBB_E"
        | "WLW166i_MBB_T180"
        | "WLW166i_MBB_T180_HK"
        | "WLW186i_MBE_PLUS_E"
        | "WLW186i_MBE_PLUS_TP70"
        | "WLW196i_B"
        | "WLW196i_E"
        | "WLW196i_S_PLUS_B"
        | "WLW196i_S_PLUS_E"
        | "WLW196i_S_PLUS_T190"
        | "WLW196i_S_PLUS_TP120"
        | "WLW196i_S_PLUS_TS185"
        | "WLW196i_T190"
        | "WLW196i_TP120"
        | "WLW196i_TS185";
      model_odu: "4" | "5" | "7" | "10" | "12" | "6" | "8" | "9" | "11" | "13" | "14" | "15" | "17";
      sw_idu: "5.27" | "5.35" | "7.10.0" | "9.6.1" | "9.7.0" | "12.11.1";
      sw_odu: "5.27" | "5.35" | "7.10.0" | "9.6.0" | "9.10.0" | "9.15.0" | "9.12.0";
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
        "old_building_partially_renovated",
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
        "CS3800i_AWEi",
        "CS3800i_AWMHi",
        "CS3800i_AWMi",
        "CS7001i_AWB",
        "CS7001i_AWE",
        "CS7001i_AWM",
        "CS7001i_AWMB",
        "CS7001i_AWMS",
        "CS7400i_AWB",
        "CS7400i_AWE",
        "CS7400i_AWM",
        "CS7400i_AWMB",
        "CS7400i_AWMS",
        "CS8800i_AWEi_D",
        "CS8800i_AWMBi_D",
        "WLW166i_MBB_E",
        "WLW166i_MBB_T180",
        "WLW166i_MBB_T180_HK",
        "WLW186i_MBE_PLUS_E",
        "WLW186i_MBE_PLUS_TP70",
        "WLW196i_B",
        "WLW196i_E",
        "WLW196i_S_PLUS_B",
        "WLW196i_S_PLUS_E",
        "WLW196i_S_PLUS_T190",
        "WLW196i_S_PLUS_TP120",
        "WLW196i_S_PLUS_TS185",
        "WLW196i_T190",
        "WLW196i_TP120",
        "WLW196i_TS185",
      ],
      model_odu: ["4", "5", "7", "10", "12", "6", "8", "9", "11", "13", "14", "15", "17"],
      sw_idu: ["5.27", "5.35", "7.10.0", "9.6.1", "9.7.0", "12.11.1"],
      sw_odu: ["5.27", "5.35", "7.10.0", "9.6.0", "9.10.0", "9.15.0", "9.12.0"],
    },
  },
} as const;

// Additional types for postal codes and heating systems with location
export interface PostalCode {
  postal_code: string;
  country: string;
  latitude_deg: number;
  longitude_deg: number;
}

export interface HeatingSystemWithLocation extends Tables<"heating_systems"> {
  latitude_deg: number | null;
  longitude_deg: number | null;
}
