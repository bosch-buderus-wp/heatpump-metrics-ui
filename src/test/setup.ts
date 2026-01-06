import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { afterEach, beforeAll } from "vitest";

// Suppress console warnings from Nivo chart components during tests
// These are false positives from React's test renderer seeing Nivo's custom props
beforeAll(() => {
  const originalError = console.error;
  console.error = (...args: unknown[]) => {
    const message = String(args[0]);
    // Suppress known false positive warnings from Nivo components
    if (
      message.includes("React does not recognize") ||
      message.includes("Invalid ARIA attribute")
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

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
