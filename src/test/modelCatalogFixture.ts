import type { Tables } from "../types/database.types";
export const modelCatalogFixture: {
  families: Tables<"model_families">[];
  combinations: Tables<"model_combinations">[];
} = {
  families: [
    {
      id: "cs5800_6800",
      label: "CS5800i / CS6800i / WLW176i / WLW186i MB",
      sort_order: 0,
    },
    {
      id: "cs3800",
      label: "CS3800i / WLW166i MBB",
      sort_order: 1,
    },
    {
      id: "cs8800",
      label: "CS8800i / WLW186i MBE+",
      sort_order: 2,
    },
    {
      id: "cs7001",
      label: "CS7001i / WLW196i",
      sort_order: 3,
    },
    {
      id: "cs7400",
      label: "CS7400i / WLW196i S+",
      sort_order: 4,
    },
  ],
  combinations: [
    {
      model_family_id: "cs5800_6800",
      model_idu: "CS5800i_E",
      model_odu: "4",
      idu_label: "CS5800i E",
    },
    {
      model_family_id: "cs5800_6800",
      model_idu: "CS5800i_E",
      model_odu: "5",
      idu_label: "CS5800i E",
    },
    {
      model_family_id: "cs5800_6800",
      model_idu: "CS5800i_E",
      model_odu: "7",
      idu_label: "CS5800i E",
    },
    {
      model_family_id: "cs5800_6800",
      model_idu: "CS5800i_E",
      model_odu: "10",
      idu_label: "CS5800i E",
    },
    {
      model_family_id: "cs5800_6800",
      model_idu: "CS5800i_E",
      model_odu: "12",
      idu_label: "CS5800i E",
    },
    {
      model_family_id: "cs5800_6800",
      model_idu: "CS6800i_M",
      model_odu: "4",
      idu_label: "CS6800i M",
    },
    {
      model_family_id: "cs5800_6800",
      model_idu: "CS6800i_M",
      model_odu: "5",
      idu_label: "CS6800i M",
    },
    {
      model_family_id: "cs5800_6800",
      model_idu: "CS6800i_M",
      model_odu: "7",
      idu_label: "CS6800i M",
    },
    {
      model_family_id: "cs5800_6800",
      model_idu: "CS6800i_M",
      model_odu: "10",
      idu_label: "CS6800i M",
    },
    {
      model_family_id: "cs5800_6800",
      model_idu: "CS6800i_M",
      model_odu: "12",
      idu_label: "CS6800i M",
    },
    {
      model_family_id: "cs3800",
      model_idu: "CS3800i_AWEi",
      model_odu: "4",
      idu_label: "CS3800i AWEi",
    },
    {
      model_family_id: "cs3800",
      model_idu: "CS3800i_AWEi",
      model_odu: "6",
      idu_label: "CS3800i AWEi",
    },
    {
      model_family_id: "cs3800",
      model_idu: "CS3800i_AWEi",
      model_odu: "7",
      idu_label: "CS3800i AWEi",
    },
    {
      model_family_id: "cs3800",
      model_idu: "CS3800i_AWEi",
      model_odu: "10",
      idu_label: "CS3800i AWEi",
    },
    {
      model_family_id: "cs3800",
      model_idu: "CS3800i_AWEi",
      model_odu: "13",
      idu_label: "CS3800i AWEi",
    },
    {
      model_family_id: "cs8800",
      model_idu: "WLW186i_MBE_PLUS_E",
      model_odu: "11",
      idu_label: "WLW186i MBE+ E",
    },
    {
      model_family_id: "cs8800",
      model_idu: "WLW186i_MBE_PLUS_E",
      model_odu: "13",
      idu_label: "WLW186i MBE+ E",
    },
    {
      model_family_id: "cs8800",
      model_idu: "WLW186i_MBE_PLUS_E",
      model_odu: "15",
      idu_label: "WLW186i MBE+ E",
    },
    {
      model_family_id: "cs7001",
      model_idu: "CS7001i_AWE",
      model_odu: "5",
      idu_label: "CS7001i AWE",
    },
    {
      model_family_id: "cs7001",
      model_idu: "CS7001i_AWE",
      model_odu: "7",
      idu_label: "CS7001i AWE",
    },
    {
      model_family_id: "cs7001",
      model_idu: "CS7001i_AWE",
      model_odu: "9",
      idu_label: "CS7001i AWE",
    },
    {
      model_family_id: "cs7001",
      model_idu: "CS7001i_AWE",
      model_odu: "13",
      idu_label: "CS7001i AWE",
    },
    {
      model_family_id: "cs7001",
      model_idu: "CS7001i_AWE",
      model_odu: "17",
      idu_label: "CS7001i AWE",
    },
    {
      model_family_id: "cs7001",
      model_idu: "WLW196i_E",
      model_odu: "4",
      idu_label: "WLW196i E",
    },
    {
      model_family_id: "cs7001",
      model_idu: "WLW196i_E",
      model_odu: "6",
      idu_label: "WLW196i E",
    },
    {
      model_family_id: "cs7001",
      model_idu: "WLW196i_E",
      model_odu: "8",
      idu_label: "WLW196i E",
    },
    {
      model_family_id: "cs7001",
      model_idu: "WLW196i_E",
      model_odu: "11",
      idu_label: "WLW196i E",
    },
    {
      model_family_id: "cs7001",
      model_idu: "WLW196i_E",
      model_odu: "14",
      idu_label: "WLW196i E",
    },
    {
      model_family_id: "cs7400",
      model_idu: "CS7400i_AWE",
      model_odu: "5",
      idu_label: "CS7400i AWE",
    },
    {
      model_family_id: "cs7400",
      model_idu: "CS7400i_AWE",
      model_odu: "7",
      idu_label: "CS7400i AWE",
    },
    {
      model_family_id: "cs7400",
      model_idu: "WLW196i_S_PLUS_E",
      model_odu: "4",
      idu_label: "WLW196i S+ E",
    },
    {
      model_family_id: "cs7400",
      model_idu: "WLW196i_S_PLUS_E",
      model_odu: "6",
      idu_label: "WLW196i S+ E",
    },
  ],
};
