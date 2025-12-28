import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { afterEach } from "vitest";

// Initialize i18next for tests
i18n.use(initReactI18next).init({
  lng: "en",
  fallbackLng: "en",
  ns: ["translation"],
  defaultNS: "translation",
  resources: {
    en: {
      translation: {
        common: {
          azTotal: "COP (total)",
          azHeating: "COP (heating)",
          temperature: "Temperature",
          outdoorTemperature: "Outdoor Temperature",
          flowTemperature: "Flow Temperature",
        },
      },
    },
  },
  interpolation: {
    escapeValue: false,
  },
});

// Cleanup after each test
afterEach(() => {
  cleanup();
});
