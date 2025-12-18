-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.heating_systems (
  heating_id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  name text,
  postal_code text,
  heating_load_kw double precision CHECK (heating_load_kw >= 0::double precision AND heating_load_kw <= 300::double precision),
  heated_area_m2 integer,
  notes text,
  heating_type USER-DEFINED,
  model_idu USER-DEFINED,
  model_odu USER-DEFINED,
  sw_idu USER-DEFINED,
  sw_odu USER-DEFINED,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  building_construction_year integer CHECK (building_construction_year >= 1800 AND building_construction_year <= 2100),
  design_outdoor_temp_c double precision CHECK (design_outdoor_temp_c >= '-50'::integer::double precision AND design_outdoor_temp_c <= 30::double precision),
  building_type USER-DEFINED,
  country text,
  building_energy_standard USER-DEFINED,
  used_for_heating boolean DEFAULT true,
  used_for_dhw boolean DEFAULT false,
  used_for_cooling boolean DEFAULT false,
  CONSTRAINT heating_systems_pkey PRIMARY KEY (heating_id),
  CONSTRAINT heating_systems_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.measurements (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  heating_id uuid NOT NULL,
  thermal_energy_kwh double precision,
  electrical_energy_kwh double precision,
  thermal_energy_heating_kwh double precision,
  electrical_energy_heating_kwh double precision,
  outdoor_temperature_c double precision,
  flow_temperature_c double precision,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT measurements_pkey PRIMARY KEY (id),
  CONSTRAINT measurements_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT measurements_heating_id_fkey FOREIGN KEY (heating_id) REFERENCES public.heating_systems(heating_id)
);
CREATE TABLE public.monthly_values (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  heating_id uuid NOT NULL,
  month integer NOT NULL CHECK (month >= 1 AND month <= 12),
  year integer NOT NULL CHECK (year >= 2025 AND year <= 2050),
  thermal_energy_kwh double precision,
  electrical_energy_kwh double precision,
  thermal_energy_heating_kwh double precision,
  electrical_energy_heating_kwh double precision,
  outdoor_temperature_c double precision,
  flow_temperature_c double precision,
  outdoor_temperature_min_c double precision,
  outdoor_temperature_max_c double precision,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  is_manual_override boolean DEFAULT false,
  last_auto_calculated_at timestamp with time zone,
  CONSTRAINT monthly_values_pkey PRIMARY KEY (id),
  CONSTRAINT monthly_values_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT monthly_values_heating_id_fkey FOREIGN KEY (heating_id) REFERENCES public.heating_systems(heating_id)
);
CREATE TABLE public.users (
  user_id uuid NOT NULL,
  name text,
  api_key uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT users_pkey PRIMARY KEY (user_id),
  CONSTRAINT users_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);